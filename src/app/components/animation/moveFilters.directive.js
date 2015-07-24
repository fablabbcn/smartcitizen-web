(function() {
  'use strict';

  angular.module('app.components')
    .directive('moveFilters', moveFilters);

    moveFilters.$inject = ['$window'];
    function moveFilters($window) {
      return {
        link: link
      };

      function link(scope, elem) {
        var chartHeight;
        setTimeout(function() {
          chartHeight = angular.element('.kit_chart').height();          
        }, 1000);

        angular.element($window).on('scroll', function() {
          var windowPosition = document.body.scrollTop;
          if(chartHeight > windowPosition) {
            elem.css('bottom', 12 + windowPosition + 'px');
          }
        });
      }
    }
})();
