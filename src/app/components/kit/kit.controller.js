(function() {
  'use strict';

  angular.module('app.components')
    .controller('KitController', KitController);
    
    KitController.$inject = ['marker'];
    function KitController(marker) {
      var vm = this;
      
      vm.marker = marker;

      ///////////////

    }
})();
