(function() {
  'use strict';

  angular.module('app.components')
    .controller('MyProfileController', MyProfileController);

    MyProfileController.$inject = ['$scope', '$location', '$q', '$interval',
    'userData', 'AuthUser', 'user', 'auth', 'utils', 'alert',
    'COUNTRY_CODES', '$timeout', 'file', 'PROFILE_TOOLS', 'animation',
    'DROPDOWN_OPTIONS_KIT', '$mdDialog', 'PreviewKit', 'device', 'kitUtils',
    'userUtils', '$filter','$state', 'Restangular'];
    function MyProfileController($scope, $location, $q, $interval,
      userData, AuthUser, user, auth, utils, alert,
      COUNTRY_CODES, $timeout, file, PROFILE_TOOLS, animation,
      DROPDOWN_OPTIONS_KIT, $mdDialog, PreviewKit, device, kitUtils,
      userUtils, $filter, $state, Restangular) {

      var vm = this;

      vm.unhighlightIcon = unhighlightIcon;

      //PROFILE TAB
      vm.formUser = {};
      vm.getCountries = getCountries;

      vm.user = userData;
      copyUserToForm(vm.formUser, vm.user);
      vm.searchText = vm.formUser.country;

      vm.updateUser = updateUser;
      vm.removeUser = removeUser;
      vm.uploadAvatar = uploadAvatar;

      //KITS TAB
      vm.kits = [];
      vm.kitStatus = undefined;
      vm.removeKit = removeKit;

      vm.filteredKits = [];

      vm.dropdownSelected = undefined;
      vm.dropdownOptions = DROPDOWN_OPTIONS_KIT;

      //TOOLS TAB
      vm.tools = PROFILE_TOOLS;
      vm.toolType = undefined;
      vm.filteredTools = [];

      //SIDEBAR
      vm.filterKits = filterKits;
      vm.filterTools = filterTools;

      vm.selectThisTab = selectThisTab;
      if ($state.current.name === 'layout.myProfile.user'){
        vm.startingTab = 1;
      } else if ($state.current.name === 'layout.myProfile.tools'){
        vm.startingTab = 2;
      } else {
        vm.startingTab = 0;
      }

      var updateKitsTimer;

      $scope.$on('loggedOut', function() {
        $location.path('/');
      });

      $scope.$on('devicesContextUpdated', function(){
        initialize();
      });

      initialize();

      //////////////////

      function initialize() {

        var kitIDs = _.pluck(vm.user.kits, 'id');
        if(!kitIDs.length) {
          vm.kits = [];
          animation.viewLoaded();
        } else {
          $q.all(
            kitIDs.map(function(id) {
              return device.getDevice(id)
                .then(function(data) {
                  return new PreviewKit(data);
                });
            })
          ).then(function(kitsData){
            if (kitsData){
              vm.kits = kitsData;

              $timeout(function() {
                mapWithBelongstoUser(vm.kits);
                filterKits(vm.status);
                setSidebarMinHeight();
                animation.viewLoaded();
              }, 500);
            }
          });
        }

        // updateKitsTimer = $interval(updateKits, 4000);
      }

      function filterKits(status) {
        if(status === 'all') {
          status = undefined;
        }
        vm.kitStatus = status;
        vm.filteredKits = $filter('filterLabel')(vm.kits, vm.kitStatus);
      }

      function filterTools(type) {
        if(type === 'all') {
          type = undefined;
        }
        vm.toolType = type;
      }

      function updateUser(userData) {
        if(userData.country) {
          _.each(COUNTRY_CODES, function(value, key) {
            if(value === userData.country) {
              /*jshint camelcase: false */
              userData.country_code = key;
              return;
            }
          });
        }

        user.updateUser(userData)
          .then(function(data) {
            var user = new AuthUser(data);
            _.extend(vm.user, user);
            vm.errors = {};
            alert.success('User updated');
            ga('send', 'event', 'Profile', 'update');
          })
          .catch(function(err) {
            alert.error('User could not be updated ');
            vm.errors = err.data.errors;
            ga('send', 'event', 'Profile', 'update failed');
          });
      }

      function removeUser() {
        var confirm = $mdDialog.confirm()
          .title('Delete your account?')
          .content('Are you sure you want to delete your account?')
          .ariaLabel('')
          .ok('delete')
          .cancel('cancel')
          .theme('primary')
          .clickOutsideToClose(true);

        $mdDialog.show(confirm)
          .then(function(){
            return Restangular.all('').customDELETE('me')
              .then(function(){
                alert.success('Account removed successfully. Redirecting you…');
                $timeout(function(){
                  auth.logout();
                  $state.transitionTo('landing');
                }, 2000);
              })
              .catch(function(){
                alert.error('Error occurred trying to delete your account.');
              });
          });
      }

      function selectThisTab(iconIndex, uistate){

        var thisState = uistate ||
          $state.current.name ||
          'layout.myProfile.kits';

        highlightIcon(iconIndex);
        $state.transitionTo(thisState);
      }

      function highlightIcon(iconIndex) {

        var icons = angular.element('.myProfile_tab_icon');

        _.each(icons, function(icon) {
          unhighlightIcon(icon);
        });

        var icon = icons[iconIndex];

        angular.element(icon).find('.stroke_container').css({'stroke': 'white', 'stroke-width': '0.01px'});
        angular.element(icon).find('.fill_container').css('fill', 'white');
      }

      function unhighlightIcon(icon) {
        icon = angular.element(icon);

        icon.find('.stroke_container').css({'stroke': 'none'});
        icon.find('.fill_container').css('fill', '#82A7B0');
      }

      function setSidebarMinHeight() {
        var height = document.body.clientHeight / 4 * 3;
        angular.element('.profile_content').css('min-height', height + 'px');
      }

      function getCountries(searchText) {
        return _.filter(COUNTRY_CODES, createFilter(searchText));
      }

      function createFilter(searchText) {
        searchText = searchText.toLowerCase();
        return function(country) {
          country = country.toLowerCase();
          return country.indexOf(searchText) !== -1;
        };
      }

      function uploadAvatar(fileData) {
        if(fileData && fileData.length) {
          file.getCredentials(fileData[0].name)
            .then(function(res) {
              file.uploadFile(fileData[0], res.key, res.policy, res.signature)
                .success(function() {
                  vm.user.avatar = file.getImageURL(res.key);
                });
              });
        }
      }

      function copyUserToForm(formData, userData) {
        var props = {username: true, email: true, city: true, country: true, country_code: true, website: true, constructor: false};

        for(var key in userData) {
          if(props[key]) {
            formData[key] = userData[key];
          }
        }
      }

      function updateKits() {
        var kitIDs = _.pluck(vm.user.kits, 'id');
        if(!kitIDs.length) {
          return [];
        }

        $q.all(
          kitIDs.map(function(id) {
            return device.getDevice(id)
              .then(function(data) {
                return new PreviewKit(data);
              });
          })
        )
        .then(function(data){
          vm.kits = data;
        });
      }

      function mapWithBelongstoUser(kits){
        _.map(kits, addBelongProperty);
      }

      function addBelongProperty(kit){
        kit.belongProperty = kitBelongsToUser(kit);
        return kit;
      }

      function kitBelongsToUser(kit){
        if(!auth.isAuth() || !kit || !kit.id) {
          return false;
        }
        var kitID = parseInt(kit.id);
        var userData = ( auth.getCurrentUser().data ) ||
          ($window.localStorage.getItem('smartcitizen.data') &&
          new AuthUser( JSON.parse(
            $window.localStorage.getItem('smartcitizen.data') )));

        var belongsToUser = kitUtils.belongsToUser(userData.kits, kitID);
        var isAdmin = userUtils.isAdmin(userData);

        return isAdmin || belongsToUser;
      }

      function removeKit(kitID) {
        console.log("s");
        var confirm = $mdDialog.confirm()
          .title('Delete this kit?')
          .content('Are you sure you want to delete this kit?')
          .ariaLabel('')
          .ok('DELETE')
          .cancel('Cancel')
          .theme('primary')
          .clickOutsideToClose(true);

        $mdDialog
          .show(confirm)
          .then(function(){
            device
              .removeDevice(kitID)
              .then(function(){
                alert.success('Your kit was deleted successfully');
                ga('send', 'event', 'Kit', 'delete');
                device.updateContext().then(function(){
                  var userData = auth.getCurrentUser().data;
                  if(userData) vm.user = userData;
                  //updateKits();
                  initialize();
                });
              })
              .catch(function(){
                alert.error('Error trying to delete your kit.');
              });
          });
      }

    }
})();
