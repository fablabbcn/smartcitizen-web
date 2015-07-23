(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapFilterDialogController', MapFilterDialogController);

    MapFilterDialogController.$inject = ['$scope', '$mdDialog', 'filterData', 'mapUtils'];
    function MapFilterDialogController($scope, $mdDialog, filterData, mapUtils) {
      var defaultFilters = {
        exposure: null,
        status: null
      };

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
        $mdDialog.hide(data, defaultFilters);
      };
      $scope.hide = function() {
        $mdDialog.hide();
      };  
      $scope.cancel = function() {
        $mdDialog.hide();
      };

      $scope.applyFilterRules = function() {
        _.extend($scope.form, mapUtils.getDefaultFilters($scope.form, defaultFilters) );
        _.extend(defaultFilters, mapUtils.setDefaultFilters($scope.form, defaultFilters) );
      };
    }
})();
