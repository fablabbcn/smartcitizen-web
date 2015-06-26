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

      vm.dropdownOptions = [
        {divider: true, text: 'Hello,           '},
        {text: 'PROFILE', value: '1'},
        {text: 'LOGOUT', value: '2'}
      ];

      vm.dropdownSelected;


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

      //////////////////

      function logout() {
        auth.logout();
        vm.isLoggedin = false;
      }
    }
})();
