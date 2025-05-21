(function() {
  'use strict';

  angular.module('app.components')
  .controller('UserProfileController', UserProfileController);

  UserProfileController.$inject = ['$scope', '$window', '$location', '$stateParams', 'URLS', 'AuthUser', 'urlUtils', 'user'];
  function UserProfileController($scope,  $window, $location, $stateParams, URLS, AuthUser, urlUtils, user) {

    var ui_base_url = URLS['base'];
    var user_path = URLS['users:id'];

    var vm = this;
    vm.user_id = $stateParams.id;

    $window.location.href = ui_base_url + urlUtils.get_path(user_path, ":id" , vm.user_id);
  }
})();
