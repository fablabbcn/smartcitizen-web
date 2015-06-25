(function() {
  'use strict';

  angular.module('app.components')
    .controller('UserProfileController', UserProfileController)
    .filter('filterByStatus', filterByStatus);

    UserProfileController.$inject = ['User', 'utils', 'userData'];
    function UserProfileController(User, utils, userData) {
      var vm = this;
      var user = new User(userData); 
      var kits;

      vm.status = undefined;
      vm.user = user;
      vm.kits;
      vm.filteredKits;

      vm.dropdownSelected;
      vm.dropdownOptions = [
        {text: 'SET UP', value: '1'},
        {text: 'EDIT', value: '2'}
      ];

      vm.filterKits = filterKits;

      initialize();
      //////////////////

      function initialize() {
        getKits();
      }

      function getKits() {
        var kitIDs = _.pluck(user.kits, 'id');

        utils.getOwnerKits(kitIDs)
          .then(function(userKits) {
            kits = userKits;
            vm.kits = userKits;
            console.log('k', kits);
          });
      }

      function filterKits(status) {
        if(status === 'all') {
          status = undefined;
        } 
        vm.status = status;
      }
    }

    function filterByStatus() {
      return function() {
        console.log('kk.', kits);
        if(kits) {
          return kits.filter(function(kit) {
            return filter.labels.status === vm.status;
          });          
        }
      };
    }
})();
