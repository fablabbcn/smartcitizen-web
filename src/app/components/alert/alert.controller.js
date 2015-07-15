(function() {
  'use strict';

  angular.module('app.components')
    .controller('AlertController', AlertController);

    AlertController.$inject = ['$mdToast', 'message'];
    function AlertController($mdToast, message) {
    	var vm = this;

    	vm.close = close;
        vm.message = message;

    	///////////////////

    	function close() {
    	  $mdToast.hide();							
    	}
    }
})();
