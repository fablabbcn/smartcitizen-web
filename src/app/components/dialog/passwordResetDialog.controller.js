import angular from 'angular';

  angular.module('app.components')
    .controller('PasswordResetDialogController', PasswordResetDialogController);

    PasswordResetDialogController.$inject = ['$scope', '$mdDialog', '$stateParams', '$location', 'auth', 'alert'];
    function PasswordResetDialogController($scope, $mdDialog, $stateParams, $location, auth, alert) {
      
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
          .then(function() {
            alert.success('Your data was updated successfully');
            $location.path('/profile');
            $mdDialog.hide();
          })  
          .catch(function() {
            alert.error('Your data wasn\'t updated');
          });
      };

      $scope.cancel = function() {
        $mdDialog.hide();
      };

      $scope.hide = function() {
        $mdDialog.hide();
      };

    }

