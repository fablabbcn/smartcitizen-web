(function() {
  'use strict';

  angular.module('app.components')
    .directive('loadingBackdrop', loadingBackdrop);

    /**
     * Backdrop for app initialization and between states
     * 
     */
    loadingBackdrop.$inject = [];
    function loadingBackdrop() {
      return {
        templateUrl: 'app/core/animation/backdrop/loadingBackdrop.html',
        controller: function($scope) {
          var vm = this;  
          vm.isViewLoading = true;
          vm.mapStateLoading = false;

          // listen for app loading event
          $scope.$on('viewLoading', function() {
            vm.isViewLoading = true;
            angular.element('#doorbell-button').hide();
          });

          $scope.$on('viewLoaded', function() {
            vm.isViewLoading = false;
            angular.element('#doorbell-button').show();
          });

          // listen for map state loading event 
          $scope.$on('mapStateLoading', function() {
            if(vm.isViewLoading) {
              return;
            }
            vm.mapStateLoading = true;
          });

          $scope.$on('mapStateLoaded', function() {
            vm.mapStateLoading = false;
          });
        },
        controllerAs: 'vm'
      };
    }
})();
