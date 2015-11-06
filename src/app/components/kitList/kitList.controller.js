(function(){
  'use strict';

  angular.module('app.components')
    .controller('KitListController', KitListController);

  KitListController.$inject = ['$window', 'auth', 'AuthUser', 'kitUtils', 'userUtils'];
  function KitListController($window, auth, AuthUser, kitUtils, userUtils){
    var vm = this;

    vm.kitBelongsToUser = kitBelongsToUser;

    /////////////

    function kitBelongsToUser(kit){
      if(!auth.isAuth() || !kit || !kit.id) {
        return false;
      }
      var kitID = parseInt(kit.id);
      var userData = ( auth.getCurrentUser().data ) ||
        ($window.localStorage.getItem('smartcitizen.data') &&
        new AuthUser( JSON.parse(
          $window.localStorage.getItem('smartcitizen.data') )));

      var belongsToUser = kitUtils.belongsToUser(userData.kits, kitID);
      var isAdmin = userUtils.isAdmin(userData);

      return isAdmin || belongsToUser;
    }
  }
})();
