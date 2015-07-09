(function() {
  'use strict';

  angular.module('app.components')
    .controller('PasswordRecoveryDialogController', PasswordRecoveryDialogController);

    PasswordRecoveryDialogController.$inject = ['$scope', 'animation', '$mdDialog', 'auth', 'alert'];
    function PasswordRecoveryDialogController($scope, animation, $mdDialog, auth, alert) {

      $scope.answer = function(answer) {
        //auth.
      };
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.recoverPassword = function() {
        $scope.waitingFromServer = true;
        var data = {
          username_or_email: $scope.input
        };
        auth.recoverPassword(data)
          .then(function() {
            alert.success('You were sent an email to recover your password');
            $mdDialog.hide()
          })
          .catch(function(err) {          
            alert.error('That username doesn\'t exist');
            $scope.errors = err.data;
          }); 
      };

      $scope.openSignup = function() {
        animation.showSignup();
        $mdDialog.hide();
      };
    }
})();
