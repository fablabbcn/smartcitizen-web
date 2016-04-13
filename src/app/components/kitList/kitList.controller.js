(function(){
  'use strict';

  angular.module('app.components')
    .controller('KitListController', KitListController);

  KitListController.$inject = ['$location', '$mdDialog', '$state','$scope',
    '$stateParams', '$templateCache', '$timeout', '$window','alert', 'auth',
    'AuthUser', 'device', 'kitUtils', 'userUtils'];
  function KitListController($location, $mdDialog, $state, $scope, $stateParams,
    $templateCache, $timeout, $window, alert, auth, AuthUser, device, kitUtils,
    userUtils) {

    var vm = this;
    vm.removeKit = removeKit;

    $templateCache.put('ngDropdowns/templates/dropdownMenu.html', [
      '<ul class="dropdown">',
      '<li ng-repeat="item in dropdownMenu"',
      ' class="dropdown-item"',
      ' dropdown-item-label="labelField"',
      ' dropdown-menu-item="item">',
      '</li>',
      '</ul>'
    ].join(''));

    $templateCache.put('ngDropdowns/templates/dropdownMenuItem.html', [
      '<li ng-class="{divider: dropdownMenuItem.divider, \'divider-label\': dropdownMenuItem.divider && dropdownMenuItem[dropdownItemLabel]}">',
      '<md-button ng-if="dropdownMenuItem.button" ng-click="{{dropdownMenuItem.click}}" class="dropdown-item-button warn" aria-label="">{{dropdownMenuItem[dropdownItemLabel]}}</md-button>',
      '<a href="" class="dropdown-item"',
      ' ng-if="!dropdownMenuItem.divider && !dropdownMenuItem.button"',
      ' ng-href="{{dropdownMenuItem.href}}"',
      ' ng-click="selectItem()">',
      '{{dropdownMenuItem[dropdownItemLabel]}}',
      '</a>',
      '<span ng-if="dropdownMenuItem.divider">',
      '{{dropdownMenuItem[dropdownItemLabel]}}',
      '</span>',
      '</li>'
    ].join(''));

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
