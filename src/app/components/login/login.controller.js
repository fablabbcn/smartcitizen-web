(function() {
  'use strict';

  angular.module('app.components')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$window', 'urlUtils', 'URLS'];
  function LoginController($scope, $window, urlUtils, URLS) {

    $scope.showLogin = showLogin;

    var vm = this;
    vm.ui_base_url = URLS['base']
    var goto_path = URLS['goto'];
    vm.login_url = vm.ui_base_url + URLS['login']+ urlUtils.get_path(goto_path, ":url" , $window.location);

    $scope.$on('showLogin', function() {
      showLogin();
    });

    ////////////////

    function showLogin() {
      $mdDialog.show({
        hasBackdrop: true,
        fullscreen: true,
        controller: 'LoginModalController',
        controllerAs: 'vm',
        templateUrl: 'app/components/login/loginModal.html',
        clickOutsideToClose: true
      });
    }
  }
})();
