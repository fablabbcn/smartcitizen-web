import angular from 'angular';

  angular.module('app.components')
    .directive('showPopup', showPopup);

    /**
     * Used on kit dashboard to open full sensor description
     */

    showPopup.$inject = [];
    function showPopup() {
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

