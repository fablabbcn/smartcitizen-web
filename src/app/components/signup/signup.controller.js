'use strict';

angular.module('components.signup')
  .controller('SignupController', SignupController);

  function SignupController($scope, $mdDialog, user) {
    var vm = this;

    vm.showSignup = showSignup;
    
    ////////////////////////


    function showSignup(ev) {
      console.log('hola!');
      $scope.$parent.blur = true;
      //$scope.$emit('blur');
      console.log($scope)
      $mdDialog.show({
        controller: DialogController,
        templateUrl: 'app/components/signup/signupModal.html',
        targetEvent: ev,
      })
      .then(function(signupData) {
        //var element = document.getElementsByClassName('page')[0];
        //angular.element(element).removeClass('blur');
        signup(signupData);
      });
      //var element = document.getElementsByClassName('page')[0];
      //angular.element(element).addClass('blur');
    }

    function signup(signupData) {
      user.post(signupData).then(function(users) {
        console.log('res', users);
      });
    }
  }


    function DialogController($scope, $mdDialog) {
      //$scope.hide = function() {
        //$mdDialog.hide();
      //};
      //$scope.cancel = function() {
        //$mdDialog.cancel();
      //};
      $scope.answer = function(answer) {
        $mdDialog.hide(answer);
      };
    }
