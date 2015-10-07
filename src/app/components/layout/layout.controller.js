(function() {
  'use strict';

  angular.module('app.components')
    .controller('LayoutController', LayoutController);

    LayoutController.$inject = ['$location', '$state', '$scope', 'auth', 'animation', '$timeout', 'DROPDOWN_OPTIONS_COMMUNITY', 'DROPDOWN_OPTIONS_USER'];
    function LayoutController($location, $state, $scope, auth, animation, $timeout, DROPDOWN_OPTIONS_COMMUNITY, DROPDOWN_OPTIONS_USER) {
      var vm = this;

      vm.navRightLayout = 'space-around center';

      // listen for any login event so that the navbar can be updated
      $scope.$on('loggedIn', function(ev, options) {
        // if(options && options.time === 'appLoad') {
        //   $scope.$apply(function() {
        //     vm.isLoggedin = true;
        //     vm.isShown = true;
        //     angular.element('.nav_right .wrap-dd-menu').css('display', 'initial');
        //     vm.currentUser = auth.getCurrentUser().data;
        //     vm.dropdownOptions[0].text = 'Hello, ' + vm.currentUser.username;
        //     vm.navRightLayout = 'end center';
        //   });
        // } else {
        //   vm.isLoggedin = true;
        //   vm.isShown = true;
        //   angular.element('.nav_right .wrap-dd-menu').css('display', 'initial');
        //   vm.currentUser = auth.getCurrentUser().data;
        //   vm.dropdownOptions[0].text = 'Hello, ' + vm.currentUser.username;
        //   vm.navRightLayout = 'end center';
        // }

        vm.isLoggedin = true;
        vm.isShown = true;
        angular.element('.nav_right .wrap-dd-menu').css('display', 'initial');
        vm.currentUser = auth.getCurrentUser().data;
        vm.dropdownOptions[0].text = 'Hello, ' + vm.currentUser.username;
        vm.navRightLayout = 'end center';
        if(!$scope.$$phase) {
          $scope.$digest();
        }
      });

      // listen for logout events so that the navbar can be updated
      $scope.$on('loggedOut', function() {
        vm.isLoggedIn = false;
        vm.isShown = true;
        angular.element('navbar .wrap-dd-menu').css('display', 'none');
        vm.navRightLayout = 'space-around center';
        ga('send', 'event', 'Logout', 'click');
      });


      vm.isShown = true;
      vm.isLoggedin = false;
      vm.logout = logout;

      vm.dropdownOptions = DROPDOWN_OPTIONS_USER;
      vm.dropdownSelected = undefined;

      vm.dropdownOptionsCommunity = DROPDOWN_OPTIONS_COMMUNITY;
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

      initialize();

      //////////////////

      function initialize() {
        $timeout(function() {
          var hash = $location.search();
          if(hash.signup) {
            animation.showSignup();
          } else if(hash.login) {
            animation.showLogin();
          } else if(hash.passwordRecovery) {
            animation.showPasswordRecovery();
          }
        }, 1000);
      }

      function logout() {
        auth.logout();
        vm.isLoggedin = false;
      }
    }
})();
