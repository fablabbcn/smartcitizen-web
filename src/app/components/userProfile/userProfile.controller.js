(function() {
  'use strict';

  angular.module('app.components')
    .controller('UserProfileController', UserProfileController);

    UserProfileController.$inject = ['$scope', '$stateParams', '$location',
      'utils', 'user', 'device', 'alert', 'auth', 'userUtils', '$timeout', 'animation',
      'NonAuthUser', '$q', 'PreviewDevice'];
    function UserProfileController($scope, $stateParams, $location, utils,
        user, device, alert, auth, userUtils, $timeout, animation,
        NonAuthUser, $q, PreviewDevice) {

      var vm = this;
      var userID = parseInt($stateParams.id);

      vm.status = undefined;
      vm.user = {};
      vm.devices = [];
      vm.filteredDevices = [];
      vm.filterDevices = filterDevices;

      $scope.$on('loggedIn', function() {
        var authUser = auth.getCurrentUser().data;
        if( userUtils.isAuthUser(userID, authUser) ) {
          $location.path('/profile');
        }
      });

      initialize();

      //////////////////

      function initialize() {

        user.getUser(userID)
          .then(function(user) {
            vm.user = new NonAuthUser(user);

            if(!vm.user.devices.length) {
              return [];
            }

            $q.all(vm.devices = vm.user.devices.map(function(data){
              return new PreviewDevice(data);
            }))

          }).then(function(error) {
            if(error && error.status === 404) {
              $location.url('/404');
            }
          });

        $timeout(function() {
          setSidebarMinHeight();
          animation.viewLoaded();
        }, 500);
      }

      function filterDevices(status) {
        if(status === 'all') {
          status = undefined;
        }
        vm.status = status;
      }

      function setSidebarMinHeight() {
        var height = document.body.clientHeight / 4 * 3;
        angular.element('.profile_content').css('min-height', height + 'px');
      }
    }
})();
