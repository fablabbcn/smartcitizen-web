(function() {
  'use strict';

  angular.module('app.components')
    .controller('LoginModalController', LoginModalController);

    LoginModalController.$inject = ['$scope', '$mdDialog', 'auth', 'alert', 'animation'];
    function LoginModalController($scope, $mdDialog, auth, alert, animation) {

      $scope.answer = function(answer) {
        $scope.waitingFromServer = true;
        auth.login(answer)
          .then(function(data) {
            /*jshint camelcase: false */
            var token = data.access_token;
            auth.saveData(token);
            $mdDialog.hide();
          })
          .catch(function() {
            alert.error('Username or password incorrect');
            ga('send', 'event', 'Login', 'logged in');
          })
          .finally(function() {
            $scope.waitingFromServer = false;
            ga('send', 'event', 'Login', 'failed');
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
          controller: 'PasswordRecoveryModalController',
          templateUrl: 'app/components/passwordRecovery/passwordRecoveryModal.html',
          clickOutsideToClose: true
        });

        $mdDialog.hide();
      };
    }
})();
