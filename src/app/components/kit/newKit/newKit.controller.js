(function() {
  'use strict';

  angular.module('app.components')
    .controller('NewKitController', NewKitController);

    NewKitController.$inject = ['$scope', '$state', 'animation', 'device', 'tag', 'alert', 'auth', '$timeout'];
    function NewKitController($scope, $state, animation, device, tag, alert, auth, $timeout) {
      var vm = this;

      vm.step = 1;

      vm.submitStepOne = submitStepOne;
      vm.submitStepTwo = submitStepTwo;

      // FORM INFO
      vm.deviceForm = {
        name: undefined,
        exposure: undefined,
        location: {
          lat: undefined,
          lng: undefined,
          zoom: 16
        },
        is_private: false,
        tags: []
      };

      // EXPOSURE SELECT
      vm.exposure = [
        {name: 'indoor', value: 1},
        {name: 'outdoor', value: 2}
      ];

      $scope.$on('leafletDirectiveMarker.dragend', function(event, args){
        vm.deviceForm.location.lat = args.model.lat;
        vm.deviceForm.location.lng = args.model.lng;
      });

      // TAGS SELECT
      vm.tags = [];
      $scope.$watch('vm.tag', function(newVal, oldVal) {
        if(!newVal) {
          return;
        }
        // remove selected tag from select element
        vm.tag = undefined;

        var alreadyPushed = _.some(vm.deviceForm.tags, function(tag) {
          return tag.id === newVal;
        });
        if(alreadyPushed) {
          return;
        }

        var tag = _.find(vm.tags, function(tag) {
          return tag.id === newVal;
        });
        vm.deviceForm.tags.push(tag);
      });
      vm.removeTag = removeTag;

      // MAP CONFIGURATION

      var mapBoxToken = 'pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg';

      vm.getLocation = getLocation;
      vm.markers = {
        main: {
          lat: undefined,
          lng: undefined,
          draggable: true
        }
      };
      vm.tiles = {
        url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/{z}/{x}/{y}?access_token=' + mapBoxToken
      };
      vm.defaults = {
        scrollWheelZoom: false
      };

      vm.macAddress = undefined;

      initialize();

      //////////////

      function initialize() {
        animation.viewLoaded();
        getTags();
        vm.userRole = auth.getCurrentUser().data.role;
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

      function removeTag(tagID) {
        vm.deviceForm.tags = _.filter(vm.deviceForm.tags, function(tag) {
          return tag.id !== tagID;
        });
      }

      function submitStepOne() {
        var data = {
          name: vm.deviceForm.name,
          description: vm.deviceForm.description,
          exposure: findExposure(vm.deviceForm.exposure),
          latitude: vm.deviceForm.location.lat,
          longitude: vm.deviceForm.location.lng,
          is_private: vm.deviceForm.is_private,
          /*jshint camelcase: false */
          user_tags: _.map(vm.deviceForm.tags, 'name').join(',')
        };

        device.createDevice(data)
          .then(
            function(response) {
              alert.success('Your kit was created but has not been configured yet');
              device.updateContext().then(function(){
                auth.setCurrentUser('appLoad').then(function(){
                  $timeout($state.go('layout.kitEdit', {id:response.id, step:2}), 2000);
                });
              });
            },
            function(err) {
              vm.errors = err.data.errors;
              alert.error('There has been an error during kit set up');
            });
      }

      function submitStepTwo() {

      }

      function getTags() {
        tag.getTags()
          .then(function(tagsData) {
            vm.tags = tagsData;
          });
      }

      //TODO: move to utils
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
        }
      }
    }
})();
