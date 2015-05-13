(function() {
  'use strict';

  angular.module('app.components')
    .controller('SignupController', SignupController);
    
    SignupController.$inject = ['$scope', '$mdDialog', 'user', 'animation', 'alert'];
    function SignupController($scope, $mdDialog, user, animation, alert) {
      var vm = this;

      vm.showSignup = showSignup;
      vm.signup = signup;

      ////////////////////////


      function showSignup(ev) {

        animation.blur();
        
        $mdDialog.show({
          controller: 'DialogController',
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
        user.post(signupData)
          .then(function(data) {
            alert.success('Mu bien!!!!!');
          })
          .catch(function(err) {
            alert.error('Mu mal!!!!!!');
          });
      }
    }
})();
