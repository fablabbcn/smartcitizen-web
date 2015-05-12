(function() {
  'use strict';

  angular.module('app.components')
    .controller('AlertController', AlertController);

    AlertController.$inject = ['$mdToast'];
    function AlertController($mdToast) {
    	var vm = this;

    	vm.close = close;

    	///////////////////

    	function close() {
    	  $mdToast.hide();							
    	}
    }
})();
