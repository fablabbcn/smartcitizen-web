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

      //////////////////

      function filterKits(status) {
        if(status === 'all') {
          status = undefined;
        } 
        vm.status = status;
      }
    }
})();
