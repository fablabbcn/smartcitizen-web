(function(){
  'use strict';

  angular.module('app.components')
    .controller('KitListController', KitListController);

  KitListController.$inject = ['$window','alert', 'auth', 'AuthUser', 'kitUtils', 'userUtils'];
  function KitListController($window, alert, auth, AuthUser, kitUtils, userUtils) {
    var vm = this;
  }
})();
