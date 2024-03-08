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
    function EditKitController($scope, $element, $location, $timeout, $state, animation,
      auth, device, tag, alert, step, $stateParams, FullDevice) {

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
              hardwareName: vm.device.hardware.name
            };
            vm.markers = {
              main: {
                lat: vm.device.location.latitude,
                lng: vm.device.location.longitude,
                draggable: true
              }
            };

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
        submitForm(backToProfile, timewait.normal);
      }

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
          mac_address: "",
          /*jshint camelcase: false */
          user_tags: joinSelectedTags(),
        };

        vm.errors={};

        if(!vm.device.isSCK) {
          data.hardware_name_override = vm.deviceForm.hardwareName;
        }

        // Workaround for the mac_address bypass
        // If mac_address is "", we get an error on the request -> we use it for the newKit
        // If mac_address is null, no problem -> we use it for the
        if ($stateParams.step === "2") {
          data.mac_address = vm.deviceForm.macAddress ? vm.deviceForm.macAddress : "";
        } else {
          data.mac_address = vm.deviceForm.macAddress ? vm.deviceForm.macAddress : null;
        }

        device.updateDevice(vm.device.id, data)
          .then(
            function() {

              if (next){
                alert.success('Your kit was updated!');
              }

              device.updateContext().then(function(){
                if (next){
                  $timeout(next, delayTransition);
                }
              });
            })
            .catch(function(err) {
              if(err.data.errors) {
                vm.errors = err.data.errors;
                var message = Object.keys(vm.errors).map(function (key, _) {
                  return [key, vm.errors[key][0]].join(' '); }).join('');
                alert.error('Oups! Check the input. Something went wrong!');
                throw new Error('[Client:error] ' + message);
              }
              $timeout(function(){ }, timewait.long);
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
        $state.transitionTo('layout.myProfile.kits', $stateParams,
        { reload: false,
          inherit: false,
          notify: true
        });
      }

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
