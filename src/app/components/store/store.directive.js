(function() {
  'use strict';

    angular.module('app.components')
      .directive('store', store);

    function store() {
      return {
        scope: {
          show: '='
        },
        restrict: 'A',
        controller: 'StoreController',
        controllerAs: 'vm',
        templateUrl: 'app/components/store/store.html'
      };
    }
})();
