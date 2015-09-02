(function() {
  'use strict';

  angular.module('app.components')
    .controller('NewKitController', NewKitController);

    NewKitController.$inject = ['animation'];
    function NewKitController(animation) {
      var vm = this;

      vm.step = 1;

      vm.kit = {
        name: undefined,
        elevation: undefined,
        exposure: undefined
      };

      vm.exposure = ['indoor', 'outdoor'];

      initialize();

      //////////////

      function initialize() {
        animation.viewLoaded();
      }
    }
})();
