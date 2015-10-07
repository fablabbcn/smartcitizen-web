(function(){
  'use strict';

  angular.module('app.components')
    .controller('StaticController', StaticController);

  StaticController.$inject = ['$timeout', 'animation'];
  function StaticController($timeout, animation){
    var vm = this;

    ///////////////////////

    initialize();

    //////////////////

    function initialize() {
      $timeout(function() {
        animation.viewLoaded();
      }, 500);
    }
  }
})();
