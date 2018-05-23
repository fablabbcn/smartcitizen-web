




    LayoutController.$inject = ['$location', '$state', '$scope', 'auth', 'animation', '$timeout', 'DROPDOWN_OPTIONS_COMMUNITY', 'DROPDOWN_OPTIONS_USER'];
export default function LayoutController($location, $state, $scope, auth, animation, $timeout, DROPDOWN_OPTIONS_COMMUNITY, DROPDOWN_OPTIONS_USER) {
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
          } else {
            // setTimeout(function() {
            //   if(!vm.isLoggedin) $scope.$broadcast('showBeta');
            // }, 500);
            // waits for the loggedIn event to set vm.isLoggedin. this is temp.
          }
        }, 1000);
      }

      function logout() {
        auth.logout();
        vm.isLoggedin = false;
      }
    }
