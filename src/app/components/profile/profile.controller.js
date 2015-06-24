(function() {
  'use strict';

  angular.module('app.components')
    .controller('ProfileController', ProfileController);

    ProfileController.$inject = ['userData'];
    function ProfileController(userData) {
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
