(function() {
  'use strict';

  angular.module('app.components')
    .controller('PasswordResetDialogController', PasswordResetDialogController);

    PasswordResetDialogController.$inject = ['$scope', '$mdDialog', 'auth'];
    function PasswordResetDialogController($scope, $mdDialog, auth) {
      initialize();
      
      $scope.password = {
        newPassword: undefined,
        confirmPassword: undefined
      };
      $scope.isDifferent = false;

      $scope.answer = function(password) {
        console.log('pass', $scope.password);
        if(password.newPassword === password.confirmPassword) {
          $scope.isDifferent = false;
        } else {
          $scope.isDifferent = true;
          return;
        }

        auth.resetPassword()
          .then(function(data) {
            console.log('d', data)
          })  
          .catch(function(err) {
            console.log('err', err);
          });
      }
      $scope.cancel = function() {
        $mdDialog.hide();
      }
      $scope.hide = function() {
        $mdDialog.hide();
      }


      function initialize() {
        getUserData();
      }

      function getUserData() {

      }
    }
})();
