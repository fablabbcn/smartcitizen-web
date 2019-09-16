(function() {
  'use strict';

  angular.module('app.components')
    .controller('EditKitController', EditKitController);

    EditKitController.$inject = ['$scope', '$element', '$location', '$timeout', '$state',
    'animation','auth','device', 'tag', 'alert', 'step', '$stateParams', 'FullKit', 'push'];
    function EditKitController($scope, $element, $location, $timeout, $state, animation, auth,
     device, tag, alert, step, $stateParams, FullKit, push) {

      var vm = this;

      // WHAIT INTERVAL FOR USER FEEDBACK and TRANSITIONS (This will need to change)
      var timewait = {
          long: 5000,
          normal: 2000,
          short: 1000
      };

      vm.step = step;

      // KEY USER ACTIONS
      vm.submitFormAndKit = submitFormAndKit;
      vm.submitFormAndNext = submitFormAndNext;
      vm.backToProfile = backToProfile;
      vm.submitForm = submitForm;
      vm.goToStep = goToStep;
      vm.nextAction = 'save';

      // EXPOSURE SELECT
      vm.exposure = [
        {name: 'indoor', value: 1},
        {name: 'outdoor', value: 2}
      ];

      // FORM INFO
      vm.kitForm = {};
      vm.kitData = undefined;

      $scope.clearSearchTerm = function() {
        $scope.searchTerm = '';
      };
      // The md-select directive eats keydown events for some quick select
      // logic. Since we have a search input here, we don't need that logic.
      $element.find('input').on('keydown', function(ev) {
          ev.stopPropagation();
      });

      // MAP CONFIGURATION
      vm.getLocation = getLocation;
      vm.tiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      });

      initialize();

      /////////////////

      function initialize() {
        var kitID = $stateParams.id;

        animation.viewLoaded();
        getTags();

        if (!kitID || kitID === ''){
          return;
        }
        device.getDevice(kitID)
          .then(function(deviceData) {
            vm.kitData = new FullKit(deviceData);
            vm.userRole = auth.getCurrentUser().data.role;
            vm.kitForm = {
              name: vm.kitData.name,
              exposure: findExposureFromLabels(vm.kitData.labels),
              location: {
                lat: vm.kitData.latitude,
                lng: vm.kitData.longitude,
                zoom: 16
              },
              is_private: deviceData.is_private,
              notify_low_battery: deviceData.notify_low_battery,
              notify_stopped_publishing: deviceData.notify_stopped_publishing,
              tags: vm.kitData.userTags,
              description: vm.kitData.description
            };

            if(!vm.kitData.version || vm.kitData.version.id === 2 || vm.kitData.version.id === 3){
              vm.setupAvailable = true;
            }

            vm.macAddress = vm.kitData.macAddress;

            push.device(vm.kitData.id, $scope);

          });
      }

      // Return tags in a comma separated list
      function joinSelectedTags(){
        let tmp = []
        $scope.selectedTags.forEach(function(e){
          tmp.push(e.name)
        })
        return tmp.join(', ');
      }

      function getLocation() {
        window.navigator.geolocation.getCurrentPosition(function(position) {
          $scope.$apply(function() {

            if (vm.kitData.latitude === null || vm.kitData.longitude === null) {
              vm.kitForm.location.lat = position.coords.latitude;
              vm.kitForm.location.lng = position.coords.longitude;
            }
            else {
              vm.kitForm.location.lat = vm.kitData.latitude;
              vm.kitForm.location.lng = vm.kitData.longitude;
            }

            vm.map = L.map('mapid').setView([vm.kitForm.location.lat, vm.kitForm.location.lng], 13);
            vm.tiles.addTo(vm.map);
            vm.marker = L.marker([vm.kitForm.location.lat, vm.kitForm.location.lng],{
              draggable: 'true'
            }).addTo(vm.map);
            vm.map.on('click', onMapClick);

            function onMapClick(e) {
              vm.kitForm.location.lat = e.latlng.lat;
              vm.kitForm.location.lng = e.latlng.lng;
              vm.marker.setLatLng(e.latlng, {
                draggable: 'true'
              });
            }
          });
        });
      }

      function submitFormAndKit(){
        submitForm(toProfile, timewait.normal);
      }

      function submitFormAndNext(){
        submitForm(openKitSetup, timewait.short);
      }

      function submitForm(next, delayTransition) {
        var data = {
          name: vm.kitForm.name,
          description: vm.kitForm.description,
          exposure: findExposure(vm.kitForm.exposure),
          latitude: vm.kitForm.location.lat,
          longitude: vm.kitForm.location.lng,
          is_private: vm.kitForm.is_private,
          notify_low_battery: vm.kitForm.notify_low_battery,
          notify_stopped_publishing: vm.kitForm.notify_stopped_publishing,
          /*jshint camelcase: false */
          user_tags: joinSelectedTags()
        };

        if(!vm.macAddress || vm.macAddress === ''){
          /*jshint camelcase: false */
          data.mac_address = null;
        } else if(/([0-9A-Fa-f]{2}\:){5}([0-9A-Fa-f]{2})/.test(vm.macAddress)){
          /*jshint camelcase: false */
          data.mac_address = vm.macAddress;
        } else {
          /*jshint camelcase: false */
          var message = 'The mac address you entered is not a valid address';
          alert.error(message);
          data.mac_address = null;
          throw new Error('[Client:error] ' + message);
        }

        device.updateDevice(vm.kitData.id, data)
          .then(
            function() {
              if (!vm.macAddress && $stateParams.step === 2) {
                alert.info.generic('Your kit was successfully updated but you will need to register the Mac Address later 🔧');
              } else if (next){
                alert.success('Your kit was successfully updated');
              }
              ga('send', 'event', 'Kit', 'update');
              device.updateContext().then(function(){
                if (next){
                  $timeout(next, delayTransition);
                }
              });
            })
            .catch(function(err) {
              if(err.data.errors.mac_address[0] === 'has already been taken') {
                alert.error('You are trying to register a kit that is already registered. Please, read <a href="http://docs.smartcitizen.me/#/start/how-do-i-register-again-my-sck">How do I register again my SCK?</a> or contact <a href="mailto:support@smartcitizen.me ">support@smartcitizen.me</a> for any questions.');
                ga('send', 'event', 'Kit', 'unprocessable entity');
              }
              else {
                alert.error('There has been an error during kit set up');
                ga('send', 'event', 'Kit', 'update failed');
              }
              $timeout(function(){ },timewait.long);
            });
      }

      function findExposureFromLabels(labels){
        var label = vm.exposure.filter(function(n) {
            return labels.indexOf(n.name) !== -1;
        })[0];
        if(label) {
          return findExposure(label.name);
        } else {
          return findExposure(vm.exposure[0].name);
        }
      }

      function findExposure(nameOrValue) {
        var findProp, resultProp;

        //if it's a string
        if(isNaN(parseInt(nameOrValue))) {
          findProp = 'name';
          resultProp = 'value';
        } else {
          findProp = 'value';
          resultProp = 'name';
        }

        var option = _.find(vm.exposure, function(exposureFromList) {
          return exposureFromList[findProp] === nameOrValue;
        });
        if(option) {
          return option[resultProp];
        } else {
          return vm.exposure[0][resultProp];
        }
      }

      function getTags() {
        tag.getTags()
          .then(function(tagsData) {
            vm.tags = tagsData;
          });
      }

      function backToProfile(){
        if (!vm.macAddress && $stateParams.step === 2) {
          alert.info.generic('Remember you will need to register the Mac Address later 🔧');
          $timeout(toProfile, timewait.normal);
        } else {
          toProfile();
        }
      }

      function toProfile(){
        $state.transitionTo('layout.myProfile.kits', $stateParams,
        { reload: false,
          inherit: false,
          notify: true
        });
      }

      function openKitSetup() {
        $timeout($state.go('layout.kitEdit', {id:$stateParams.id, step:2}), timewait.short);
      }

      function backToKit(){
        $state.transitionTo('layout.home.kit', $stateParams,
        { reload: false,
          inherit: false,
          notify: true
        });
      }

      function goToStep(step) {
        vm.step = step;
        $state.transitionTo('layout.kitEdit', { id:$stateParams.id, step: step} ,
        {
          reload: false,
          inherit: false,
          notify: false
        });
      }


    }
})();
