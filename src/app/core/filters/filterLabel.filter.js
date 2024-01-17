(function() {
  'use strict';

  angular.module('app.components')
    .filter('filterLabel', filterLabel);


    function filterLabel() {
      return function(kits, targetLabel) {
        if(targetLabel === undefined) {
          return kits;
        }
        if(kits) {
          return _.filter(kits, function(kit) {
            var containsLabel = kit.labels.indexOf(targetLabel) !== -1;
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
