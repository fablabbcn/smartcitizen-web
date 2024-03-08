(function() {
  'use strict';

  angular.module('app.components')
    .controller('MyProfileController', MyProfileController);

    MyProfileController.$inject = ['$scope', '$location', '$q', '$interval',
    'userData', 'AuthUser', 'user', 'auth', 'alert',
    'COUNTRY_CODES', '$timeout', 'file', 'animation',
    '$mdDialog', 'PreviewDevice', 'device', 'deviceUtils',
    'userUtils', '$filter', '$state', 'Restangular', '$window'];
    function MyProfileController($scope, $location, $q, $interval,
      userData, AuthUser, user, auth, alert,
      COUNTRY_CODES, $timeout, file, animation,
      $mdDialog, PreviewDevice, device, deviceUtils,
      userUtils, $filter, $state, Restangular, $window) {

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

      //THIS IS TEMPORARY.
      // Will grow on to a dynamic API KEY management
      // with the new /accounts oAuth mgmt methods

      // The auth controller has not populated the `user` at this point,
      // so  user.token is undefined
      // This controller depends on auth has already been run.
      vm.user.token = auth.getToken();
      vm.addNewDevice = addNewDevice;

      //KITS TAB
      vm.devices = [];
      vm.deviceStatus = undefined;
      vm.removeDevice = removeDevice;
      vm.downloadData = downloadData;

      vm.filteredDevices = [];
      vm.dropdownSelected = undefined;

      //SIDEBAR
      vm.filterDevices = filterDevices;
      vm.filterTools = filterTools;

      vm.selectThisTab = selectThisTab;

      $scope.$on('loggedOut', function() {
        $location.path('/');
      });

      $scope.$on('devicesContextUpdated', function(){
        var userData = auth.getCurrentUser().data;
        if(userData){
          vm.user = userData;
        }
        initialize();
      });

      initialize();

      //////////////////

      function initialize() {

        startingTab();
        if(!vm.user.devices.length) {
          vm.devices = [];
          animation.viewLoaded();
        } else {

          vm.devices = vm.user.devices.map(function(data) {
            return new PreviewDevice(data);
          })

          $timeout(function() {
            mapWithBelongstoUser(vm.devices);
            filterDevices(vm.status);
            setSidebarMinHeight();
            animation.viewLoaded();
          });

        }
      }

      function filterDevices(status) {
        if(status === 'all') {
          status = undefined;
        }
        vm.deviceStatus = status;
        vm.filteredDevices = $filter('filterLabel')(vm.devices, vm.deviceStatus);
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
          })
          .catch(function(err) {
            alert.error('User could not be updated ');
            vm.errors = err.data.errors;
          });
      }

      function removeUser() {
        var confirm = $mdDialog.confirm()
          .title('Delete your account?')
          .textContent('Are you sure you want to delete your account?')
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
        /* This looks more like a hack but we need to workout how to properly use md-tab with ui-router */

        highlightIcon(iconIndex);

        if ($state.current.name.includes('myProfileAdmin')){
            var transitionState = 'layout.myProfileAdmin.' + uistate;
            $state.transitionTo(transitionState, {id: userData.id});
        } else {
            var transitionState = 'layout.myProfile.' + uistate;
            $state.transitionTo(transitionState);
        }

      }

      function startingTab() {
        /* This looks more like a hack but we need to workout how to properly use md-tab with ui-router */

        var childState = $state.current.name.split('.').pop();

        switch(childState) {
          case 'user':
            vm.startingTab = 1;
            break;
          default:
            vm.startingTab = 0;
            break;
        }

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
        icon.find('.fill_container').css('fill', '#FF8600');
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

          // TODO: Improvement Is there a simpler way to patch the image to the API and use the response?
          // Something like:
          //Restangular.all('/me').patch(data);
          // Instead of doing it manually like here:
          var fd = new FormData();
          fd.append('profile_picture', fileData[0]);
          Restangular.one('/me')
            .withHttpConfig({transformRequest: angular.identity})
            .customPATCH(fd, '', undefined, {'Content-Type': undefined})
            .then(function(resp){
              vm.user.profile_picture = resp.profile_picture;
            })
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

      function mapWithBelongstoUser(devices){
        _.map(devices, addBelongProperty);
      }

      function addBelongProperty(device){
        device.belongProperty = deviceBelongsToUser(device);
        return device;
      }


      function deviceBelongsToUser(device){
        if(!auth.isAuth() || !device || !device.id) {
          return false;
        }
        var deviceID = parseInt(device.id);
        var userData = ( auth.getCurrentUser().data ) ||
          ($window.localStorage.getItem('smartcitizen.data') &&
          new AuthUser( JSON.parse(
            $window.localStorage.getItem('smartcitizen.data') )));

        var belongsToUser = deviceUtils.belongsToUser(userData.devices, deviceID);
        var isAdmin = userUtils.isAdmin(userData);

        return isAdmin || belongsToUser;
      }

      function downloadData(device){
        $mdDialog.show({
          hasBackdrop: true,
          controller: 'DownloadModalController',
          controllerAs: 'vm',
          templateUrl: 'app/components/download/downloadModal.html',
          clickOutsideToClose: true,
          locals: {thisDevice:device}
        }).then(function(){
          var alert = $mdDialog.alert()
          .title('SUCCESS')
          .textContent('We are processing your data. Soon you will be notified in your inbox')
          .ariaLabel('')
          .ok('OK!')
          .theme('primary')
          .clickOutsideToClose(true);

          $mdDialog.show(alert);
        }).catch(function(err){
          if (!err){
            return;
          }
          var errorAlert = $mdDialog.alert()
          .title('ERROR')
          .textContent('Uh-oh, something went wrong')
          .ariaLabel('')
          .ok('D\'oh')
          .theme('primary')
          .clickOutsideToClose(false);

          $mdDialog.show(errorAlert);
        });
      }

      function removeDevice(deviceID) {
        var confirm = $mdDialog.confirm()
          .title('Delete this kit?')
          .textContent('Are you sure you want to delete this kit?')
          .ariaLabel('')
          .ok('DELETE')
          .cancel('Cancel')
          .theme('primary')
          .clickOutsideToClose(true);

        $mdDialog
          .show(confirm)
          .then(function(){
            device
              .removeDevice(deviceID)
              .then(function(){
                alert.success('Your kit was deleted successfully');
                device.updateContext();
              })
              .catch(function(){
                alert.error('Error trying to delete your kit.');
              });
          });
      }

      $scope.addDeviceSelector = addDeviceSelector;
      function addDeviceSelector(){
        $mdDialog.show({
          templateUrl: 'app/components/myProfile/addDeviceSelectorModal.html',
          clickOutsideToClose: true,
          multiple: true,
          controller: DialogController,
        });
      }

      function DialogController($scope, $mdDialog){
        $scope.cancel = function(){
          $mdDialog.cancel();
        };
      }

      function addNewDevice() {
        var confirm = $mdDialog.confirm()
          .title('Hey! Do you want to add a new kit?')
          .textContent('Please, notice this currently supports just the SCK 1.0 and SCK 1.1')
          .ariaLabel('')
          .ok('Ok')
          .cancel('Cancel')
          .theme('primary')
          .clickOutsideToClose(true);

        $mdDialog
          .show(confirm)
          .then(function(){
           $state.go('layout.kitAdd');
          });
      }


    }
})();
