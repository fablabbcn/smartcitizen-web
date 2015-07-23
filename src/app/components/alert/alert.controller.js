(function() {
  'use strict';

  angular.module('app.components')
    .controller('AlertController', AlertController);

    AlertController.$inject = ['$scope', '$mdToast', 'message'];
    function AlertController($scope, $mdToast, message) {
    	var vm = this;

    	vm.close = close;
        vm.message = message;

        $scope.$on('hideAlert', function() {
          close();
        });

    	///////////////////

    	function close() {
    	  $mdToast.hide();							
    	}
    }
})();
