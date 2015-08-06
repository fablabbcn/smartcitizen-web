(function() {
  'use strict';

  angular.module('app.components')
    .directive('hidePopup', hidePopup);

    hidePopup.$inject = [];
    function hidePopup() {
      return {
        link: link
      };

      /////////////

      function link(scope, elem) {
        elem.on('mouseleave', function() {
          angular.element('.sensor_description_preview').show();
          angular.element('.sensor_description_full').hide();            
        });
      }
    }
})();
