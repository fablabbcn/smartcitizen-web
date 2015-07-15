(function() {
  'use strict';

  angular.module('app.components')
    .constant('MARKER_ICONS', {
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
    });
})();
