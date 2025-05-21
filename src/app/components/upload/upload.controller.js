(function() {
  'use strict';

  angular.module('app.components')
    .controller('UploadController', UploadController);

    UploadController.$inject = ['kit', '$scope', '$window', '$location', '$stateParams', 'URLS', 'AuthUser', 'urlUtils', 'user'];
    function UploadController(kit, $scope,  $window, $location, $stateParams, URLS, AuthUser, urlUtils, user) {

      var ui_base_url = URLS['base'];
      var device_upload_path = URLS['devices:id:upload'];

      var vm = this;
      vm.kit = kit;
      console.log(vm.kit)

      vm.device_id = vm.kit.id;

      $window.location.href = ui_base_url + urlUtils.get_path(device_upload_path, ":id" , vm.device_id);
    }

  // angular.module('app.components')
  //   .controller('UploadController', UploadController);

  // UploadController.$inject = ['kit', '$state', '$stateParams', 'animation'];
  // function UploadController(kit, $state, $stateParams, animation) {
  //   var vm = this;

  //   vm.kit = kit;

  //   vm.backToProfile = backToProfile;

  //   initialize();

  //   /////////////////

  //   function initialize() {
  //     animation.viewLoaded();
  //   }

  //   function backToProfile() {
  //     $state.transitionTo('layout.myProfile.kits', $stateParams,
  //     { reload: false,
  //       inherit: false,
  //       notify: true
  //     });
  //   }
  // }
})();
