(function() {
  'use strict';

    angular.module('app.components')
      .directive('beta', beta);

    function beta() {
      return {
        scope: {
          show: '='
        },
        restrict: 'A',
        controller: 'BetaController',
        controllerAs: 'vm',
        templateUrl: 'app/components/beta/beta.html'
      };
    }
})();
