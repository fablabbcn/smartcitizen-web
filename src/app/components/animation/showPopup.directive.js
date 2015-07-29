(function() {
  'use strict';

  angular.module('app.components')
    .directive('showPopup', showPopup);

    showPopup.$inject = [];
    function showPopup() {
      return {
        link: link
      };

      /////

      function link(scope, element) {
        element.on('click', function() {
          var text = angular.element('.sensor_description_preview')[0].innerText;
          if(text.length < 140) {
            return;
          }
          angular.element('.sensor_description_preview').hide();
          angular.element('.sensor_description_full').show();
        });
      }
    }
})();
