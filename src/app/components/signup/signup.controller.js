'use strict';

angular.module('app.components')
  .controller('SignupController', SignupController);

  function SignupController($scope, $mdDialog, user, animation) {
    var vm = this;

    vm.showSignup = showSignup;
    vm.signup = signup;
    ////////////////////////


    function showSignup(ev) {

      animation.blur();
      
      /* global DialogController */
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
      user.post(signupData).then(function() {
    
      });
    }
  }
