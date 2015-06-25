(function() {
  'use strict';

  angular.module('app.components')
    .controller('SignupDialogController', SignupDialogController);

    SignupDialogController.$inject = ['$scope', '$mdDialog', 'user', 'alert'];
    function SignupDialogController($scope, $mdDialog, user, alert) {

      $scope.answer = function(answer) {
        user.post(answer)
          .then(function(data) {
            console.log('data', data);
            alert.success('Signup was successful');
            $mdDialog.hide();
          })
          .catch(function(err) {
            //alert.error('Signup failed');
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
    }
})();
