(function() {
  'use strict';

  angular.module('app.components')
    .directive('noDataBackdrop', noDataBackdrop);

    /**
     * Backdrop for chart section when kit has no data
     * 
     */
    noDataBackdrop.$inject = [];
    function noDataBackdrop() {
      return {
        restrict: 'A',
        scope: {},
        templateUrl: 'app/core/animation/backdrop/noDataBackdrop.html',
        controller: function($scope) {
          var vm = this;  

          vm.kitWithoutData = false;

          $scope.$on('kitWithoutData', function(ev, data) {
            vm.kitWithoutData = true;

            if(data.belongsToUser) {
              vm.user = 'owner';
            } else {
              vm.user = 'visitor';
            }
          });
        },
        controllerAs: 'vm'
      }
    }
})();
