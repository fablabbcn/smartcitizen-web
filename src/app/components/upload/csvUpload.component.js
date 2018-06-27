(function(){
'use strict';

controller.$inject = ['device', 'Papa', 'FullKit'];
function controller(device, Papa, FullKit) {
  var vm = this;
  vm.analyzeData = function() {
    console.log(vm.kitId);
    device.getDevice(vm.kitId)
    .then((deviceData) => {
      vm.kit = new FullKit(deviceData);
      console.log(vm.kit)
      vm.kitLastUpdate = !!vm.kit.time || new Date(vm.kit.time);
      vm.csvFiles.forEach((file) => {
        console.log(file);
        Papa.parse(file, {
          delimiter: ',',
          worker: true,
          skipEmptyLines: true
        }).then((result) => {
          const lastTimestamp = new Date(result.data[result.data.length - 1][0]);
          console.log(vm.kitLastUpdate, lastTimestamp)
          const isNew = vm.kitLastUpdate < lastTimestamp;
          file.isNew = isNew;
          file.checked = isNew;
          console.log(result);
        })
      });
    });
  }

  vm.uploadData = function() {
    vm.csvFiles
    .forEach((file) => {
      if (file.checked) {

      }
    });
  }
}


angular.module('app.components')
  .component('scCsvUpload', {
    templateUrl: 'app/components/upload/csvUpload.html',
    controller: controller,
    bindings: {
      kitId: '<'
    },
    controllerAs: 'vm'
  });
})();
