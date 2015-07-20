(function() {
  'use strict';

  angular.module('app.components')
    .controller('SignupDialogController', SignupDialogController);

    SignupDialogController.$inject = ['$scope', '$mdDialog', 'user', 'alert', 'animation'];
    function SignupDialogController($scope, $mdDialog, user, alert, animation) {

      $scope.answer = function(answer) {
        $scope.waitingFromServer = true;
        user.createUser(answer)
          .then(function(data) {
            alert.success('Signup was successful');
            $mdDialog.hide();
          })
          .catch(function(err) {
            alert.error('Signup failed');
            $scope.errors = err.data.errors;
          })
          .finally(function() {
            $scope.waitingFromServer = false;
          });
      };
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.openLogin = function() {
        animation.showLogin();
        $mdDialog.hide();
      };
    }
})();
