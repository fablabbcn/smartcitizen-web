(function() {
  'use strict';

  angular.module('app.components')
    .factory('markerUtils', markerUtils);

    markerUtils.$inject = ['deviceUtils', 'MARKER_ICONS'];
    function markerUtils(deviceUtils, MARKER_ICONS) {
      var service = {
        getIcon: getIcon,
        getMarkerIcon: getMarkerIcon,
      };
      _.defaults(service, deviceUtils);
      return service;

      ///////////////

      function getIcon(object) {
        var icon;
        var labels = deviceUtils.parseSystemTags(object);
        var isSCKHardware = deviceUtils.isSCKHardware(object);

        if(hasLabel(labels, 'offline')) {
          icon = MARKER_ICONS.markerSmartCitizenOffline;
        } else if (isSCKHardware) {
          icon = MARKER_ICONS.markerSmartCitizenOnline;
        } else {
          icon = MARKER_ICONS.markerExperimentalNormal;
        }
        return icon;
      }

      function hasLabel(labels, targetLabel) {
        return _.some(labels, function(label) {
          return label === targetLabel;
        });
      }

      function getMarkerIcon(marker, state) {
        var markerType = marker.icon.className;

        if(state === 'active') {
          marker.icon = MARKER_ICONS[markerType + 'Active'];
          marker.focus = true;
        } else if(state === 'inactive') {
          var targetClass = markerType.split(' ')[0];
          marker.icon = MARKER_ICONS[targetClass];
        }
        return marker;
      }
    }
})();
