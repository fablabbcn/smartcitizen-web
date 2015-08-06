(function() {
  'use strict';

  angular.module('app.components')
    .directive('loadingBackdrop', loadingBackdrop);

    loadingBackdrop.$inject = [];
    function loadingBackdrop() {
      return {
        templateUrl: 'app/core/animation/backdrop/loadingBackdrop.html',
        controller: function($scope) {
          var vm = this;  
          vm.isViewLoading = true;
          angular.element('#doorbell-button').hide();

          $scope.$on('viewLoading', function() {
            vm.isViewLoading = true;
            angular.element('#doorbell-button').hide();
          });

          $scope.$on('viewLoaded', function() {
            vm.isViewLoading = false;
            angular.element('#doorbell-button').show();
          })
        },
        controllerAs: 'vm'
      }
    }
})();
