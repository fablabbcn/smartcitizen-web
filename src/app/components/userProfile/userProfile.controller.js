(function() {
  'use strict';

  angular.module('app.components')
    .controller('UserProfileController', UserProfileController);

    UserProfileController.$inject = ['$scope', '$stateParams', '$location',
      'utils', 'user', 'device', 'alert', 'auth', 'userUtils', '$timeout', 'animation',
      'NonAuthUser', '$q', 'PreviewKit'];
    function UserProfileController($scope, $stateParams, $location, utils,
        user, device, alert, auth, userUtils, $timeout, animation,
        NonAuthUser, $q, PreviewKit) {

      var vm = this;
      var userID = parseInt($stateParams.id);

      vm.status = undefined;
      vm.user = {};
      vm.kits = [];
      vm.filteredKits = [];
      vm.filterKits = filterKits;

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

            var kitIDs = _.pluck(vm.user.kits, 'id');
            if(!kitIDs.length) {
              return [];
            }

            return $q.all(
              kitIDs.map(function(id) {
                return device.getDevice(id)
                  .then(function(data) {
                    return new PreviewKit(data);
                  });
              })
            );

          }).then(function(kitsData){
            if (kitsData){
              vm.kits = kitsData;
            }
          }, function(error) {
            if(error.status === 404) {
              $location.url('/404');
            }
          });

        $timeout(function() {
          setSidebarMinHeight();
          animation.viewLoaded();
        }, 500);
      }

      function filterKits(status) {
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
