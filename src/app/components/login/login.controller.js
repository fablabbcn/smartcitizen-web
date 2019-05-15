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
        fullscreen: true,
        controller: 'LoginModalController',
        controllerAs: 'vm',
        templateUrl: 'app/components/login/loginModal.html',
        clickOutsideToClose: true
      });
    }

  }
})();
