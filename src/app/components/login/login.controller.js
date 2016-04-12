(function() {
  'use strict';

  angular.module('app.components')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$mdDialog'];
  function LoginController($scope, $mdDialog) {

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
})();
