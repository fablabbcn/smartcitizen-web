(function() {
  'use strict';

  angular.module('app.components')
    .controller('MyProfileController', MyProfileController);

    MyProfileController.$inject = ['$scope', '$location', '$q', '$interval', 'userData', 'AuthUser', 'user', 'auth', 'utils', 'alert', 'COUNTRY_CODES', '$timeout', 'file', 'PROFILE_TOOLS', 'animation', 'DROPDOWN_OPTIONS_KIT', '$mdDialog', 'PreviewKit', 'device'];
    function MyProfileController($scope, $location, $q, $interval, userData, AuthUser, user, auth, utils, alert, COUNTRY_CODES, $timeout, file, PROFILE_TOOLS, animation, DROPDOWN_OPTIONS_KIT, $mdDialog, PreviewKit, device) {
      var vm = this;

      vm.highlightIcon = highlightIcon;
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
      vm.kits = undefined;
      vm.kitStatus = undefined;
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

      var updateKitsTimer = undefined;

      $scope.$on('loggedOut', function() {
        $location.path('/');
      });
      $scope.$on("$destroy", function() {
        if (updateKitsTimer) {
            $interval.cancel(updateKitsTimer);
        }
    });

      initialize();

      //////////////////

      function initialize() {
        $timeout(function() {
          highlightIcon(0);
          setSidebarMinHeight();
          animation.viewLoaded();
        }, 500);

        updateKitsTimer = $interval(reloadUser, 4000);
        processKits();
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
        var alert = $mdDialog.alert()
          .title('Delete your account?')
          .content('If you wish to remove you account completely, please contact our support team at support@smartcitizen.me')
          .ariaLabel('')
          .ok('OK!')
          .theme('primary')
          .clickOutsideToClose(true);

        $mdDialog.show(alert);
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

      function reloadUser(){
        auth.updateUser().then(function(){
          vm.user = auth.getCurrentUser().data;
          processKits();
        });
      }

      function processKits(){
        vm.kits = _.map(vm.user.kits, function(kitData){
          return new PreviewKit({data:kitData});
        });
      }
    }
})();
