(function() {
  'use strict';

  angular.module('app.components')
    .controller('PasswordResetController', PasswordResetController);

    PasswordResetController.$inject = ['$mdDialog', '$stateParams', '$location', 'alert', 'auth'];
    function PasswordResetController($mdDialog, $stateParams, $location, alert, auth) {
      var vm = this;
      vm.showForm = false;
      vm.form = {};
      vm.isDifferent = false;
      vm.answer = answer;

      initialize();
      ///////////

      function initialize() {
        getUserData();
      }

      function getUserData() {
        auth.getResetPassword($stateParams.code)
          .then(function() {
            vm.showForm = true;
          })
          .catch(function() {
            alert.error('Wrong url');
            $location.path('/');
          });
      }

      function answer(data) {
        vm.waitingFromServer = true;
        vm.errors = undefined;

        if(data.newPassword === data.confirmPassword) {
          vm.isDifferent = false;
        } else {
          vm.isDifferent = true;
          return;
        }

        auth.patchResetPassword($stateParams.code, {password: data.newPassword})
          .then(function() {
            alert.success('Your data was updated successfully');
            $location.path('/profile');
          })  
          .catch(function(err) {
            alert.error('Your data wasn\'t updated');
            vm.errors = err.data.errors;
          })
          .finally(function() {
            vm.waitingFromServer = false;
          });
      }
    }
})();
