(function() {
  'use strict';

  angular.module('app.components')
    .controller('LoginDialogController', LoginDialogController);

    LoginDialogController.$inject = ['$scope', '$mdDialog', 'auth', 'alert', 'animation'];
    function LoginDialogController($scope, $mdDialog, auth, alert, animation) {

      $scope.answer = function(answer) {
        auth.login(answer)
          .then(function(data) {
            console.log('yes', data);
            var token = data.access_token;
            auth.saveToken(token);
            alert.success('Signup was successful');
            $mdDialog.hide();
          })
          .catch(function(err) {
            console.log('no');
            // console.log('err', err.data.errors);
            alert.error('Username or password incorrect');
            // $scope.errors = err.data.errors;
          });
      };
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.hide();
      };

      $scope.openSignup = function() {
        animation.showSignup();
        $mdDialog.hide();
      };

      $scope.openPasswordRecovery = function() {
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'PasswordRecoveryDialogController',
          templateUrl: 'app/components/passwordRecovery/passwordRecoveryModal.html',
          //targetEvent: ev,
          clickOutsideToClose: true
        })
        .then(function() {
          //signup(signupData);
        })
        .finally(function() {
          //animation.unblur();
        });
        $mdDialog.hide();
      };
    }
})();
