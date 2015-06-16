(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);
    
    MapController.$inject = ['$scope', '$state', '$timeout', 'location', 'initialMarkers', 'device', 'marker'];
    function MapController($scope, $state, $timeout, location, initialMarkers, device, marker) {
    	var vm = this;

      var initialLocation = getLocation(initialMarkers[0]);
      vm.icons = getIcons();

      vm.tiles = {
        url: 'https://a.tiles.mapbox.com/v4/tomasdiez.jnbhcnb2/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg'
      };

      vm.center = {
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        zoom: 12
    	};

      vm.markers = augmentMarkers(initialMarkers);

      vm.currentMarker = marker.getCurrentMarker();

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

      $scope.$on('leafletDirectiveMap.popupopen', function(event, data) {

        vm.center = {
          lat: data.leafletEvent.popup._latlng.lat,
          lng: data.leafletEvent.popup._latlng.lng,
          zoom: data.model.center.zoom
        };
        
        var id = data.leafletEvent.popup._source.options.myData.id; 
        $state.go('home.kit', {id: 2033});        
        //$state.go('home.kit', {id: id});
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
      */

      /////////////////////

      function augmentMarkers(devices) {
        return devices.map(function(device) {
          return augmentMarker(device, false);
        });
      }

      function augmentMarker(device) {
        if(device.status === 'offline') {
          device.icon = vm.icons.smartCitizenOffline;
        } else {
          device.icon = vm.icons.smartCitizenOnline;
        }        

        return device;
      }

      function getIcons() {
        var localIcons = {
          defaultIcon: {},
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

        return localIcons;
      }

      function getMarkers(location) {
        device.getDevices(location)
  	      .then(function(data) {
  	        data = data.plain();

  	        var markers = data.map(function(device) {
              var obj = {
                lat: device.data.location.latitude,
                lng: device.data.location.longitude,
                message: '<h1>' + vm.currentMarker + '</h1>',
                myData: {
                  id: device.id
                }
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
