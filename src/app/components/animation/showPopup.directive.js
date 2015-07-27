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
        element.on({
          mouseenter: function() {
            angular.element('.sensor_description_preview').hide();
            angular.element('.sensor_description_full').show();
          },
          mouseleave: function() {
            angular.element('.sensor_description_preview').show();
            angular.element('.sensor_description_full').hide();
          }
        }); 
      }
    }
})();
