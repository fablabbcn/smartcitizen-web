(function() {
  'use strict';

  angular.module('app.components')
    .controller('SignupController', SignupController);

    SignupController.$inject = ['$scope', '$mdDialog'];
    function SignupController($scope, $mdDialog) {
      var vm = this;

      vm.showSignup = showSignup;

      $scope.$on('showSignup', function() {
        showSignup();
      });
      ////////////////////////


      function showSignup() {
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'SignupDialogController',
          controllerAs: 'vm',
          templateUrl: 'app/components/signup/signupModal.html',
          clickOutsideToClose: true
        });
      }
    }
})();
