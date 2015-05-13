(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);
    
    MapController.$inject = ['$scope', 'location', 'initialMarkers', 'device'];
    function MapController($scope, location, initialMarkers, device) {
    	var vm = this;
      
      var initialLocation = getLocation(initialMarkers[0]);

    	vm.center = {
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        zoom: 12
    	};

      vm.markers = initialMarkers;

    	vm.defaults = {
        scrollWheelZoom: false
    	};

    	vm.events = {
    	  map: {
    	  	enable: ['dragend', 'zoomend', 'moveend', 'popupopen', 'popupclose'],
    	  	logic: 'broadcast' // might have to use emit later
    	  }
    	};

      $scope.$on('leafletDirectiveMap.moveend', function(event) {
        console.log('inside movend', event);
        getMarkers(vm.center);
      });

      $scope.$on('leafletDirectiveMap.popupopen', function(event) {
        console.log('popup', event);
      });      
      
      /////////////////////

      function getMarkers(location) {
        device.getDevices(location)
  	      .then(function(data) {
  	        data = data.plain();

  	        var markers = data.map(function(device) {
              var obj = {
                lat: device.data.location.latitude,
                lng: device.data.location.longitude,
                message: 'Hola'
              };
              return obj;
  	        });
            vm.markers = [];
  	        vm.markers = markers;
  	      });
      }

      function getLocation(marker) {
        return marker;
      }
    }
})();
