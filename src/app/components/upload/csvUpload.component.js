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
        .filter((sensor) => sensor.value && sensor.id)   // remove empty value or id
      };
    })
  };
}



controller.$inject = ['device', 'Papa'];
function controller(device, Papa) {
  var vm = this;
  vm.loadingStatus = false;
  vm.loadingProgress = 0;
  vm.loadingType = 'indeterminate';
  vm.csvFiles = [];
  vm.$onInit = function() {
    console.log("crl",vm);
    vm.kitLastUpdate = Math.floor(new Date(vm.kit.time).getTime() / 1000);
    console.log(vm.kitLastUpdate);
  }
  vm.onSelect = function() {
    vm.loadingStatus = true;
    vm.loadingType = 'indeterminate';
  }
  vm.change = function(files, invalidFiles) {
    console.log(files, invalidFiles);
    let count = 0;
    vm.invalidFiles = invalidFiles;
    vm.loadingStatus = true;
    vm.loadingType = 'determinate';
    vm.loadingProgress = 0;
    Promise.all(
      files
      .filter((file) => vm._checkDuplicate(file))
      .map((file, index, filteredFiles) => {
        vm.csvFiles.push(file);
        return vm._analyzeData(file)
        .then(() => {
          count += 1;
          vm.loadingProgress = (count)/filteredFiles.length * 100;

        });
      })
    ).then(() => {
      vm.loadingStatus = false;
    }).catch(() => {
      vm.loadingStatus = false;
    });
  }
  vm.removeFile = function(index) {
    vm.csvFiles.splice(index, 1);
  }
  vm._analyzeData = function(file) {
    file.progress = true;
    return Papa.parse(file, {
      delimiter: ',',
      dynamicTyping: true,
      worker: true,
      skipEmptyLines: true
    }).then((result) => {
      console.log('res', result)
      if (result.errors && result.errors.length > 0) {
        file.parseErrors = result.errors;
      }
      const lastTimestamp = Math.floor((new Date(result.data[result.data.length - 1][0])).getTime() / 1000);
      console.log(lastTimestamp);
      const isNew = vm.kitLastUpdate < lastTimestamp;
      file.checked = isNew;
      file.progress = null;
      file.isNew = isNew;
      return result;
    }).catch((err) => {
      file.progress = null;
      console('catch',err)
    });
  }

  vm._checkDuplicate = function(file) {
    if (vm.csvFiles.some((csvFile) => file.name === csvFile.name)) {
      file.$errorMessages = {};
      file.$errorMessages.duplicate = true;
      vm.invalidFiles.push(file);
      return false;
    } else {
      return true;
    }
  }



  vm.uploadData = function() {
    vm.loadingStatus = true;
    vm.loadingType = 'determinate';
    vm.loadingProgress = 0;

    Promise.all(
      vm.csvFiles
      .filter((file) => file.checked && !file.success)
      .map((file, index) => {
        file.progress = true;
        return vm._analyzeData(file)
        .then((result) => parseDataForPost(result.data))
        // TODO with workers
        .then((payload) => device.postReadings(vm.kit, payload))
        .then(() => {
          file.success = true;
          file.progress = null;
          vm.loadingProgress = (index+1)/vm.csvFiles.length * 100;
        })
        .catch((errors) =>  {
          console.log(errors);
          file.backEndErrors = errors;
          file.progress = null;
        });
      })
    ).then(() => {
      vm.loadingStatus = false;
    })
    .catch(() => {
      vm.loadingStatus = false;
    });
  }
}


angular.module('app.components')
  .component('scCsvUpload', {
    templateUrl: 'app/components/upload/csvUpload.html',
    controller: controller,
    bindings: {
      kit: '<'
    },
    controllerAs: 'vm'
  });
})();
