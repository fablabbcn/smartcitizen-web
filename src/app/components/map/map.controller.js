(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);
    
    MapController.$inject = ['$scope', '$state', '$timeout', 'location', 'markers', 'device', 'marker', '$mdDialog', 'leafletData', 'mapUtils'];
    function MapController($scope, $state, $timeout, location, markers, device, marker, $mdDialog, leafletData, mapUtils) {
    	var vm = this;
      var updateType, focusedMarkerID;

      var initialLocation = markers[0];
      var markersByIndex = _.indexBy(markers, function(marker) {
        return marker.myData.id;
      });

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
            visible: true,
            layerOptions: {
              showCoverageOnHover: false            
            }
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

      $scope.$on('leafletDirectiveMarker.click', function(event, data) {
        vm.center.lat = data.leafletEvent.latlng.lat;
        vm.center.lng = data.leafletEvent.latlng.lng;
          // zoom: data.model.center.zoom

        updateType = 'map';
        var id = data.leafletEvent.target.options.myData.id; 
        $state.go('layout.home.kit', {id: id});
      });    

      $scope.$on('kitLoaded', function(event, data) {
        if(focusedMarkerID) {
          markersByIndex[focusedMarkerID].focus = false;          
        }
        if(updateType === 'map') {
          updateType = undefined;
          return;
        }

        vm.center.lat = data.lat;
        vm.center.lng = data.lng; 

        

        $timeout(function() {
          leafletData.getMarkers()
            .then(function(markers) {
              var currentMarker = _.find(markers, function(marker) {
                return data.id === marker.options.myData.id;
              });

              leafletData.getLayers()
                .then(function(layers) {
                  layers.overlays.realworld.__proto__.zoomToShowLayer.call(layers.overlays.realworld, currentMarker, function() {
                    $scope.$apply(function() {
                      var selectedMarker = markersByIndex[data.id];

                      if(selectedMarker) {
                        focusedMarkerID = data.id;
                        selectedMarker.focus = true; 
                      }
                    });
                  });
                });
            });
        }, 2000);
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
            filterData: vm.filterData
          }
        })
        .then(function(data, defaultFiltersFromModal) {
          _.extend(vm.filterData, data);
          _.extend(defaultFilters, defaultFiltersFromModal);
          updateMarkers(data);
          checkFiltersSelected();
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
    }

})();
