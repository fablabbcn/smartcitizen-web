




  LoginController.$inject = ['$scope', '$mdDialog'];
export default function LoginController($scope, $mdDialog) {

    $scope.showLogin = showLogin;

    $scope.$on('showLogin', function() {
      showLogin();
    });

    ////////////////

    function showLogin() {
      $mdDialog.show({
        hasBackdrop: true,
        controller: 'LoginDialogController',
        templateUrl: 'app/components/login/loginModal.html',
        clickOutsideToClose: true
      });
    }

  }
