(function() {
  'use strict';

  angular.module('app.components')
    .controller('UserProfileController', UserProfileController);

    UserProfileController.$inject = ['User', 'utils', 'userData'];
    function UserProfileController(User, utils, userData) {
      var vm = this;
      var user = new User(userData); 
      var kits;

      vm.status = undefined;
      vm.user = user;
      vm.kits;

      vm.filteredKits;
      vm.filterKits = filterKits;
      vm.goThere = goThere;

      initialize();
      //////////////////

      function initialize() {
        getKits();
      }

      function getKits() {
        var kitIDs = _.pluck(user.kits, 'id');
        if(!kitIDs.length) {
          vm.kits = [];
          return;
        };

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

      function goThere() {
        console.log('this');
      }
    }
})();
