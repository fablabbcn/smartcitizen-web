(function() {
  'use strict';

  angular.module('app.components')
    .controller('PasswordRecoveryController', PasswordRecoveryController);

    PasswordRecoveryController.$inject = ['auth', 'alert', '$mdDialog'];
    function PasswordRecoveryController(auth, alert, $mdDialog) {
      var vm = this;

      vm.waitingFromServer = false;
      vm.errors = [];
      vm.recoverPassword = recoverPassword;

      ///////////////

      function recoverPassword() {
        vm.waitingFromServer = true;
        vm.errors = [];
        
        var data = {
          username: vm.username
        };

        auth.recoverPassword(data)
          .then(function() {
            alert.success('You were sent an email to recover your password');
            $mdDialog.hide();
          })
          .catch(function(err) {          
            alert.error('That username doesn\'t exist');
            vm.errors = err.data;
          })
          .finally(function() {
            vm.waitingFromServer = false;
          }); 
      }
    } 
})();
