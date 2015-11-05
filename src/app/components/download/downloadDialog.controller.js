(function (){
	'use strict';

	angular.module('app.components')
		.controller('DownloadDialogController', DownloadDialogController);

	DownloadDialogController.$inject = ['thisKit', 'device', '$mdDialog'];

	function DownloadDialogController(thisKit, device, $mdDialog) {
		var vm = this;

		vm.kit = thisKit;
		vm.download = download;

		function download(kit){
			$mdDialog.cancel('awful error');
		}
	};

})();