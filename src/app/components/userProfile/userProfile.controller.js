(function() {
  'use strict';

  angular.module('app.components')
    .controller('UserProfileController', UserProfileController);

    UserProfileController.$inject = ['$scope', '$stateParams', '$location', 'utils', 'userData', 'kitsData', 'auth', 'userUtils', '$timeout'];
    function UserProfileController($scope, $stateParams, $location, utils, userData, kitsData, auth, userUtils, $timeout) {
      var vm = this;
      var user = userData; 
      var kits = kitsData;

      vm.status = undefined;
      vm.user = user;
      vm.kits = kits;
      // vm.filteredKits;
      vm.filterKits = filterKits;

      $scope.$on('loggedIn', function() {
        var userID = parseInt($stateParams.id);
        var authUser = auth.getCurrentUser().data;
        if( userUtils.isAuthUser(userID, authUser) ) {
          $location.path('/profile');
        }
      });

      $timeout(function() {
        setSidebarMinHeight();
      }, 500);
      //////////////////

      function filterKits(status) {
        if(status === 'all') {
          status = undefined;
        } 
        vm.status = status;
      }

      function setSidebarMinHeight() {
        var height = document.body.clientHeight / 4 * 3;
        angular.element('.profile_content').css('min-height', height + 'px');
      }
    }
})();
