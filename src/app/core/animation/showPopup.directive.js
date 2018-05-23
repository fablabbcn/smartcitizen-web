




    /**
     * Used on kit dashboard to open full sensor description
     */

    showPopup.$inject = [];
    export default function showPopup() {
      return {
        link: link
      };

      /////

      function link(scope, element) {
        element.on('click', function() {
          var text = angular.element('.sensor_description_preview').text();
          if(text.length < 140) {
            return;
          }
          angular.element('.sensor_description_preview').hide();
          angular.element('.sensor_description_full').show();
        });
      }
    }
