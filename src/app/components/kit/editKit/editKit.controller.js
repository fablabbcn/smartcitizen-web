(function() {
  'use strict';

  // Taken from this answer on SO:
  // https://stackoverflow.com/questions/17893708/angularjs-textarea-bind-to-json-object-shows-object-object
  angular.module('app.components').directive('jsonText', function() {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function(scope, element, attr, ngModel){
        function into(input) {
          return JSON.parse(input);
        }
        function out(data) {
          return JSON.stringify(data);
        }
        ngModel.$parsers.push(into);
        ngModel.$formatters.push(out);
      }
    };
  });

  angular.module('app.components')
    .controller('EditKitController', EditKitController);

    EditKitController.$inject = ['$scope', '$element', '$location', '$timeout', '$state',
    'animation','auth','device', 'tag', 'alert', 'step', '$stateParams', 'FullDevice'];
    function EditKitController($scope, $element, $location, $timeout, $state, animation, auth, device, tag, alert, step, $stateParams, FullDevice) {

      var vm = this;

      // WAIT INTERVAL FOR USER FEEDBACK and TRANSITIONS (This will need to change)
      var timewait = {
          long: 5000,
          normal: 2000,
          short: 1000
      };

      vm.step = step;

      // KEY USER ACTIONS
      vm.submitFormAndKit = submitFormAndKit;
      // TODO: Refactor, remove
      // vm.submitFormAndNext = submitFormAndNext;
      vm.backToProfile = backToProfile;
      vm.backToDevice = backToDevice;
      vm.submitForm = submitForm;
      vm.goToStep = goToStep;
      vm.nextAction = 'save';

      // EXPOSURE SELECT
      vm.exposure = [
        {name: 'indoor', value: 1},
        {name: 'outdoor', value: 2}
      ];

      // FORM INFO
      vm.deviceForm = {};
      vm.device = undefined;

      $scope.clearSearchTerm = function() {
        $scope.searchTerm = '';
      };
      // The md-select directive eats keydown events for some quick select
      // logic. Since we have a search input here, we don't need that logic.
      $element.find('input').on('keydown', function(ev) {
          ev.stopPropagation();
      });

      $scope.$on('leafletDirectiveMarker.dragend', function(event, args){
        vm.deviceForm.location.lat = args.model.lat;
        vm.deviceForm.location.lng = args.model.lng;
      });

      // MAP CONFIGURATION
      var mapBoxToken = 'pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg';

      vm.getLocation = getLocation;
      vm.markers = {};
      vm.tiles = {
        url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/{z}/{x}/{y}?access_token=' + mapBoxToken
      };
      vm.defaults = {
        scrollWheelZoom: false
      };

      initialize();

      /////////////////

      function initialize() {
        var deviceID = $stateParams.id;

        animation.viewLoaded();
        getTags();

        if (!deviceID || deviceID === ''){
          return;
        }
        device.getDevice(deviceID)
          .then(function(deviceData) {
            vm.device = new FullDevice(deviceData);
            vm.userRole = auth.getCurrentUser().data.role;
            vm.deviceForm = {
              name: vm.device.name,
              exposure: findExposureFromLabels(vm.device.systemTags),
              location: {
                lat: vm.device.location.latitude,
                lng: vm.device.location.longitude,
                zoom: 16
              },
              is_private: vm.device.isPrivate,
              notify_low_battery: vm.device.notifications.lowBattery,
              notify_stopped_publishing: vm.device.notifications.stopPublishing,
              tags: vm.device.userTags,
              postprocessing: vm.device.postProcessing,
              description: vm.device.description,
              // TODO: Refactor, make sure that this is part of the form, only editable
              // if !vm.device.isSCK
              hardwareName: vm.device.hardware.name
            };
            vm.markers = {
              main: {
                lat: vm.device.location.latitude,
                lng: vm.device.location.longitude,
                draggable: true
              }
            };

            console.log(vm.device)

            // TODO: Refactor. Change based on new names for versions after refactor
            // This needs to be available in world_map as well
            // Double Check
            if (vm.device.isLegacy) {
              vm.deviceForm.macAddress = vm.device.macAddress;
            }
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
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            vm.deviceForm.location.lat = lat;
            vm.deviceForm.location.lng = lng;
            vm.markers.main.lat = lat;
            vm.markers.main.lng = lng;
          });
        });
      }

      function submitFormAndKit(){
        submitForm(toProfile, timewait.normal);
      }

      // TODO: Refactor, remove
      // function submitFormAndNext(){
      //   submitForm(openKitSetup, timewait.short);
      // }

      function submitForm(next, delayTransition) {
        var data = {
          name: vm.deviceForm.name,
          description: vm.deviceForm.description,
          postprocessing_attributes: vm.deviceForm.postprocessing,
          exposure: findExposure(vm.deviceForm.exposure),
          latitude: vm.deviceForm.location.lat,
          longitude: vm.deviceForm.location.lng,
          is_private: vm.deviceForm.is_private,
          notify_low_battery: vm.deviceForm.notify_low_battery,
          notify_stopped_publishing: vm.deviceForm.notify_stopped_publishing,
          /*jshint camelcase: false */
          user_tags: joinSelectedTags(),
        };

        if(!vm.device.isSCK) {
          data.hardware_name_override = vm.deviceForm.hardwareName;
        }

        // TODO: Refactor, bring this back once we have a way to create legacy
        // if(vm.device.isLegacy){
          if(!vm.deviceForm.macAddress || vm.deviceForm.macAddress === ''){
            /*jshint camelcase: false */
            data.mac_address = null;
          } else if(/([0-9A-Fa-f]{2}\:){5}([0-9A-Fa-f]{2})/.test(vm.deviceForm.macAddress)){
            /*jshint camelcase: false */
            data.mac_address = vm.deviceForm.macAddress;
          } else {
            /*jshint camelcase: false */
            var message = 'The mac address you entered is not a valid address';
            alert.error(message);
            data.mac_address = null;
            throw new Error('[Client:error] ' + message);
          // }
        }

        device.updateDevice(vm.device.id, data)
          .then(
            function() {
              // TODO: Refactor Check
              if (!vm.macAddress && $stateParams.step === 2) {
                alert.info.generic('Your kit was successfully updated but you will need to register the Mac Address later 🔧');
              } else if (next){
                alert.success('Your kit was successfully updated');
              }
              device.updateContext().then(function(){
                if (next){
                  $timeout(next, delayTransition);
                }
              });
            })
            .catch(function(err) {
              // TODO: Refactor - This doesn't take get checked
              if(err.data.errors.mac_address[0] === 'has already been taken') {
                alert.error('You are trying to register a kit that is already registered. Please, read <a href="http://docs.smartcitizen.me/#/start/how-do-i-register-again-my-sck">How do I register again my SCK?</a> or contact <a href="mailto:support@smartcitizen.me ">support@smartcitizen.me</a> for any questions.');
              }
              else {
                alert.error('There has been an error during kit set up');
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
        // TODO: Refactor Check
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

      // TODO: Refactor, remove
      // function openKitSetup() {
      //   $timeout($state.go('layout.kitEdit', {id:$stateParams.id, step:2}), timewait.short);
      // }

      function backToDevice(){
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
