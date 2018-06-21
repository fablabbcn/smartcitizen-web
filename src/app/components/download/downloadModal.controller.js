(function (){
	'use strict';

	angular.module('app.components')
		.controller('DownloadModalController', DownloadModalController);

	DownloadModalController.$inject = ['thisKit', 'device', '$mdDialog'];

	function DownloadModalController(thisKit, device, $mdDialog) {
		var vm = this;

		vm.kit = thisKit;
		vm.download = download;
		vm.cancel = cancel;

		////////////////////////////

		function download(){
			device.mailReadings(vm.kit)
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
