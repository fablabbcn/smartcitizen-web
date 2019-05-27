(function() {
  'use strict';

  angular.module('app.components')
    .controller('LoginModalController', LoginModalController);

    LoginModalController.$inject = ['$scope', '$mdDialog', 'auth', 'animation'];
    function LoginModalController($scope, $mdDialog, auth, animation) {
      const vm = this;
      $scope.answer = function(answer) {
        $scope.waitingFromServer = true;
        auth.login(answer)
          .then(function(data) {
            /*jshint camelcase: false */
            var token = data.access_token;
            auth.saveToken(token);
            $mdDialog.hide();
          })
          .catch(function(err) {
            vm.errors = err.data;
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
