




    export default function signup() {
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
