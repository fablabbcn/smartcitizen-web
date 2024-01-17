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
      controller: function($scope, $timeout) {
        var vm = this;

        vm.deviceWithoutData = false;
        vm.scrollToComments = scrollToComments;

        $scope.$on('deviceWithoutData', function(ev, data) {

          $timeout(function() {
            vm.device = data.device;
            vm.deviceWithoutData = true;

            if (data.belongsToUser) {
              vm.user = 'owner';
            } else {
              vm.user = 'visitor';
            }
          }, 0);

        });

        function scrollToComments(){
          location.hash = '';
          location.hash = '#disqus_thread';
        }
      },
      controllerAs: 'vm'
    };
  }
})();
