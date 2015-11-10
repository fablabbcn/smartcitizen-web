(function() {
  'use strict';

  angular.module('app.components')
    .controller('AlertController', AlertController);

    AlertController.$inject = ['$scope', '$mdToast', 'message', 'button', 'href'];
    function AlertController($scope, $mdToast, message, button, href) {
    	var vm = this;

    	vm.close = close;
        vm.message = message;
        vm.button = button;
        vm.href = href;

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
