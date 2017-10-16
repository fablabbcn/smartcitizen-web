(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);

    MapController.$inject = ['$scope', '$state', '$timeout', 'device',
    '$mdDialog', 'leafletData', 'mapUtils', 'markerUtils', 'alert',
    'Marker', 'tag', 'animation'];
    function MapController($scope, $state, $timeout, device,
      $mdDialog, leafletData, mapUtils, markerUtils, alert, Marker, tag, animation) {
      var vm = this;
      var updateType;
      var focusedMarkerID;

      vm.markers = [];

      var retinaSuffix = isRetina() ? '512' : '256';
      var retinaLegacySuffix = isRetina() ? '@2x' : '';

      var mapBoxToken = 'pk.eyJ1IjoidG9tYXNkaWV6IiwiYSI6ImRTd01HSGsifQ.loQdtLNQ8GJkJl2LUzzxVg';

      vm.layers = {
        baselayers: {
          osm: {
            name: 'OpenStreetMap',
            type: 'xyz',
            url: 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/' + retinaSuffix + '/{z}/{x}/{y}?access_token=' + mapBoxToken 
          },
          legacy: {
            name: 'Legacy',
            type: 'xyz',
            url: 'https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}'+ retinaLegacySuffix +'.png' + '?access_token=' + mapBoxToken
          },
          sat: {
            name: 'Satellite',
            type: 'xyz',
            url: 'https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v10/tiles/' + retinaSuffix + '/{z}/{x}/{y}?access_token=' + mapBoxToken 
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
        var id = undefined;
        var currentMarker = vm.markers[data.modelName];

        if(currentMarker) {
          id = currentMarker.myData.id;
        }

        vm.kitLoading = true;
        vm.center.lat = data.leafletEvent.latlng.lat;
        vm.center.lng = data.leafletEvent.latlng.lng;

        if(id === parseInt($state.params.id)) {
          $timeout(function() {
            vm.kitLoading = false;
          });
          return;
        }

        updateType = 'map';

        var availability = data.leafletEvent.target.options.myData.labels[0];
        ga('send', 'event', 'Kit Marker', 'click', availability);

        $state.go('layout.home.kit', {id: id});

        // angular.element('section.map').scope().$broadcast('resizeMapHeight'); 
      });


      $scope.$on('leafletDirectiveMarker.popupclose', function() {
        if(focusedMarkerID) {
          var marker = vm.markers[focusedMarkerID];
          if(marker) {
            vm.markers[focusedMarkerID].focus = false;
          }
        }
      });

      vm.readyForKit = {
        kit: false,
        map: false
      };

      $scope.$on('kitLoaded', function(event, data) {
        vm.readyForKit.kit = data;
      });

      $scope.$watch('vm.readyForKit', function() {
        if (vm.readyForKit.kit && vm.readyForKit.map) {
          zoomKitAndPopUp(vm.readyForKit.kit);
        }
      }, true);

      $scope.$on('goToLocation', function(event, data) {
        goToLocation(event, data);
      });

      $scope.$on('leafletDirectiveMap.dragend', function(){
        reportMapInteractionByUser();
      });

      $scope.$on('leafletDirectiveMap.click', function(){
        reportMapInteractionByUser();
      });

      vm.filters = ['indoor', 'outdoor', 'online', 'offline'];

      vm.openFilterPopup = openFilterPopup;
      vm.openTagPopup = openTagPopup;
      vm.removeFilter = removeFilter;
      vm.removeTag = removeTag;
      vm.selectedTags = tag.getSelectedTags();
      vm.selectedFilters = ['indoor', 'outdoor', 'online', 'offline', 'new'];

      vm.checkAllFiltersSelected = checkAllFiltersSelected;

      initialize();

      /////////////////////

      function initialize() {
        vm.readyForKit.map = false;

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
            }

            updateMarkers();

            vm.readyForKit.map = true;

          });
      }

      function zoomKitAndPopUp(data){ 

        if(updateType === 'map') {
          vm.kitLoading = false;
          updateType = undefined;
          return;
        }
        
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
                        goToLocation(null, data, function(){
                            selectedMarker.options.focus = true;
                            selectedMarker.openPopup();                              
                        });
                      } 
                      vm.kitLoading = false;
                    });
                } else {
                  leafletData.getMap().then(function(map){
                    map.closePopup();
                  });
                }
            }); 
         }); 
       
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
          updateMapFilters();
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
          reloadWithTags();
        });
      }

      function updateMapFilters(){
          vm.selectedTags = tag.getSelectedTags();
          checkAllFiltersSelected();
          updateMarkers();
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
            var allMarkers = device.getWorldMarkers();

            var updatedMarkers = allMarkers;

            updatedMarkers = tag.filterMarkersByTag(updatedMarkers);
            updatedMarkers = filterMarkersByLabel(updatedMarkers);
            vm.markers = updatedMarkers;

            animation.mapStateLoaded();

            vm.kitLoading = false;

            zoomOnMarkers();
          });
        });
      }

      function getZoomLevel(data) {
        var LAYER_ZOOMS = [{name:'venue', zoom:18}, {name:'address', zoom:18}, {name:'neighbourhood', zoom:13}, {name:'locality', zoom:13}, {name:'localadmin', zoom:10}, {name:'county', zoom:10}, {name:'region', zoom:8}, {name:'country', zoom:7}, {name:'coarse', zoom:7}];
        if (!data.layer) {
          return 20;
        }
        return _.find(LAYER_ZOOMS, function(layer) {
          return layer.name === data.layer;
        }).zoom;
      }

      function reportMapInteractionByUser(){
        ga('send', 'event', 'Map', 'moved');
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

      function goToLocation(event, data, callback){
        // This isn't super nice but turns the event in to a kind off callback
        if (callback) {
          leafletData.getMap().then(function(map){
            map.on('moveend', function() {
              map.off('moveend');
              callback();
            });
          });
        }
        // This ensures the action runs after the event is registered
        $timeout(function() {
          vm.center.lat = data.lat;
          vm.center.lng = data.lng;
          vm.center.zoom = getZoomLevel(data);
        });
      }



      function removeTag(tagName){
        tag.setSelectedTags(_.filter(vm.selectedTags, function(el){
          return el !== tagName;
        }));

        vm.selectedTags = tag.getSelectedTags();

        if(vm.selectedTags.length === 0){
          reloadNoTags();
        } else {
          reloadWithTags();
        }

      }

      function zoomOnMarkers(){
        $timeout(function() {
          if(vm.markers && vm.markers.length > 0) {
              leafletData.getMap().then(function(map){
                  var bounds = L.latLngBounds(vm.markers);
                  map.fitBounds(bounds);
              });
          } else {
            alert.error('No markers found with those filters', 5000);
          }
        });
      }

      function reloadWithTags(){
        $state.transitionTo('layout.home.tags', {tags: vm.selectedTags}, {reload: true});
      }

      function reloadNoTags(){
        $state.transitionTo('layout.home.kit');
      }

    }

})();
