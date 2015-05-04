'use strict';

angular.module('components.signup')
  .controller('SignupController', SignupController);

  function SignupController($scope, $mdDialog, user, animation) {
    var vm = this;

    vm.showSignup = showSignup;
    
    ////////////////////////


    function showSignup(ev) {

      animation.blur();

      $mdDialog.show({
        controller: DialogController,
        templateUrl: 'app/components/signup/signupModal.html',
        targetEvent: ev,
      })
      .then(function(signupData) {
        signup(signupData);
      })
      .finally(function() {
        animation.unblur();
      });
    }

    function signup(signupData) {
      user.post(signupData).then(function(users) {
        console.log('res', users);
      });
    }
  }


    function DialogController($scope, $mdDialog) {

      $scope.answer = function(answer) {
        $mdDialog.hide(answer);
      };
    }
