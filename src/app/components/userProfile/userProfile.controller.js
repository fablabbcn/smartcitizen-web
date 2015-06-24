(function() {
  'use strict';

  angular.module('app.components')
    .controller('UserProfileController', UserProfileController);

    UserProfileController.$inject = ['userData'];
    function UserProfileController(userData) {
      var vm = this;

      //vm.user = new User(userData);
      vm.kits;
      vm.filterKits = filterKits;

      //////////////////


      function filterKits(status) {
        vm.kits = vm.user.kits.filter(function(kit) {
          return kit.status === status;
        });
      }
    }
})();
