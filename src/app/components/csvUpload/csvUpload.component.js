(function(){
'use strict';

function controller(Papa) {
  var vm = this;

  vm.uploadData = function() {
    vm.csvFiles.forEach((file) => {
      Papa.parse(file, { worker: true }).then((result) => {
        console.log(result);
      })
    });
  }
}
controller.$inject = ['Papa'];


angular.module('app.components')
  .component('scCsvUpload', {
    templateUrl: 'app/components/csvUpload/csvUpload.html',
    controller: controller,
    controllerAs: 'vm'
  });
})();
