(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);
    
    MapController.$inject = ['$scope', 'location', 'initialMarkers', 'device'];
    function MapController($scope, location, initialMarkers, device) {
    	var vm = this;
      
      var initialLocation = getLocation(initialMarkers[0]);
      vm.icons = getIcons();
      initialMarkers = addIcons(initialMarkers);
      
      //console.log('one', initialMarkers[0]);

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
    	  	enable: ['dragend', 'zoomend', 'moveend', 'popupopen', 'popupclose', 'mousedown', 'dblclick', 'click', 'touchstart'],
    	  	logic: 'broadcast' // might have to use emit later
    	  }
    	};

      /*$scope.$on('leafletDirectiveMap.moveend', function(event) {
        console.log('inside movend', event);
        getMarkers(vm.center);
      });*/

      $scope.$on('leafletDirectiveMap.popupopen', function(event, otro) {
        vm.center = {
          lat: otro.leafletEvent.popup._latlng.lat,
          lng: otro.leafletEvent.popup._latlng.lng,
          zoom: otro.model.center.zoom
        };
      });      
      
      /*
       $scope.$on('leafletDirectiveMap.touchstart', function(event, otro) {
        console.log('touch', event, otro);
        alert('touch');
      });  
      $scope.$on('leafletDirectiveMap.mousedown', function(event) {
        console.log('popup', event);
        alert('click');
      });

      $scope.$on('leafletDirectiveMap.click', function(event) {
        console.log('popup', event);
        alert('click');
      });      

      $scope.$on('leafletDirectiveMap.dblclick', function(event) {
        console.log('popup', event);
        alert('dbclick');
      });*/

      /////////////////////

      function addIcons(devices) {
        return devices.map(function(device) {
          if(device.status === 'online') {
            device.icon = vm.icons.smartCitizenOnline;            
          } else if(device.status === 'offline') {
            device.icon = vm.icons.smartCitizenOffline;
          } else {
            device.icon = vm.icons.smartCitizenNormal;
          }
          return device;
        });
      }

      function getIcons() {
        var local_icons = {
          default_icon: {},
          smartCitizenNormal: {
            type: 'div',
            className: 'marker_normal',
            iconSize: [12, 12]
          },
          smartCitizenOnline: {
            type: 'div',
            className: 'marker_online',
            iconSize: [12, 12]
          },
          smartCitizenOffline: {
            type: 'div',
            className: 'marker_offline',
            iconSize: [12, 12]
          }
        };

        return local_icons;
      }

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

      function getAllMarkers() {
        device.getAllDevices()
          .then(function(data) {
            console.log('data', data);
            data = data.plain();

            var markers = data.map(function(device) {
              var obj = {
                lat: device.latitude,
                lng: device.longitude,
                message: 'Hola'
              };
              return obj;
            });

            vm.markers = markers;
          });
      }
    }
})();
