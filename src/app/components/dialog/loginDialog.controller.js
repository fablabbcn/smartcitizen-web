(function() {
  'use strict';

  angular.module('app.components')
    .controller('LoginDialogController', LoginDialogController);

    LoginDialogController.$inject = ['$scope', '$mdDialog', 'auth', 'alert'];
    function LoginDialogController($scope, $mdDialog, auth, alert) {

      $scope.answer = function(answer) {
        auth.login(answer)
          .then(function(data) {
            console.log('yes', data);
            var token = data.access_token;
            auth.saveToken(token);
            alert.success('Signup was successful');
            $mdDialog.hide();
          })
          .catch(function(err) {
            console.log('no');
            console.log('err', err.data.errors);
            alert.error('Error');
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
