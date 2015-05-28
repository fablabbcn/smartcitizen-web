(function() {
  'use strict';

  angular.module('app.components')
    .directive('chart', chart);

    chart.$inject = [];
    function chart() { 
      return {
        link: link,
        restrict: 'A'
      };

      function link() {
        
      }
    }

})();
