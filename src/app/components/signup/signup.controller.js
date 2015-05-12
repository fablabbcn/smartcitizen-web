(function() {
  'use strict';

  angular.module('app.components')
    .controller('SignupController', SignupController);
    
    SignupController.$inject = ['$scope', '$mdDialog', 'user', 'animation', '$mdToast'];
    function SignupController($scope, $mdDialog, user, animation, $mdToast) {
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
            console.log('data', data);
             $mdToast.show({
              controller: 'AlertController',
              controllerAs: 'vm',
              templateUrl: 'app/components/alert/alertGreen.html',
              hideDelay: 10000,
              position: 'top'
            });
          })
          .catch(function(err) {
            console.log('err', err);
            $mdToast.show({
              controller: 'AlertController',
              controllerAs: 'vm',
              templateUrl: 'app/components/alert/alertRed.html',
              hideDelay: 150000,
              position: 'top'
            });
          });
      }
    }
})();
