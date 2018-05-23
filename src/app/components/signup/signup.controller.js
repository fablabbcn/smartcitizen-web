

  
    

    SignupController.$inject = ['$scope', '$mdDialog'];
    export default function $1Controller($scope, $mdDialog) {
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
          templateUrl: 'app/components/signup/signupModal.html',
          clickOutsideToClose: true
        });
      }
    }

