(function() {
  'use strict';

  angular.module('app.components')
    .controller('SignupDialogController', SignupDialogController);

    SignupDialogController.$inject = ['$scope', '$mdDialog', 'user',
      'alert', 'animation', '$location'];
    function SignupDialogController($scope, $mdDialog, user,
      alert, animation, $location) {
      var vm = this;
      vm.answer = function(signupForm) {

        if (!signupForm.$valid){
          return;
        }

        $scope.waitingFromServer = true;
        user.createUser(vm.user)
          .then(function(data) {
            alert.success('Signup was successful');
            $mdDialog.hide();
            ga('send', 'event', 'Signup', 'signed up');
          }).catch(function(err) {
            alert.error('Signup failed');
            $scope.errors = err.errors;
            ga('send', 'event', 'Signup', 'failed');
          })
          .finally(function(data) {
            $scope.waitingFromServer = false;
          });
      };
      $scope.hide = function() {
        $mdDialog.hide();
      };
      $scope.cancel = function() {
        $mdDialog.cancel();
      };

      $scope.openLogin = function() {
        animation.showLogin();
        $mdDialog.hide();
      };
    }
})();
