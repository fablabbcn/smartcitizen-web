(function() {
  'use strict';

  angular.module('app.components')
    .controller('MyProfileController', MyProfileController)
    .filter('filterByStatus', filterByStatus);

    MyProfileController.$inject = ['User', 'authUser'];
    function MyProfileController(User, authUser) {
      var vm = this;

      vm.user = new User(userData);
      vm.kits;
      vm.status;


      vm.dropdownSelected;
      vm.dropdownOptions = [
        {text: 'SET UP', value: '1'},
        {text: 'EDIT', value: '2'}
      ];


      vm.filterKits = filterKits;
      vm.updateUser = updateUser;
      vm.removeUser = removeUser;

      //////////////////

      function updateUser(userData) {

      }

      function removeUser() {
        
      }
    }

    function filterByStatus() {
      return function(kits) {
        return kits.filter(function(kit) {
          return filter.labels.status === vm.status;
        });
      }
    }
})();
