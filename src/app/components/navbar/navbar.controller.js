(function() {
  'use strict';

  angular.module('app.components')
    .controller('NavbarController', NavbarController);

    NavbarController.$inject = ['$location', '$scope', 'auth', 'animation'];
    function NavbarController($location, $scope, auth, animation) {
      var vm = this;
      vm.isShown = true;
      vm.isLoggedin = false;
      vm.logout = logout;

      vm.dropdownOptions = [
        {divider: true, text: 'Hello,'},
        {text: 'PROFILE', href: '/profile'},
        {text: 'LOGOUT', href: '/logout'}
      ];

      vm.dropdownSelected;

      vm.dropdownOptionsCommunity = [
        {text: 'Forum', href: 'https://forum.smartcitizen.me/'},
        {text: 'Documentation', href: 'http://docs.smartcitizen.me/#/'},
        {text: 'API Reference', href: 'http://api.smartcitizen.me/'},
        {text: 'Github', href: 'https://github.com/fablabbcn/Smart-Citizen-Kit'}        
      ];
      vm.dropdownSelectedCommunity;

      $scope.$on('removeNav', function() {
        $scope.$apply(function() {
          vm.isShown = false;
        });
      });

      $scope.$on('addNav', function() {
        $scope.$apply(function() {
          vm.isShown = true;
        });
      });

      $scope.$on('loggedIn', function() {
        vm.isLoggedin = true;
        angular.element('navbar .wrap-dd-menu').css('display', 'initial');           
        vm.currentUser = auth.getCurrentUser().data;   
        vm.dropdownOptions[0].text = 'Hello, ' + vm.currentUser.username;
      });

      $scope.$on('loggedOut', function() {
        vm.isLoggedIn = false;
        vm.isShown = true;
        angular.element('navbar .wrap-dd-menu').css('display', 'none');
      });

      setTimeout(function() {
        var hash = $location.search();
        if(hash['signup']) {
          animation.showSignup();
          // angular.element('.navbar_signup_button button').click();
        } else if(hash['login']) {
          //animation.showLogin();
          angular.element('.navbar_login_button button').click();
        } else if(hash['passwordRecovery']) {
          animation.showPasswordRecovery();
        }
      }, 1000);


      //////////////////

      function logout() {
        auth.logout();
        vm.isLoggedin = false;
      }
    }
})();
