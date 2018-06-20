(function() {
  'use strict';

  angular.module('app.components')
    .controller('StoreModalController', StoreModalController);

    StoreModalController.$inject = ['$scope', '$mdDialog'];
    function StoreModalController($scope, $mdDialog) {

      $scope.cancel = function() {
        $mdDialog.hide();
      };
    }
})();
