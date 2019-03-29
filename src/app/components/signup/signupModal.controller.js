(function() {
  'use strict';

  angular.module('app.components')
    .controller('SignupModalController', SignupModalController);

    SignupModalController.$inject = ['$scope', '$mdDialog', 'user',
      'alert', 'animation'];
    function SignupModalController($scope, $mdDialog, user,
      alert, animation ) {
      var vm = this;
      vm.answer = function(signupForm) {

        if (!signupForm.$valid){
          return;
        }

        $scope.waitingFromServer = true;
        user.createUser(vm.user)
          .then(function() {
            alert.success('Signup was successful');
            $mdDialog.hide();
            ga('send', 'event', 'Signup', 'signed up');
          }).catch(function(err) {
            alert.error('Signup failed');
            $scope.errors = err.data.errors;
            ga('send', 'event', 'Signup', 'failed');
          })
          .finally(function() {
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
