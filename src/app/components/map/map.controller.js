(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);

    MapController.$inject = ['$scope', '$state', '$timeout', 'device', 
    '$mdDialog', 'leafletData', 'mapUtils', 'markerUtils', 'alert', 'Marker'];
    function MapController($scope, $state, $timeout, device, 
      $mdDialog, leafletData, mapUtils, markerUtils, alert, Marker) {
    	var vm = this;
      var updateType;
      var mapMoved = false;
      var kitLoaded = false;
      var mapClicked = false;
      var focusedMarkerID;

      vm.markers = [];

      var retinaSuffix = isRetina() ? '@2x' : '';

      vm.tiles = {
        url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}'
          + retinaSuffix +'.png'
          + '?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.'
          + 'loQdtLNQ8GJkJl2LUzzxVg'
      };
      //previous tile -->'https://a.tiles.mapbox.com/v4/tomasdiez.jnbhcnb2/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg'

      vm.layers = {
        baselayers: {
          osm: {
            name: 'OpenStreetMap',
            type: 'xyz',
            url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/'
              + '{x}/{y}' + retinaSuffix + '.png'
              + '?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.'
              + 'loQdtLNQ8GJkJl2LUzzxVg'
          }
        },
        overlays: {
          realworld: {
            name: 'Devices',
            type: 'markercluster',
            visible: true,
            layerOptions: {
              showCoverageOnHover: false
            }
          }
        }
      };

      vm.center = {
        lat: 13.14950321154457,
        lng: -1.58203125,
        zoom: 2
      };


    	vm.defaults = {
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        minZoom:2
    	};

    	vm.events = {
    	  map: {
    	  	enable: ['dragend', 'zoomend', 'moveend', 'popupopen', 'popupclose', 'mousedown', 'dblclick', 'click', 'touchstart', 'mouseup'],
    	  	logic: 'broadcast'
    	  }
    	};

      $scope.$on('leafletDirectiveMarker.click', function(event, data) {
        var id = data.leafletEvent.target.options.myData.id;

        vm.kitLoading = true;
        vm.center.lat = data.leafletEvent.latlng.lat;
        vm.center.lng = data.leafletEvent.latlng.lng;

        if(id === parseInt($state.params.id)) {
          $timeout(function() {
            vm.kitLoading = false;
          }, 0);
          return;
        }

        focusedMarkerID = data.leafletEvent.target.options.myData.id;

        updateType = 'map';
        var id = data.leafletEvent.target.options.myData.id;

        var availability = data.leafletEvent.target.options.myData.labels[0];
        ga('send', 'event', 'Kit Marker', 'click', availability);

        $state.go('layout.home.kit', {id: id});
      });

      $scope.$on('leafletDirectiveMarker.popupclose', function(event, data) {
        if(focusedMarkerID) {
          var marker = vm.markers[focusedMarkerID];
          if(marker) {
            vm.markers[focusedMarkerID].focus = false;
          }
        }
      });

      $scope.$on('kitLoaded', function(event, data) {
        vm.kitLoading = false;
        if(updateType === 'map') {
          updateType = undefined;
          return;
        }

        goToLocation(null, data);

        $timeout(function() {
          leafletData.getMarkers()
            .then(function(markers) {
              var currentMarker = _.find(markers, function(marker) {
                return data.id === marker.options.myData.id;
              });

              leafletData.getLayers()
                .then(function(layers) {
                  if(currentMarker){
                    layers.overlays.realworld.zoomToShowLayer(currentMarker, function() {
                      var selectedMarker = currentMarker;

                      if(selectedMarker) {
                        selectedMarker.focus = true;
                      }
                      if(!$scope.$$phase) {
                        $scope.$digest();
                      }

                      kitLoaded = true;
                      
                    });
                  }
                });
            });
        }, 3000);

      });

      $scope.$on('goToLocation', function(event, data) {
        goToLocation(event, data);
      });

      $scope.$on('leafletDirectiveMap.moveend', function(){
        reportMapMove();
      });

      $scope.$on('leafletDirectiveMap.zoomend', function(){
        reportMapMove();
      });

      $scope.$on('leafletDirectiveMap.mousedown', function(){
        mapClicked = true;
      });

      var defaultFilters = {
        exposure: null,
        status: null
      };

      vm.filterData = {
        indoor: true,
        outdoor: true,
        online: true,
        offline: true
      };

      vm.openFilterPopup = openFilterPopup;
      vm.removeFilter = removeFilter;

      initialize();

      /////////////////////

      function initialize() {
        vm.markers = device.getWorldMarkers();
        device.getAllDevices()
          .then(function(data){
            if (!vm.markers || vm.markers.length === 0){
              vm.markers = _.chain(data)
                  .map(function(device) {
                    return new Marker(device);
                  })
                  .filter(function(marker) {
                    return !!marker.lng && !!marker.lat;
                  })
                  .tap(function(data) {
                    device.setWorldMarkers(data);
                  })
                  .value();
            }

            var markersByIndex = _.indexBy(vm.markers, function(marker) {
              return marker.myData.id;
            });

            if($state.params.id && markersByIndex[parseInt($state.params.id)]){
              focusedMarkerID = markersByIndex[parseInt($state.params.id)]
                                .myData.id;
            }else{
              if($state.params.id){
                alert.error('This kit cannot be located in the map ' +
                  'because its location has not been set up.');
              }
            }
          });

        checkFiltersSelected();
      }

      function checkFiltersSelected() {
        var allFiltersSelected = _.every(vm.filterData, function(filterValue) {
          return filterValue;
        });
        if(allFiltersSelected) {
          vm.allFiltersSelected = true;
        } else {
          vm.allFiltersSelected = false;
        }
      }

      function openFilterPopup() {
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'MapFilterDialogController',
          templateUrl: 'app/components/map/mapFilterPopup.html',
          //targetEvent: ev,
          clickOutsideToClose: true,
          locals: {
            filterData: vm.filterData,
            defaultFiltersFromController: defaultFilters
          }
        })
        .then(function(obj) {
          _.extend(vm.filterData, obj.data);
          _.extend(defaultFilters, obj.defaultFilters);
          updateMarkers(obj.data);
          checkFiltersSelected();
          $timeout(function() {
            checkMarkersLeftOnMap();
          });
        });
      }

      function removeFilter(filterName) {
        if(!mapUtils.canFilterBeRemoved(vm.filterData, filterName)) {
          return;
        }
        vm.filterData[filterName] = false;
        _.extend(defaultFilters, mapUtils.setDefaultFilters(vm.filterData, defaultFilters));
        updateMarkers(vm.filterData);
        checkFiltersSelected();
        $timeout(function() {
          checkMarkersLeftOnMap();
        });
      }

      function filterMarkers(filterData) {
        return markers.filter(function(marker) {
          var labels = marker.myData.labels;
          return _.every(labels, function(label) {
            return filterData[label];
          });
        });
      }

      function updateMarkers(filterData) {
        vm.markers = [];
        $timeout(function() {
          $scope.$apply(function() {
            vm.markers = filterMarkers(filterData);
          });
        });
      }

      function checkMarkersLeftOnMap() {
        return leafletData.getMarkers()
          .then(function(markers) {
            return leafletData.getLayers()
              .then(function(layers) {
                var isThereMarkers = mapContainsAnyMarker(layers, markers);

                if(!isThereMarkers) {
                  leafletData.getMap()
                    .then(function(map) {
                      var center = L.latLng(vm.center.lat, vm.center.lng);
                      var closestMarker = _.reduce(markers, function(closestMarkerSoFar, marker) {
                        var distanceToMarker = center.distanceTo(marker.getLatLng());
                        var distanceToClosest = center.distanceTo(closestMarkerSoFar.getLatLng());
                        return distanceToMarker < distanceToClosest ? marker : closestMarkerSoFar;
                      }, markers[0]);

                      if(closestMarker) {
                        zoomOutWhileNoMarker(layers, closestMarker);
                      } else {
                        alert.info('No markers found with those filters', 5000);
                      }
                    });
                }
              });
          });
      }
      function mapContainsAnyMarker(layers, data) {
        var bounds = layers.overlays.realworld._currentShownBounds;
        return _.some(data, function(marker) {
          return mapContainsMarker(bounds, marker);
        });
      }

      function mapContainsMarker(bounds, marker) {
        return bounds.contains(marker.getLatLng());
      }

      function zoomOutWhileNoMarker(layers, marker) {
        var bounds = layers.overlays.realworld._currentShownBounds;

        if(!mapContainsMarker(bounds, marker)) {
          zoomOutMap();
          leafletData.getLayers()
            .then(function(newLayers) {
              $timeout(function() {
                zoomOutWhileNoMarker(newLayers, marker);
              });
            });
        }
      }

      function zoomOutMap() {
        if(vm.center.zoom === 0) {
          return;
        }
        vm.center.zoom = vm.center.zoom - 3;
      }

      function getZoomLevel(data) {
        var LAYER_ZOOMS = [{name:'venue', zoom:18}, {name:'address', zoom:18}, {name:'neighbourhood', zoom:13}, {name:'locality', zoom:13}, {name:'localadmin', zoom:10}, {name:'county', zoom:10}, {name:'region', zoom:8}, {name:'country', zoom:7}, {name:'coarse', zoom:7}];
        if (!data.layer) return 5;
        return _.find(LAYER_ZOOMS, function(layer) {
          return layer.name === data.layer;
        }).zoom;
      }

      function reportMapMove(){
        if(kitLoaded && !mapMoved && mapClicked){
          ga('send', 'event', 'Map', 'moved');
          mapMoved = true;
        }
      }

      function isRetina(){
        return ((window.matchMedia &&
          (window.matchMedia('only screen and (min-resolution: 192dpi), ' +
            'only screen and (min-resolution: 2dppx), only screen and ' +
            '(min-resolution: 75.6dpcm)').matches ||
          window.matchMedia('only screen and (-webkit-min-device-pixel-ra' +
            'tio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only' +
            ' screen and (min--moz-device-pixel-ratio: 2), only screen and ' +
            '(min-device-pixel-ratio: 2)').matches)) ||
          (window.devicePixelRatio && window.devicePixelRatio >= 2)) &&
          /(iPad|iPhone|iPod|Apple)/g.test(navigator.userAgent);
      }

      function goToLocation(event, data){
        vm.center.lat = data.lat;
        vm.center.lng = data.lng;
        vm.center.zoom = getZoomLevel(data);
      }
    }

})();
