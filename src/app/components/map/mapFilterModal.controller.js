(function() {
  'use strict';

  angular.module('app.components')
    .controller('MapFilterModalController', MapFilterModalController);

  MapFilterModalController.$inject = ['$mdDialog','selectedFilters', '$timeout'];

  function MapFilterModalController($mdDialog, selectedFilters, $timeout) {

    var vm = this;

    vm.checks = {};

    vm.answer = answer;
    vm.hide = hide;
    vm.clear = clear;
    vm.cancel = cancel;
    vm.toggle = toggle;

    vm.location = ['indoor', 'outdoor'];
    vm.status = ['online', 'offline'];
    vm.new = ['new'];

    vm.filters = [];

    init();

    ////////////////////////////////////////////////////////

    function init() {
      _.forEach(selectedFilters, select);
    }

    function answer() {
      vm.filters = vm.filters.concat(vm.location, vm.status, vm.new);
      var selectedFilters = _(vm.filters)
        .filter(isFilterSelected)
        .value();
      $mdDialog.hide(selectedFilters);
    }

    function hide() {
      answer();
    }

    function clear() {
      vm.filters = vm.filters.concat(vm.location, vm.status);
      $mdDialog.hide(vm.filters);
    }

    function cancel() {
      answer();
    }

    function isFilterSelected(filter) {
      return vm.checks[filter];
    }

    function toggle(filters) {
      $timeout(function() {

        for (var i = 0; i < filters.length - 1; i++) {
          if (vm.checks[filters[i]] == false && vm.checks[filters[i]] == vm.checks[filters[i+1]]) {
            for (var n = 0; n < filters.length; n++) {
              vm.checks[filters[n]] = true;
            }
          }
        }

      });
    }

    function select(filter){
      vm.checks[filter] = true;
    }
  }
})();
