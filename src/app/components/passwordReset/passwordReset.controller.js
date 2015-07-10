(function() {
  'use strict';

  angular.module('app.components')
    .controller('PasswordResetController', PasswordResetController);

    PasswordResetController.$inject = ['$mdDialog', '$stateParams', '$location', 'alert', 'auth'];
    function PasswordResetController($mdDialog, $stateParams, $location, alert, auth) {
      var vm = this;

      initialize();
      ///////////

      function initialize() {
        getUserData();
      }

      function getUserData() {
        auth.getResetPassword($stateParams.code)
          .then(function() {
            openModal();
          })
          .catch(function(err) {
            alert.error('Wrong url');
            $location.path('/');
          });
      }

      function openModal() {
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
