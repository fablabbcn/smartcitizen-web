(function() {
  'use strict';

  angular.module('app.components')
    .filter('filterLabel', filterLabel);


    function filterLabel() {
      return function(devices, targetLabel) {
        if(targetLabel === undefined) {
          return devices;
        }
        if(devices) {
          return _.filter(devices, function(device) {
            var containsLabel = device.systemTags.indexOf(targetLabel) !== -1;
            if(containsLabel) {
              return containsLabel;
            }
            // This should be fixed or polished in the future
            // var containsNewIfTargetIsOnline = targetLabel === 'online' && _.some(kit.labels, function(label) {return label.indexOf('new') !== -1;});
            // return containsNewIfTargetIsOnline;
          });
        }
      };
    }
})();
