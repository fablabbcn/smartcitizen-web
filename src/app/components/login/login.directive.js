(function() {
  'use strict';

    angular.module('app.components')
      .directive('login', login);

    function login() {
      return {
        scope: {
          show: '='
        },
        restrict: 'A',
        controller: 'LoginController',
        controllerAs: 'vm',
        templateUrl: 'app/components/login/login.html'
      };
    }
})();
