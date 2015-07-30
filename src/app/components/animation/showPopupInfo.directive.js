(function() {
  'use strict';

  angular.module('app.components')
    .directive('showPopupInfo', showPopupInfo);

    showPopupInfo.$inject = [];
    function showPopupInfo() {
      return {
        link: link
      };

      //////


      function link(scope, elem) {
        elem.on('mouseenter', function() {
          angular.element('.sensor_data_description').css('display', 'inline-block');
        });
        elem.on('mouseleave', function() {
          angular.element('.sensor_data_description').css('display', 'none');
        });
      }
    }
})();
