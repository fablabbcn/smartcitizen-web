'use strict';

angular.module('components.navbar', [])
  .controller('NavbarController', NavbarController);

  function NavbarController($scope, $mdDialog) {
    var vm = this;

    vm.showSignup = showSignup;
    vm.showLogin = showLogin;
    
    ////////////////////////


    function showSignup() {
      
    }

    function showLogin() {
      
    }
  }
