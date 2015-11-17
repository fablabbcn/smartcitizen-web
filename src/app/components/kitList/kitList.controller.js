(function(){
  'use strict';

  angular.module('app.components')
    .controller('KitListController', KitListController);

  KitListController.$inject = ['$window', 'auth', 'AuthUser', 'kitUtils',
    'userUtils'];
  function KitListController($window, auth, AuthUser, kitUtils, userUtils){
    var vm = this;


  }
})();
