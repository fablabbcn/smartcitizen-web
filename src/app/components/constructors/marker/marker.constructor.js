(function() {
  'use strict';

  angular.module('app.components')
    .factory('Marker', ['device', 'markerUtils', function(device, markerUtils) {

      function Marker(deviceData) {

        this.lat = markerUtils.parseCoordinates(deviceData).lat;
        this.lng = markerUtils.parseCoordinates(deviceData).lng;
        this.message = '<div class="popup"><div class="popup_top ' + markerUtils.classify(markerUtils.parseType(deviceData)) + '"><p class="popup_name">' + deviceData.name + '</p><p class="popup_type">' + markerUtils.parseType(deviceData) + '</p><p class="popup_time"><md-icon md-svg-src="./assets/images/update_icon.svg"></md-icon>' + moment(markerUtils.parseTime(deviceData)).fromNow() + '</p></div><div class="popup_bottom"><p class="popup_location"><md-icon md-svg-src="./assets/images/location_icon_dark.svg"></md-icon>' + markerUtils.parseLocation(deviceData) + '</p><div class="popup_labels"><span>' + markerUtils.parseLabels(deviceData).status + '</span><span>' + markerUtils.parseLabels(deviceData).exposure + '</span></div></div></div>';
        this.icon = markerUtils.getIcon(markerUtils.parseLabels(deviceData).status);
        this.layer = 'realworld'; 
        this.myData = {
          id: markerUtils.parseId(deviceData),         
          labels: markerUtils.parseLabels(deviceData)
        };
      }
      return Marker;

    }]);
})();
