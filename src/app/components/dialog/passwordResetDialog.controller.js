(function() {
  'use strict';

  angular.module('app.components')
    .controller('PasswordResetDialogController', PasswordResetDialogController);

    PasswordResetDialogController.$inject = ['$scope', '$mdDialog', '$stateParams', '$location', 'auth', alert];
    function PasswordResetDialogController($scope, $mdDialog, $stateParams, $location, auth, alert) {
      initialize();
      
      $scope.password = {
        newPassword: undefined,
        confirmPassword: undefined
      };
      $scope.isDifferent = false;

      $scope.answer = function(data) {
        if(data.newPassword === data.confirmPassword) {
          $scope.isDifferent = false;
        } else {
          $scope.isDifferent = true;
          return;
        }

        auth.patchResetPassword($stateParams.code, {password: data.newPassword})
          .then(function(data) {
            alert.success('Your data was updated successfully');
            $location.path('/profile');
          })  
          .catch(function(err) {
            alert.error('Your data wasn\'t updated');
            $location.path('/');
          });
      }
      $scope.cancel = function() {
        $mdDialog.hide();
      }
      $scope.hide = function() {
        $mdDialog.hide();
      }
    }
})();
