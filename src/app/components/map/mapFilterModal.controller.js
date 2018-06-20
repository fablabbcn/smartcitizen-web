(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapFilterModalController', MapFilterModalController);

  MapFilterModalController.$inject = ['$mdDialog','selectedFilters'];

  function MapFilterModalController($mdDialog, selectedFilters) {

    var vm = this;

    vm.checks = {};

    vm.answer = answer;
    vm.hide = hide;
    vm.clear = clear;
    vm.cancel = cancel;

    vm.filters = ['indoor', 'outdoor', 'online', 'offline'];

    init();

    ////////////////////////////////////////////////////////

    function init() {
      _.forEach(selectedFilters, select);
    }

    function answer() {

      var selectedFilters = _(vm.filters)
        .filter(isFilterSelected)
        .value();
      $mdDialog.hide(selectedFilters);
    }

    function hide() {
      answer();
    }

    function clear() {
      $mdDialog.hide(vm.filters);
    }

    function cancel() {
      answer();
    }

    function isFilterSelected(filter) {
      return vm.checks[filter];
    }

    function select(filter){
      vm.checks[filter] = true;
    }
  }
})();
