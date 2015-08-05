(function() {
  'use strict';

  angular.module('app.components')
    .directive('loadingBackdrop', loadingBackdrop);

    loadingBackdrop.$inject = [];
    function loadingBackdrop() {
      return {
        templateUrl: 'app/components/animation/backdrop/loadingBackdrop.html',
        controller: function($scope) {
          var vm = this;  
          vm.isViewLoading = true;

          $scope.$on('viewLoading', function() {
            vm.isViewLoading = true;
          });

          $scope.$on('viewLoaded', function() {
            vm.isViewLoading = false;
          })
        },
        controllerAs: 'vm'
      }
    }
})();
