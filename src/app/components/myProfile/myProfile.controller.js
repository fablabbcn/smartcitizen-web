(function() {
  'use strict';

  angular.module('app.components')
    .controller('MyProfileController', MyProfileController);

    MyProfileController.$inject = ['$scope', '$window', '$location',
    'URLS','userData', 'AuthUser', 'urlUtils', 'user'];
    function MyProfileController($scope,  $window, $location, URLS, userData, AuthUser, urlUtils, user) {

      var ui_base_url = URLS['base']
      var users_path = URLS['users:username']

      var vm = this;
      vm.user = userData;

      $window.location.href = ui_base_url + urlUtils.get_path(users_path, ":username" , vm.user.username);
    }
})();
