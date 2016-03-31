(function(){
  'use strict';

  angular.module('app.components')
    .controller('KitListController', KitListController);

  KitListController.$inject = ['$location', '$mdDialog', '$state','$scope',
    '$stateParams', '$timeout', '$window','alert', 'auth', 'AuthUser', 'device',
    'kitUtils', 'userUtils'];
  function KitListController($location, $mdDialog, $state, $scope, $stateParams,
    $timeout, $window, alert, auth, AuthUser, device, kitUtils, userUtils) {

    var vm = this;
    vm.removeKit = removeKit;

    function removeKit(kitID) {
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
              $timeout(function(){
                $window.location.href = '/';
                $state.transitionTo('layout.myProfile.kits', $stateParams,
                  { reload: true,
                    inherit: false,
                    notify: true
                  });
              }, 1000);
            })
            .catch(function(){
              alert.error('Error trying to delete your kit.');
            });
        });
    }
  }

})();
