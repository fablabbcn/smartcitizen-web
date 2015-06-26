(function() {
  'use strict';

  angular.module('app.components')
    .controller('MyProfileController', MyProfileController);

    MyProfileController.$inject = ['$scope', 'authUser', 'User', 'user', 'auth', 'utils'];
    function MyProfileController($scope, authUser, User, user, auth, utils) {
      var vm = this;
      var user, kits

      //PROFILE TAB
      vm.formUser = {
        'avatar': null
      };

      if(authUser) { 
        user = new User(authUser);
        vm.user = user; 
        _.defaults(vm.formUser, vm.user);       
        initialize();
      }

      //KITS TAB
      vm.kits;
      vm.kitStatus = undefined;
      vm.filteredKits;

      vm.dropdownSelected;
      vm.dropdownOptions = [
        {text: 'SET UP', value: '1'},
        {text: 'EDIT', value: '2'}
      ];

      //TOOLS TAB
      vm.tools = [
        {type: 'documentation', title: 'How to connect your Smart Citizen Kit tutorial', description: 'Adding a Smart Citizen Kit', avatar: ''},
        {type: 'documentation', title: 'Download the latest SCK Firmware', description: 'Github version of the firmware', avatar: ''}, 
        {type: 'documentation', title: 'RESTful API Documentation', description: 'API Docs', avatar: ''},
        {type: 'community', title: 'Smart Citizen Forum', description: 'Your feedback is important for us', avatar: ''},
        {type: 'documentation', title: 'SCK Repository Documentation', description: 'Fork the project', avatar: ''},
        {type: 'social', title: 'Like us on Facebook', description: 'Follow our news on Facebook', avatar: ''},
        {type: 'social', title: 'Follow us on Twitter', description: 'Discover the weather and your smart connections on Twitter', avatar: ''},
        {type: 'social', title: 'Be our friend on Google+', description: 'Get informed about latest news of Smart Citizen', avatar: ''},
      ];
      vm.toolType = undefined;
      vm.filteredTools;

      vm.filterKits = filterKits;
      vm.filterTools = filterTools;
      vm.updateUser = updateUser;
      vm.removeUser = removeUser;


      //in case it's the entry point for the app
      $scope.$on('loggedIn', function() {
        user = auth.getCurrentUser().data;
        vm.user = user;
        _.defaults(vm.formUser, vm.user);
        initialize();
      });

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
            console.log('kits', kits);
          });
      }

      function filterKits(status) {
        if(status === 'all') {
          status = undefined;
        } 
        vm.kitStatus = status;
      }

      function filterTools(type) {
        console.log('here', type);
        if(type === 'all') {
          type = undefined;
        } 
        vm.toolType = type;
      }

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
          });
      }
    }
})();
