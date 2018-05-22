import angular from 'angular';

    angular.module('app.components')
      .directive('signup', signup);

    function signup() {
      return {
        scope: {
          show: '=',
        },
        restrict: 'A',
        controller: 'SignupController',
        controllerAs: 'vm',
        templateUrl: 'app/components/signup/signup.html'
      };
    }

