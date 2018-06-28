(function(){
'use strict';



function parseDataForPost(csvArray) {
  /*
  EXPECTED PAYLOAD
  {
    "data": [{
      "recorded_at": "2016-06-08 10:30:00",
      "sensors": [{
        "id": 22,
        "value": 21
      }]
    }]
  }
  */
  const ids = csvArray[3];                      // save ids from the 4th header
  csvArray.splice(0,4);                         // remove useless headers
  return {
    data: csvArray.map((data) => {
      return {
        recorded_at: data.shift(),              // get the timestamp from the first column
        sensors: data.map((value, index) => {
          return {
            id: ids[index+1],                   // get ID of sensor from headers
            value: value
          };
        })
        .filter(({id, value}) => value && id)   // remove empty value or id
      };
    })
  };
}



controller.$inject = ['device', 'Papa', 'FullKit'];
function controller(device, Papa, FullKit) {
  var vm = this;
  vm.onSelect = function() {
    vm.loadingFiles = true;
  }
  vm.change = function(files, invalidFiles) {
    vm.loadingFiles = false;
  }
  vm.removeFile = function(index) {
    vm.csvFiles.splice(index, 1);
  }
  vm.analyzeData = function() {
    console.log(vm.kitId);
    let fileCount = 0;
    vm.totalProgress = 0;
    device.getDevice(vm.kitId)
    .then((deviceData) => {
      vm.kit = new FullKit(deviceData);
      console.log(vm.kit)
      vm.kitLastUpdate = !!vm.kit.time || new Date(vm.kit.time);
      vm.csvFiles.forEach((file, index) => {
        file.progress = true;
        Papa.parse(file, {
          delimiter: ',',
          worker: true,
          skipEmptyLines: true
        }).then((result) => {
          vm.totalProgress = (fileCount+1)/vm.csvFiles.length * 100;
          fileCount += 1;
          if (fileCount === vm.csvFiles.length - 1) {
            vm.totalProgress = null;
          }
          if (result.errors && result.errors.length > 0) {
            file.errors = result.errors;
          }
          const lastTimestamp = new Date(result.data[result.data.length - 1][0]);
          console.log(vm.kitLastUpdate, lastTimestamp)
          const isNew = vm.kitLastUpdate < lastTimestamp;
          file.isNew = isNew;
          file.checked = isNew;
          file.progress = null;
          console.log(result);
        })
      });
    });
  }




  vm.uploadData = function() {
    vm.totalProgress = 0;
    vm.csvFiles
    .forEach((file, index) => {
      if (file.checked) {
        file.progress = true;
        Papa.parse(file, {
          delimiter: ',',
          dynamicTyping: true,
          worker: true,
          skipEmptyLines: true
        })
        .then((result) => {
          if (index === vm.csvFiles.length - 1) {
            vm.totalProgress = null;
          }
          file.progress = null;
          return parseDataForPost(result.data); // TODO with workers
        })
        .then((payload) => device.postReadings(vm.kit,payload))
        .then(() => { file.progress = null; })
        .catch((errors) =>  {
          console.log(errors)
          file.errors = [{message: errors}];
          file.progress = null;
        });
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
