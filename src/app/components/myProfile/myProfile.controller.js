(function() {
  'use strict';

  angular.module('app.components')
    .controller('MyProfileController', MyProfileController);

    MyProfileController.$inject = [];
    function MyProfileController() {
      var vm = this;

      //vm.user = new User(userData);
      vm.kits;
      vm.filterKits = filterKits;

      vm.updateUser = updateUser;
      vm.removeUser = removeUser;

      //////////////////


      function filterKits(status) {
        vm.kits = vm.user.kits.filter(function(kit) {
          return kit.status === status;
        });
      }

      function updateUser(userData) {

      }

      function removeUser() {
        
      }
    }
})();
