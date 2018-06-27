(function() {
  'use strict';

  angular.module('app.components')
    .controller('UploadController', UploadController);

  UploadController.$inject = ['$stateParams'];
  function UploadController($stateParams) {
    var vm = this;
    vm.kitId = $stateParams.id;
    console.log(vm.kitId);
  }
})();
