(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);
    
    MapController.$inject = ['$scope', '$state', '$timeout', 'location', 'initialMarkers', 'device', 'marker', '$mdDialog'];
    function MapController($scope, $state, $timeout, location, initialMarkers, device, marker, $mdDialog) {
    	var vm = this;
      var markers;

      console.log('ini', initialMarkers);
      var initialLocation = getLocation(initialMarkers[0]);
      vm.icons = getIcons();
      
      markers = augmentMarkers(initialMarkers);
      vm.markers = markers;
      vm.currentMarker = marker.getCurrentMarker();

      vm.tiles = {
        url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg'
      };
      //'https://a.tiles.mapbox.com/v4/tomasdiez.jnbhcnb2/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg'

      vm.layers = {
        baselayers: {
          osm: {
            name: 'OpenStreetMap',
            type: 'xyz',
            url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg'
          }
        },
        overlays: {
          realworld: {
            name: 'Real world data',
            type: 'markercluster',
            visible: true
          }
        }
      };

      vm.center = {
        lat: initialLocation.lat,
        lng: initialLocation.lng,
        zoom: 12
      };


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
        $state.go('home.kit', {id: id});        
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

      vm.filterData = {
        indoor: true,
        outdoor: true,
        online: true,
        offline: true
      };

      vm.openFilterPopup = openFilterPopup;
      vm.removeFilter = removeFilter;

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

        device.layer = 'realworld';        

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

      function openFilterPopup() {
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'MapFilterDialogController',
          templateUrl: 'app/components/map/mapFilterPopup.html',
          //targetEvent: ev,
          clickOutsideToClose: true,
          locals: {
            filterData: vm.filterData
          }
        })
        .then(function(data) {
          _.extend(vm.filterData, data);
          vm.markers = filterMarkers(data);
        })
        .finally(function() {
          //animation.unblur();
        });
      }

      function removeFilter(filterName) {
        vm.filterData[filterName] = false;
        vm.markers = filterMarkers(vm.filterData);
      }

      function filterMarkers(filterData) {
        return markers.filter(function(marker) {
          return filterData[marker.myData.labels.status] && filterData[marker.myData.labels.exposure];
        });
      }
    }

})();
