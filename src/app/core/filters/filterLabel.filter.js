    export default function filterLabel() {
      return function(kits, targetLabel) {
        if(targetLabel === undefined) {
          return kits;
        }
        if(kits) {
          return _.filter(kits, function(kit) {
            var containsLabel = kit.labels.indexOf(targetLabel) !== -1;
            console.log(containsLabel);
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
