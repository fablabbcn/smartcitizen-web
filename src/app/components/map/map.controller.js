(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);
    
    MapController.$inject = ['location', 'device'];
    function MapController(location, device) {
    	var vm = this;

    	vm.center = {
        lat: location.lat,
        lng: location.lng,
        zoom: 12
    	};

    	vm.defaults = {
        scrollWheelZoom: false
    	};

    	vm.markers = [];
      
      getMarkers();
      /////////////////////

      function getMarkers() {
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

  	        vm.markers = markers;
  	      });
      }
    }
})();
