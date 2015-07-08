(function() {
  'use strict';

  angular.module('app.components')
    .controller('MyProfileController', MyProfileController);

    MyProfileController.$inject = ['$scope', 'authUser', 'AuthUser', 'user', 'auth', 'utils', 'alert'];
    function MyProfileController($scope, authUser, AuthUser, user, auth, utils, alert) {
      var vm = this;
      var userData, kits

      vm.highlightIcon = highlightIcon;
      vm.unhighlightIcon = unhighlightIcon; 

      //PROFILE TAB
      vm.formUser = {
        'avatar': null
      };
      console.log('auth', authUser);
      if(authUser) { 
        userData = authUser;
        // userData = new AuthUser(authUser);
        vm.user = userData; 
        console.log('vm', vm.user);
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
        {type: 'documentation', title: 'How to connect your Smart Citizen Kit tutorial', description: 'Adding a Smart Citizen Kit', avatar: '', href: 'http://www.google.com'},
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
        userData = auth.getCurrentUser().data;
        vm.user = userData;
        _.defaults(vm.formUser, vm.user);
        console.log('userda', userData);
        console.log('vm.u', vm.user);
        console.log('vm.f', vm.formUser);
        initialize();
      });

      setTimeout(function() {
        highlightIcon(0); 
      }, 500);

      //////////////////

      function initialize() {
        getKits();
      }

      function getKits() {
        var kitIDs = _.pluck(userData.kits, 'id');
        if(!kitIDs.length) {
          vm.kits = [];
          return;
        };
        utils.getOwnerKits(kitIDs)
          .then(function(userKits) {
            kits = userKits;
            vm.kits = userKits;
          });
      }

      function filterKits(status) {
        if(status === 'all') {
          status = undefined;
        } 
        vm.kitStatus = status;
      }

      function filterTools(type) {
        if(type === 'all') {
          type = undefined;
        } 
        vm.toolType = type;
      }

      function updateUser(userData) {
        user.updateUser(userData)
          .then(function() {
            vm.errors = {};
            alert.success('User updated');
          })
          .catch(function(err) {
            alert.error('User could not be updated ')
            vm.errors = err.data.errors;
          });
      }

      function removeUser() {
        user.removeUser()
          .then(function() {
          });
      }

      function highlightIcon(iconIndex) {
        var icons = angular.element('.myProfile_tab_icon'); 

        _.each(icons, function(icon) {
          unhighlightIcon(icon);
        })

        var icon = icons[iconIndex];
        
        angular.element(icon).find('.stroke_container').css({'stroke': 'white', 'stroke-width': '0.01px'});
        angular.element(icon).find('.fill_container').css('fill', 'white');

      }

      function unhighlightIcon(icon) {
        var icon = angular.element(icon);

        icon.find('.stroke_container').css({'stroke': 'none'});
        icon.find('.fill_container').css('fill', '#82A7B0');
      }
    }
})();
