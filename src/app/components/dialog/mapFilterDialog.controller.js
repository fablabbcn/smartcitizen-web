(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapFilterDialogController', MapFilterDialogController);

    MapFilterDialogController.$inject = ['$scope', '$mdDialog', 'filterData']
    function MapFilterDialogController($scope, $mdDialog, filterData) {
      $scope.form = {
        indoor: false,
        outdoor: false,
        online: false,
        offline: false
      };

      _.extend($scope.form, filterData);

      $scope.answer = function(data) {
        if(!data) {
          data = _.each($scope.form, function(value, key, obj) {
            obj[key] = true;
          });
        }
        $mdDialog.hide(data);
      };
      $scope.hide = function() {
        $mdDialog.hide();
      };  
      $scope.cancel = function() {
        $mdDialog.hide();
      };
    }
})();
