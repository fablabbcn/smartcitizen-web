(function() {
  'use strict';

  angular.module('app.components')
    .controller('UploadController', UploadController);

  UploadController.$inject = ['kit', '$state', '$stateParams', 'animation'];
  function UploadController(kit, $state, $stateParams, animation) {
    var vm = this;

    vm.kit = kit;

    vm.backToProfile = backToProfile;

    initialize();

    /////////////////

    function initialize() {
      animation.viewLoaded();
    }

    function backToProfile() {
      $state.transitionTo('layout.myProfile.kits', $stateParams,
      { reload: false,
        inherit: false,
        notify: true
      });
    }
  }
})();
