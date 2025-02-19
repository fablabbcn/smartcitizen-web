(function() {
  'use strict';

  angular.module('app.components')
    .controller('LayoutController', LayoutController);

    LayoutController.$inject = ['$mdSidenav','$mdDialog', '$location', '$rootScope', '$state', '$scope', '$transitions', '$window', 'auth', 'animation', '$timeout', 'urlUtils', 'DROPDOWN_OPTIONS_COMMUNITY', 'URLS'];
    function LayoutController($mdSidenav, $mdDialog, $location, $rootScope, $state, $scope, $transitions, $window, auth, animation, $timeout, urlUtils, DROPDOWN_OPTIONS_COMMUNITY, URLS) {
      var vm = this;
      vm.ui_base_url = URLS['base']
      var goto_path = URLS['goto']

      vm.logout_url = vm.ui_base_url + URLS['logout']+ urlUtils.get_path(goto_path, ":url" , $window.location);
      vm.seeed_url = URLS['seeed']

      vm.navRightLayout = 'space-around center';

      $scope.toggleRight = buildToggler('right');

      function buildToggler(componentId) {
        return function() {
          $mdSidenav(componentId).toggle();
        };
      }

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
        var user_path = URLS['users:username']
        vm.user_url = vm.ui_base_url + urlUtils.get_path(user_path, ":username", vm.currentUser.username);

        // console.log(vm.dropdownOptions)

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
      });


      vm.isShown = true;
      vm.isLoggedin = false;
      vm.logout = logout;

      vm.dropdownSelected = undefined;

      vm.dropdownOptionsCommunity = DROPDOWN_OPTIONS_COMMUNITY;
      vm.dropdownSelectedCommunity = undefined;

      $scope.$on('removeNav', function() {
          vm.isShown = false;
      });

      $scope.$on('addNav', function() {
          vm.isShown = true;
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
        // auth.logout();
        vm.isLoggedin = false;
        $rootScope.$broadcast('loggedOut');
        $window.location.href = vm.logout_url;
      }
    }
})();
