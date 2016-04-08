(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);

    MapController.$inject = ['$scope', '$state', '$timeout', 'device',
    '$mdDialog', 'leafletData', 'mapUtils', 'markerUtils', 'alert',
    'Marker', 'tag'];
    function MapController($scope, $state, $timeout, device,
      $mdDialog, leafletData, mapUtils, markerUtils, alert, Marker, tag) {
    	var vm = this;
      var updateType;
      var mapMoved = false;
      var kitLoaded = false;
      var mapClicked = false;
      var focusedMarkerID;

      vm.markers = [];
      vm.initialMarkers = [];

      var retinaSuffix = isRetina() ? '@2x' : '';

      vm.tiles = {
        url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}'+
          retinaSuffix +'.png' +
          '?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.' +
          'loQdtLNQ8GJkJl2LUzzxVg'
      };
      //previous tile -->'https://a.tiles.mapbox.com/v4/tomasdiez.jnbhcnb2/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg'

      vm.layers = {
        baselayers: {
          osm: {
            name: 'OpenStreetMap',
            type: 'xyz',
            url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/' +
              '{x}/{y}' + retinaSuffix + '.png' +
              '?access_token=pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.' +
              'loQdtLNQ8GJkJl2LUzzxVg'
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
        minZoom:2,
        worldCopyJump: true
    	};

    	vm.events = {
    	  map: {
    	  	enable: ['dragend', 'zoomend', 'moveend', 'popupopen', 'popupclose',
          'mousedown', 'dblclick', 'click', 'touchstart', 'mouseup'],
    	  	logic: 'broadcast'
    	  }
    	};

      $scope.$on('leafletDirectiveMarker.click', function(event, data) {
        // This is a bit ugly. Feels more like a hack.
        var id = vm.markers[data.modelName].myData.id;

        vm.kitLoading = true;
        vm.center.lat = data.leafletEvent.latlng.lat;
        vm.center.lng = data.leafletEvent.latlng.lng;

        if(id === parseInt($state.params.id)) {
          $timeout(function() {
            vm.kitLoading = false;
          }, 0);
          return;
        }

        updateType = 'map';

        var availability = data.leafletEvent.target.options.myData.labels[0];
        ga('send', 'event', 'Kit Marker', 'click', availability);

        $state.go('layout.home.kit', {id: id});

        angular.element('section.map').scope().$broadcast('resizeMapHeight');
      });

      $scope.$on('leafletDirectiveMarker.popupclose', function() {
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
        // This is what happens when the Kit loads!!
        goToLocation(null, data);
        $timeout(function() {
          leafletData.getMarkers()
            .then(function(markers) {
              var currentMarker = _.find(markers, function(marker) {
                return data.id === marker.options.myData.id;
              });

              var id = data.id;

              leafletData.getLayers()
                .then(function(layers) {
                  if(currentMarker){
                    layers.overlays.realworld.zoomToShowLayer(currentMarker,
                      function() {
                        var selectedMarker = currentMarker;

                        if(selectedMarker) {
                          selectedMarker.options.focus = true;
                          selectedMarker.openPopup();
                        }
                        if(!$scope.$$phase) {
                          $scope.$digest();
                        }

                        kitLoaded = true;

                      });
                  }
                });
            });
        }, 5000);

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

      vm.filters = ['indoor', 'outdoor', 'online', 'offline'];

      vm.openFilterPopup = openFilterPopup;
      vm.openTagPopup = openTagPopup;
      vm.removeFilter = removeFilter;
      vm.removeTag = removeTag;
      vm.selectedTags = tag.getSelectedTags();
      vm.selectedFilters = ['indoor', 'outdoor', 'online', 'offline'];

      vm.checkAllFiltersSelected = checkAllFiltersSelected;

      initialize();

      /////////////////////

      function initialize() {
        vm.markers = device.getWorldMarkers();
        vm.initialMarkers = vm.markers;
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

        checkTags();
        checkAllFiltersSelected();
      }

      function checkTags(){
        if(vm.selectedTags.length > 0){
          updateMarkers();
        }
      }

      function checkAllFiltersSelected() {
        var allFiltersSelected = _.every(vm.filters, function(filterValue) {
          return _.include(vm.selectedFilters, filterValue);
        });
        return allFiltersSelected;
      }

      function openFilterPopup() {
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'MapFilterDialogController as filterDialog',
          templateUrl: 'app/components/map/mapFilterPopup.html',
          //targetEvent: ev,
          clickOutsideToClose: true,
          locals: {
            selectedFilters: vm.selectedFilters
          }
        })
        .then(function(selectedFilters) {
          updateType = 'map';
          vm.selectedFilters = selectedFilters;
          updateMarkers();
          checkAllFiltersSelected();
          $timeout(function() {
            checkMarkersLeftOnMap();
          });
        });
      }

      function openTagPopup() {
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'MapTagDialogController as tagDialog',
          templateUrl: 'app/components/map/mapTagPopup.html',
          //targetEvent: ev,
          clickOutsideToClose: true,
          locals: {
            selectedTags: vm.selectedTags
          }
        })
        .then(function(selectedTags) {
          updateType = 'map';
          tag.setSelectedTags(_.pluck(selectedTags, 'name'));
          vm.selectedTags = tag.getSelectedTags();
          checkAllFiltersSelected();
          $timeout(function() {
            checkMarkersLeftOnMap();
          });
          reloadWithTags();
        });
      }

      function removeFilter(filterName) {
        vm.selectedFilters = _.filter(vm.selectedFilters, function(el){
          return el !== filterName;
        });
        if(vm.selectedFilters.length === 0){
          vm.selectedFilters = vm.filters;
        }
        updateMarkers();
      }

      function filterMarkersByLabel(tmpMarkers) {
        return tmpMarkers.filter(function(marker) {
          var labels = marker.myData.labels;
          if (labels.length === 0 && vm.selectedFilters.length !== 0){
            return false;
          }
          return _.every(labels, function(label) {
            return _.include(vm.selectedFilters, label);
          });
        });
      }

      function updateMarkers() {
        $timeout(function() {
          $scope.$apply(function() {
            var tmpMarkers = device.getWorldMarkers();
            tmpMarkers = filterMarkersByLabel(tmpMarkers);
            vm.markers = tag.filterMarkersByTag(tmpMarkers);
            var boundaries = getBoundaries(vm.markers);
            leafletData.getMap().then(function(map){
              map.fitBounds(boundaries);
            });
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
                    .then(function() {
                      var center = L.latLng(vm.center.lat, vm.center.lng);
                      var closestMarker = _.reduce(markers, function(closestMarkerSoFar, marker) {
                        var distanceToMarker = center.distanceTo(marker.getLatLng());
                        var distanceToClosest = center.distanceTo(closestMarkerSoFar.getLatLng());
                        return distanceToMarker < distanceToClosest ? marker : closestMarkerSoFar;
                      }, markers[0]);

                      if(closestMarker) {
                        zoomOutWhileNoMarker(layers, closestMarker);
                      } else {
                        alert.error('No markers found with those filters', 5000);
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
        if (!data.layer) {
          return 5;
        }
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

      function removeTag(tagName){
        tag.setSelectedTags(_.filter(vm.selectedTags, function(el){
          return el !== tagName;
        }));
        vm.selectedTags = tag.getSelectedTags();

        if(vm.selectedTags.length === 0){
          $state.transitionTo('layout.home.kit',
            {tags: vm.selectedTags},
            {
              inherit:false
            });
        }else{
          reloadWithTags();
        }
      }

      function reloadWithTags(){
        $state.transitionTo('layout.home.tags', {tags: vm.selectedTags});
      }

      function getBoundaries(markers){
        var minLat = markers[0].lat;
        var minLong = markers[0].lng;
        var maxLat = minLat;
        var maxLong = maxLong;

        _.forEach(markers, function(marker){
          minLat = _.min([minLat, marker.lat]);
          maxLat = _.max([maxLat, marker.lat]);
          minLong = _.min([minLong, marker.lng]);
          maxLong = _.max([maxLong, marker.lng]);
        });

        var margin = 0.0001;
        return L.latLngBounds(
          L.latLng(minLat-(minLat*margin), minLong-(minLong*margin)),
          L.latLng(maxLat+(maxLat*margin), maxLong+(maxLong*margin))
        );
      }
    }

})();
