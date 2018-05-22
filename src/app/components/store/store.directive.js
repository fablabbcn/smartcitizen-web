import angular from 'angular';

    angular.module('app.components')
      .directive('store', store);

    function store() {
      return {
        scope: {
          isLoggedin: '=logged'
        },
        restrict: 'A',
        controller: 'StoreController',
        controllerAs: 'vm',
        templateUrl: 'app/components/store/store.html'
      };
    }

