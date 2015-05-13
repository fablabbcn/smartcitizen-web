(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);
    
    MapController.$inject = ['$scope', 'location', 'device'];
    function MapController($scope, location, device) {
    	//var vm = this;
      getMarkers(location);

    	$scope.center = {
        lat: location.lat,
        lng: location.lng,
        zoom: 12
    	};

    	$scope.defaults = {
        scrollWheelZoom: false
    	};

    	$scope.events = {
    	  map: {
    	  	enable: ['drag'],
    	  	logic: 'emit'
    	  }
    	};

    	$scope.markers = [];

      $scope.$on('leafletDirectiveMap.drag', function(){
         console.log('inside event handler');
         getMarkers($scope.center);
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
            $scope.markers = [];
  	        $scope.markers = markers;
  	      });
      }
    }
})();
