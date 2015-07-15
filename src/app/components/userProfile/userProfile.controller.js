(function() {
  'use strict';

  angular.module('app.components')
    .controller('UserProfileController', UserProfileController);

    UserProfileController.$inject = ['utils', 'userData', 'kitsData'];
    function UserProfileController(utils, userData, kitsData) {
      var vm = this;
      var user = userData; 
      var kits = kitsData;

      vm.status = undefined;
      vm.user = user;
      vm.kits = kits;

      vm.filteredKits;
      vm.filterKits = filterKits;

      setTimeout(function() {
        setSidebarMinHeight();
      }, 500)
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
