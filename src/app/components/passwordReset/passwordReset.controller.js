(function() {
  'use strict';

  angular.module('app.components')
    .controller('PasswordResetController', PasswordResetController);

    PasswordResetController.$inject = ['$mdDialog']
    function PasswordResetController($mdDialog) {
      var vm = this;

      initialize();
      ///////////

      function initialize() {
        openModal();
      }

      function openModal() {
        console.log('hereee');
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'PasswordResetDialogController',
          templateUrl: 'app/components/passwordReset/passwordResetModal.html',
          //targetEvent: ev,
          clickOutsideToClose: true
        })
        .then(function() {
          //signup(signupData);
        })
        .finally(function() {
          //animation.unblur();
        });
      }
    }
})();
