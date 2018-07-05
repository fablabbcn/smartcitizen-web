(function() {
  'use strict';

  angular.module('app.components')
    .controller('UploadController', UploadController);

  UploadController.$inject = ['kit'];
  function UploadController(kit) {
    var vm = this;
    vm.kit = kit;
  }
})();
