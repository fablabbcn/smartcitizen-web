import angular from 'angular';

    /**
     * Used on kit dashboard to hide popup with full sensor description
     *
     */

    hidePopup.$inject = [];
    export default function hidePopup() {
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
