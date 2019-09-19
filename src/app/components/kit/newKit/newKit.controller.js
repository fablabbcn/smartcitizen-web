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
      vm.kitForm = {
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

      // TAGS SELECT
      vm.tags = [];
      $scope.$watch('vm.tag', function(newVal, oldVal) {
        if(!newVal) {
          return;
        }
        // remove selected tag from select element
        vm.tag = undefined;

        var alreadyPushed = _.some(vm.kitForm.tags, function(tag) {
          return tag.id === newVal;
        });
        if(alreadyPushed) {
          return;
        }

        var tag = _.find(vm.tags, function(tag) {
          return tag.id === newVal;
        });
        vm.kitForm.tags.push(tag);
      });
      vm.removeTag = removeTag;

      // MAP CONFIGURATION
      vm.getLocation = getLocation;
      vm.tiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      });

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
            vm.kitForm.location.lat = position.coords.latitude;
            vm.kitForm.location.lng = position.coords.longitude;

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

      function removeTag(tagID) {
        vm.kitForm.tags = _.filter(vm.kitForm.tags, function(tag) {
          return tag.id !== tagID;
        });
      }

      function submitStepOne() {
        var data = {
          name: vm.kitForm.name,
          description: vm.kitForm.description,
          exposure: findExposure(vm.kitForm.exposure),
          latitude: vm.kitForm.location.lat,
          longitude: vm.kitForm.location.lng,
          is_private: vm.kitForm.is_private,
          /*jshint camelcase: false */
          user_tags: _.map(vm.kitForm.tags, 'name').join(',')
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
