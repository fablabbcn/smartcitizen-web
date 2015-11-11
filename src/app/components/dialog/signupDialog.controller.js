(function() {
  'use strict';

  angular.module('app.components')
    .controller('SignupDialogController', SignupDialogController);

    SignupDialogController.$inject = ['$scope', '$mdDialog', 'user',
      'alert', 'animation', '$location'];
    function SignupDialogController($scope, $mdDialog, user, 
      alert, animation, $location) {

      $scope.answer = function(answer) {

        if (!$scope.form.$valid){
          $scope.errors = {conditions: ['You have to accept our Terms and Conditions first']};
          return;
        }

        $scope.waitingFromServer = true;
        user.createUser(answer)
          .then(function(data) {
            alert.success('Signup was successful');
            $mdDialog.hide();
            ga('send', 'event', 'Signup', 'signed up');
          })
          .catch(function(err) {
            alert.error('Signup failed');
            $scope.errors = err.data.errors;
            ga('send', 'event', 'Signup', 'failed');
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
