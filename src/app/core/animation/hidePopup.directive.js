(function() {
  'use strict';

  angular.module('app.components')
    .directive('hidePopup', hidePopup);

    /**
     * Used on kit dashboard to hide popup with full sensor description
     * 
     */
    
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
