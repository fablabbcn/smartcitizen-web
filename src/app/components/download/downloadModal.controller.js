(function (){
	'use strict';

	angular.module('app.components')
		.controller('DownloadModalController', DownloadModalController);

	DownloadModalController.$inject = ['thisDevice', 'device', '$mdDialog'];

	function DownloadModalController(thisDevice, device, $mdDialog) {
		var vm = this;

		vm.device = thisDevice;
		vm.download = download;
		vm.cancel = cancel;

		////////////////////////////

		function download(){
			device.mailReadings(vm.device)
				.then(function (){
					$mdDialog.hide();
				}).catch(function(err){
					$mdDialog.cancel(err);
				});
		}

		function cancel(){
			$mdDialog.cancel();
		}
	}

})();
