(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);
    
    MapController.$inject = ['$scope', '$state', '$timeout', 'location', 'initialMarkers', 'device', 'marker', 'utils'];
    function MapController($scope, $state, $timeout, location, initialMarkers, device, marker, utils) {
    	var vm = this;

      var initialLocation = getLocation(initialMarkers[0]);
      vm.icons = getIcons();

      /*vm.tiles = {
        url: ''
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
        //trigger spinner and hide data
        vm.center = {
          lat: data.leafletEvent.popup._latlng.lat,
          lng: data.leafletEvent.popup._latlng.lng,
          zoom: data.model.center.zoom
        };

        console.log('marker', data.leafletEvent.popup._source.options.myData.id);
        var id = data.leafletEvent.popup._source.options.myData.id; 
        $state.go('home.kit', {id: id});
      });

      /*$scope.$on('markerLoaded', function() {
        vm.currentMarker = marker.getCurrentMarker();
        //vm.currentMarker = augmentMarker(vm.currentMarker);
        console.log('current', vm.currentMarker);
        //remove spinner and show data       
      });*/      
      
      /*
       $scope.$on('leafletDirectiveMap.touchstart', function(event, otro) {
        console.log('touch', event, otro);
        alert('touch');
      });  
      $scope.$on('leafletDirectiveMap.mousedown', function(event) {
        console.log('popup', event);
        alert('click');
      });

      $scope.$on('leafletDirectiveMap.popupopen', function(event, data) {
        console.log('marker', data.leafletEvent.popup._source.options.myData.id);
        var id = data.leafletEvent.popup._source.options.myData.id;
        //$state.go('kit', {id: id});
        getDevice(id);
      });      

      $scope.$on('leafletDirectiveMap.dblclick', function(event) {
        console.log('popup', event);
        alert('dbclick');
      });*/

      /////////////////////

      function augmentMarkers(devices) {
        return devices.map(function(device) {
          return augmentMarker(device, false);
        });
      }

      function augmentMarker(device, isIndividual) {
        //isIndividual = isIndividual === undefined ? true : false; 

        //if(isIndividual) {
          //device.message = '<div class="popup_top"><p class="popup_name">' + vm.currentMarker.name + '</p><p class="popup_type">' + vm.currentMarker.kit.name + '</p><p class="popup_time">' + vm.currentMarker.updated_at + '</p></div><div class="popup_bottom"><p class="popup_location">' + utils.parseKitLocation(vm.currentMarker) + '</p><p>' + utils.parseKitLabels(vm.currentMarker) + '</p></div>'; 
        //} else {
          if(device.status === 'online') {
            device.icon = vm.icons.smartCitizenOnline;            
          } else if(device.status === 'offline') {
            device.icon = vm.icons.smartCitizenOffline;
          } else {
            device.icon = vm.icons.smartCitizenNormal;
          }        
        //}

        return device;
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
