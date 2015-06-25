(function() {
  'use strict';

  angular.module('app.components')
    .controller('MyProfileController', MyProfileController);

    MyProfileController.$inject = ['$scope', 'authUser', 'User', 'user', 'auth'];
    function MyProfileController($scope, authUser, User, user, auth) {
      var vm = this;

      if(authUser) { 
        vm.user = new User(authUser);        
      }
      vm.kits;
      vm.status = undefined;

      vm.formUser = {
        'avatar': null
      };

      vm.dropdownSelected;
      vm.dropdownOptions = [
        {text: 'SET UP', value: '1'},
        {text: 'EDIT', value: '2'}
      ];

      vm.filterKits = filterKits;
      vm.updateUser = updateUser;
      vm.removeUser = removeUser;

      $scope.$on('loggedIn', function() {
        vm.user = auth.getCurrentUser().data;
        _.defaults(vm.formUser, vm.user);
      });

      //////////////////

      function updateUser(userData) {
        user.updateUser(userData)
          .then(function() {
            console.log('done');
          });
      }

      function removeUser() {
        user.removeUser()
          .then(function() {
            console.log('removed');
          })
      }
      function filterKits() {

      }
    }
})();
