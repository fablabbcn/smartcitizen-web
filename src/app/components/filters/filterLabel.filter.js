(function() {
  'use strict';

  angular.module('app.components')
    .filter('filterLabel', filterLabel);


    function filterLabel() {
      return function(input, targetLabel) { 
        if(targetLabel === undefined) {
          return input;
        }
        if(input) {
          return _.filter(input, function(kit) {
            var containsLabel = kit.labels.indexOf(targetLabel) !== -1;
            if(containsLabel) {
              return containsLabel;
            }
            var containsNewIfTargetIsOnline = targetLabel === 'online' && _.some(kit.labels, function(label) {return label.indexOf('new') !== -1;});
            return containsNewIfTargetIsOnline;
          });
        }
      };
    }
})();
