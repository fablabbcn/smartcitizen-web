(function() {
  'use strict';

  angular.module('app.components')
    .controller('tagsController', tagsController);

  tagsController.$inject = ['tag', '$scope', 'device', '$state', '$q',
    'PreviewDevice', 'animation'
  ];

  function tagsController(tag, $scope, device, $state, $q, PreviewDevice,
    animation) {

    var vm = this;

    vm.selectedTags = tag.getSelectedTags();
    vm.markers = [];
    vm.kits = [];
    vm.percActive = 0;

    initialize();

    /////////////////////////////////////////////////////////

    function initialize() {
      if(vm.selectedTags.length === 0){
        $state.transitionTo('layout.home.kit');
      }

      if (device.getWorldMarkers()) {
        // If the user has already loaded a prev page and has markers in mem or localstorage
        updateSelectedTags();
      } else {
        // If the user is new we wait the map to load the markers
        $scope.$on('mapStateLoaded', function(event, data) {
          updateSelectedTags();
        });
      }

    }

    function updateSelectedTags(){

      vm.markers = tag.filterMarkersByTag(device.getWorldMarkers());

      var onlineMarkers = _.filter(vm.markers, isOnline);
      if (vm.markers.length === 0) {
        vm.percActive = 0;
      } else {
        vm.percActive = Math.floor(onlineMarkers.length / vm.markers.length *
          100);
      }

      animation.viewLoaded();

      getTaggedDevices()
        .then(function(res){
          vm.kits = res;
        });
    }


    function isOnline(marker) {
      return _.includes(marker.myData.labels, 'online');
    }

    function descLastUpdate(o) {
        return -new Date(o.last_reading_at).getTime();
    }

    function getTaggedDevices() {

      var deviceProm = _.map(vm.markers, getMarkerDevice);

      return $q.all(deviceProm)
        .then(function(devices) {
          return _.map(_.sortBy(devices, descLastUpdate), toPreviewDevice); // This sort is temp
        });
    }

    function toPreviewDevice(dev) {
      return new PreviewDevice(dev);
    }

    function getMarkerDevice(marker) {
      return device.getDevice(marker.myData.id);
    }
  }

})();
