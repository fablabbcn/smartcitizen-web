(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);
    
    MapController.$inject = ['$scope', 'location', 'device'];
    function MapController($scope, location, device) {
    	var vm = this;
      getMarkers(location);

    	vm.center = {
        lat: location.lat,
        lng: location.lng,
        zoom: 12
    	};

    	vm.defaults = {
        scrollWheelZoom: false
    	};

    	vm.events = {
    	  map: {
    	  	enable: ['dragend', 'zoomend', 'moveend', 'popupopen', 'popupclose'],
    	  	logic: 'broadcast' // might have to use emit later
    	  }
    	};

    	vm.markers = [];

      /*$scope.$on('leafletDirectiveMap.dragend', function(){
          console.log('inside event handler');
          getMarkers(vm.center);
        });*/

      $scope.$on('leafletDirectiveMap.moveend', function(event) {
        console.log('inside movend', event);
        getMarkers(vm.center);
      });

      $scope.$on('leafletDirectiveMap.popupopen', function(eventt) {
        console.log('popup', event);
      });      
      
      /////////////////////

      function getMarkers(location) {
      	console.log('location', location);
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
    }
})();
