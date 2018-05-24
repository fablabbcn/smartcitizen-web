




    export default function login() {
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
