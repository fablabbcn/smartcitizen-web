(function() {
  'use strict';

  angular.module('app.components')
    .constant('MARKER_ICONS', {
      defaultIcon: {},
      smartCitizenNormal: {
        type: 'div',
        className: 'marker_normal',
        iconSize: [24, 24]
      },
      smartCitizenOnline: {
        type: 'div',
        className: 'marker_online',
        iconSize: [24, 24]
      },
      smartCitizenOffline: {
        type: 'div',
        className: 'marker_offline',
        iconSize: [24, 24]
      }
    });
})();
