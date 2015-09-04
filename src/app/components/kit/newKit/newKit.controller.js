(function() {
  'use strict';

  angular.module('app.components')
    .controller('NewKitController', NewKitController);

    NewKitController.$inject = ['$scope', 'animation'];
    function NewKitController($scope, animation) {
      var vm = this;

      vm.step = 1;

      // FORM INFO
      vm.kitForm = {
        name: undefined,
        elevation: undefined,
        exposure: undefined,
        location: undefined
      };
      vm.exposure = ['indoor', 'outdoor'];

      // MAP CONFIGURATION
      vm.markers = {
        main: {
          lat: undefined,
          lng: undefined,
          draggable: true
        }
      };

      vm.tiles = {
        url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg'
      };

      vm.defaults = {
        scrollWheelZoom: false
      };


      vm.kitForm.location = {
        lat: undefined,
        lng: undefined,
        zoom: 16
      };

      vm.getLocation = getLocation;

      initialize();

      //////////////

      function initialize() {
        animation.viewLoaded();
      }

      function getLocation() {
        navigator.geolocation.getCurrentPosition(function(position) {
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
    }
})();
