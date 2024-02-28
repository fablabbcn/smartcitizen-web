(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapController', MapController);

    MapController.$inject = ['$scope', '$state', '$stateParams', '$timeout', 'device',
    '$mdDialog', 'leafletData', 'alert',
    'Marker', 'tag', 'animation', '$q'];
    function MapController($scope, $state, $stateParams, $timeout, device,
      $mdDialog, leafletData, alert, Marker, tag, animation, $q) {
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
          devices: {
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
        lat: $stateParams.lat ? parseInt($stateParams.lat, 10) : 13.14950321154457,
        lng: $stateParams.lng ? parseInt($stateParams.lng, 10) : -1.58203125,
        zoom: $stateParams.zoom ? parseInt($stateParams.zoom, 10) : 2
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
        var id = undefined;
        var currentMarker = vm.markers[data.modelName];

        if(currentMarker) {
          id = currentMarker.myData.id;
        }

        vm.deviceLoading = true;
        vm.center.lat = data.leafletEvent.latlng.lat;
        vm.center.lng = data.leafletEvent.latlng.lng;

        if(id === parseInt($state.params.id)) {
          $timeout(function() {
            vm.deviceLoading = false;
          });
          return;
        }

        updateType = 'map';

        if ($state.$current.name === 'embbed') { return; }
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

      vm.readyForDevice = {
        device: false,
        map: false
      };

      $scope.$on('deviceLoaded', function(event, data) {
        vm.readyForDevice.device = data;
      });

      $scope.$watch('vm.readyForDevice', function() {
        if (vm.readyForDevice.device && vm.readyForDevice.map) {
          zoomDeviceAndPopUp(vm.readyForDevice.device);
        }
      }, true);

      $scope.$on('goToLocation', function(event, data) {
        goToLocation(data);
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

        vm.readyForDevice.map = false;

        $q.all([device.getAllDevices($stateParams.reloadMap)])
          .then(function(data){

            data = data[0];

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

            var markersByIndex = _.keyBy(vm.markers, function(marker) {
              return marker.myData.id;
            });

            if($state.params.id && markersByIndex[parseInt($state.params.id)]){
              focusedMarkerID = markersByIndex[parseInt($state.params.id)]
                                .myData.id;
              vm.readyForDevice.map = true;
            } else {
              updateMarkers();
              vm.readyForDevice.map = true;
            }

          });
      }

      function zoomDeviceAndPopUp(data){

        if(updateType === 'map') {
          vm.deviceLoading = false;
          updateType = undefined;
          return;
        } else {
          vm.deviceLoading = true;
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
                  layers.overlays.devices.zoomToShowLayer(currentMarker,
                    function() {
                      var selectedMarker = currentMarker;
                      if(selectedMarker) {
                        // Ensures the marker is not just zoomed but the marker is centered to improve UX
                        // The $timeout can be replaced by an event but tests didn't show good results
                        $timeout(function() {
                          vm.center.lat = selectedMarker.options.lat;
                          vm.center.lng = selectedMarker.options.lng;
                          selectedMarker.openPopup();
                          vm.deviceLoading = false;
                        }, 1000);
                      }
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
          return _.includes(vm.selectedFilters, filterValue);
        });
        return allFiltersSelected;
      }

      function openFilterPopup() {
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'MapFilterModalController',
          controllerAs: 'vm',
          templateUrl: 'app/components/map/mapFilterModal.html',
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
          controller: 'MapTagModalController',
          controllerAs: 'vm',
          templateUrl: 'app/components/map/mapTagModal.html',
          //targetEvent: ev,
          clickOutsideToClose: true,
          locals: {
            selectedTags: vm.selectedTags
          }
        })
        .then(function(selectedTags) {
          if (selectedTags && selectedTags.length > 0) {
            updateType = 'map';
            tag.setSelectedTags(_.map(selectedTags, 'name'));
            vm.selectedTags = tag.getSelectedTags();
            reloadWithTags();
          } else if (selectedTags === null) {
            reloadNoTags();
          }
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
            return _.includes(vm.selectedFilters, label);
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

            vm.deviceLoading = false;

            zoomOnMarkers();
          });
        });
      }

      function getZoomLevel(data) {
        // data.layer is an array of strings like ["establishment", "point_of_interest"]
        var zoom = 18;

        if(data.layer && data.layer[0]) {
          switch(data.layer[0]) {
            case 'point_of_interest':
              zoom = 18;
              break;
            case 'address':
              zoom = 18;
              break;
            case "establishment":
              zoom = 15;
              break;
            case 'neighbourhood':
              zoom = 13;
              break;
            case 'locality':
              zoom = 13;
              break;
            case 'localadmin':
              zoom = 9;
              break;
            case 'county':
              zoom = 9;
              break;
            case 'region':
              zoom = 8;
              break;
            case 'country':
              zoom = 7;
              break;
            case 'coarse':
              zoom = 7;
              break;
          }
        }

        return zoom;
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

      function goToLocation(data){
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
