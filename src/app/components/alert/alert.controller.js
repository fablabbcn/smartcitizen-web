(function() {
  'use strict';

  angular.module('app.components')
    .controller('AlertController', AlertController);

    AlertController.$inject = ['$scope', '$mdToast', 'message', 'button'];
    function AlertController($scope, $mdToast, message, button) {
    	var vm = this;

    	vm.close = close;
        vm.message = message;
        vm.button = button;

        // hideAlert will be triggered on state change
        $scope.$on('hideAlert', function() {
          close();
        });

    	///////////////////

    	function close() {
    	  $mdToast.hide();							
    	}
    }
})();
