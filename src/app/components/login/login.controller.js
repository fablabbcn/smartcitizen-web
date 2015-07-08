(function() {
  'use strict';

  angular.module('app.components')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$mdDialog', 'auth', 'alert'];
  function LoginController($scope, $mdDialog, auth, alert) {

    $scope.showLogin = showLogin;
    //$scope.login = login;

    $scope.$on('showLogin', function() {
      showLogin();
    });
    ////////////////

    function showLogin() {

      $mdDialog.show({
        hasBackdrop: true,
        controller: 'LoginDialogController',
        templateUrl: 'app/components/login/loginModal.html',
        //targetEvent: ev,
        clickOutsideToClose: true
      })
      .then(function() {
        //signup(signupData);
      })
      .finally(function() {
        //animation.unblur();
      });
    }

    /*
    function login(loginData) {
      auth.login.post(loginData)
        .then(function() {
          alert.success('Login was successful');
        })
        .catch(function(err) {
          //alert.error('Login failed');
          console.log('err', err.data.errors);
        });
    }
    */
  }
})();
