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
            console.log('data', data);
            alert.success('Signup was successful');
            $mdDialog.hide();
          })
          .catch(function(err) {
            alert.error('Signup failed');
            console.log('err', err.data.errors);
            $scope.errors = err.data.errors;
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
