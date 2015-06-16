(function() {
  'use strict';

  angular.module('app.components')
    .controller('NavbarController', NavbarController);

    NavbarController.$inject = ['$scope', 'auth'];
    function NavbarController($scope, auth) {
      var vm = this;
      vm.isShown = true;
      vm.isLoggedin = false;
      vm.logout = logout;

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
          console.log('is', vm.isLoggedin);                  
      });

      //////////////////

      function logout() {
        auth.logout();
        vm.isLoggedin = false;
      }
    }
})();
