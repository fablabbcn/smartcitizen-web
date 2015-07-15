(function() {
  'use strict';

  angular.module('app.components')
    .controller('LayoutController', LayoutController);

    LayoutController.$inject = ['$location', '$state', '$scope', 'auth', 'animation', '$timeout'];
    function LayoutController($location, $state, $scope, auth, animation, $timeout) {
      var vm = this;

      $scope.$on('loggedIn', function(ev, options) {
        if(options && options.time === 'appLoad') {
          $scope.$apply(function() {
            vm.isLoggedin = true;
            vm.isShown = true;
            angular.element('.nav_right .wrap-dd-menu').css('display', 'initial');           
            vm.currentUser = auth.getCurrentUser().data;   
            vm.dropdownOptions[0].text = 'Hello, ' + vm.currentUser.username;
          });          
        } else {
          vm.isLoggedin = true;
          vm.isShown = true;
          angular.element('.nav_right .wrap-dd-menu').css('display', 'initial');           
          vm.currentUser = auth.getCurrentUser().data;   
          vm.dropdownOptions[0].text = 'Hello, ' + vm.currentUser.username;          
        }
      });

      $scope.$on('loggedOut', function() {
        vm.isLoggedIn = false;
        vm.isShown = true;
        angular.element('navbar .wrap-dd-menu').css('display', 'none');
      });
      

      vm.isShown = true;
      vm.isLoggedin = false;
      vm.logout = logout;

      vm.dropdownOptions = [
        {divider: true, text: 'Hello,'},
        {text: 'PROFILE', href: '/profile'},
        {text: 'LOGOUT', href: '/logout'}
      ];

      vm.dropdownSelected = undefined;

      vm.dropdownOptionsCommunity = [
        {text: 'Forum', href: 'https://forum.smartcitizen.me/'},
        {text: 'Documentation', href: 'http://docs.smartcitizen.me/#/'},
        {text: 'API Reference', href: 'http://api.smartcitizen.me/'},
        {text: 'Github', href: 'https://github.com/fablabbcn/Smart-Citizen-Kit'}        
      ];
      vm.dropdownSelectedCommunity = undefined;

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


      $timeout(function() {
        var hash = $location.search();
        if(hash.signup) {
          animation.showSignup();
          // angular.element('.navbar_signup_button button').click();
        } else if(hash.login) {
          //animation.showLogin();
          angular.element('.navbar_login_button button').click();
        } else if(hash.passwordRecovery) {
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
