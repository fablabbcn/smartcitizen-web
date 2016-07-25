(function() {
  'use strict';

  angular.module('app.components')
    .controller('EditKitController', EditKitController);

    EditKitController.$inject = ['$scope', '$location', '$timeout', '$state',
    'animation', 'device', 'tag', 'alert', 'step', '$stateParams', 'FullKit', 'push'];
    function EditKitController($scope, $location, $timeout, $state, animation,
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

      vm.kitData = undefined;

      // EXPOSURE SELECT
      vm.exposure = [
        {name: 'indoor', value: 1},
        {name: 'outdoor', value: 2}
      ];

      // FORM INFO
      vm.kitForm = {};

      // TAGS SELECT
      vm.tags = [];
      $scope.$watch('vm.tag', function(newVal) {
        if(!newVal) {
          return;
        }
        // remove selected tag from select element
        vm.tag = undefined;

        var selectedTag = _.find(vm.tags, function(tag) {
          return tag.id === newVal;
        });

        var alreadyPushed = _.some(vm.kitForm.tags, function(tag) {
          return tag === selectedTag.name;
        });

        if(alreadyPushed) {
          return;
        }

        vm.kitForm.tags.push(selectedTag.name);
      });

      vm.removeTag = removeTag;

      // MAP CONFIGURATION
      vm.getLocation = getLocation;
      vm.markers = {};
      vm.tiles = {
        url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg'
      };
      vm.defaults = {
        scrollWheelZoom: false
      };

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
            vm.kitForm = {
              name: vm.kitData.name,
              exposure: findExposureFromLabels(vm.kitData.labels),
              location: {
                lat: vm.kitData.latitude,
                lng: vm.kitData.longitude,
                zoom: 16
              },
              tags: vm.kitData.userTags,
              description: vm.kitData.description
            };
            vm.markers = {
              main: {
                lat: vm.kitData.latitude,
                lng: vm.kitData.longitude,
                draggable: true
              }
            };

            vm.macAddress = vm.kitData.macAddress;

            push.device(vm.kitData.id, $scope);

          });
      }

      function getLocation() {
        window.navigator.geolocation.getCurrentPosition(function(position) {
          $scope.$apply(function() {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            vm.kitForm.location.lat = lat;
            vm.kitForm.location.lng = lng;
            vm.markers.main.lat = lat;
            vm.markers.main.lng = lng;
          });
        });
      }

      function removeTag(tagName) {
        vm.kitForm.tags = _.filter(vm.kitForm.tags, function(tag) {
          return tag !== tagName;
        });
      }

      function submitFormAndKit(){
        submitForm(toProfile, timewait.normal);
      }

      function submitFormAndKit1(){
        submitForm(backToKit, timewait.normal);
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
          /*jshint camelcase: false */
          user_tags: vm.kitForm.tags.join(',')
        };

        if(!vm.macAddress || vm.macAddress == ""){
          /*jshint camelcase: false */
          data.mac_address = null;
        } else if(/([0-9A-Fa-f]{2}\:){5}([0-9A-Fa-f]{2})/.test(vm.macAddress)){
          /*jshint camelcase: false */
          data.mac_address = vm.macAddress;
        } else {
          /*jshint camelcase: false */
          var message = 'The mac address you entered is not a valid address'
          alert.error(message);
          data.mac_address = null;
          throw new Error("[Client:error] " + message);
        }

        device.updateDevice(vm.kitData.id, data)
          .then(
            function() {
              if (!vm.macAddress && $stateParams.step == 2) { 
                alert.info.generic('Your kit was successfully updated but you will need to register the Mac Address later 🔧');
              } else {
                alert.success('Your kit was successfully updated');
              }
              ga('send', 'event', 'Kit', 'update');
              device.updateContext().then(function(){
                  if (next) $timeout(next, delayTransition);
              });
            })
            .catch(function(err) {
              if(err.data.errors.mac_address[0] === "has already been taken") {
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
            return labels.indexOf(n.name) != -1;
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
        if (!vm.macAddress && $stateParams.step == 2) { 
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
