(function() {
  'use strict';

  angular.module('app.components')
    .controller('UploadController', UploadController);

  UploadController.$inject = ['kit', '$state'];
  function UploadController(kit, $state) {
    var vm = this;
    vm.kit = kit;
    vm.backToProfile = function() {
      $state.transitionTo('layout.myProfile.kits', $stateParams,
      { reload: false,
        inherit: false,
        notify: true
      });
    };
  }
})();
