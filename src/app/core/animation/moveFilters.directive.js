(function() {
  'use strict';

  angular.module('app.components')
    .directive('moveFilters', moveFilters);

    /**
     * Moves map filters when scrolling
     * 
     */
    moveFilters.$inject = ['$window', '$timeout'];
    function moveFilters($window, $timeout) {
      return {
        link: link
      };

      function link(scope, elem) {
        var chartHeight;
        var kitOverviewHeight;
        var kitMenuHeight;
        $timeout(function() {
          chartHeight = angular.element('.kit_chart').height();    
          kitOverviewHeight = angular.element('.kit_overview').height();    
          kitMenuHeight = angular.element('.kit_menu').height();
        }, 1000);

        angular.element($window).on('scroll', function() {
          var windowPosition = document.body.scrollTop;
          if(chartHeight > windowPosition) {
            elem.css('bottom', 12 + windowPosition + kitMenuHeight + kitOverviewHeight + 'px');
          }
        });
      }
    }
})();
