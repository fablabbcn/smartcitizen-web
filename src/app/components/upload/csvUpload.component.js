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
  vm.$onInit = function() {
    console.log("crl",vm);
    vm.kitLastUpdate = !!vm.kit.time || new Date(vm.kit.time);
    vm.csvFiles = [];
    vm.loading = {
      status: false,
      type: 'indeterminate',
      progress: 0
    };
  }
  vm.onSelect = function() {
    vm.loading.status = true;
    vm.loading.type = 'indeterminate';
  }
  vm.change = function(files, invalidFiles) {
    console.log(files, invalidFiles);
    vm.invalidFiles = invalidFiles;
    vm.loading.status = true;
    vm.loading.type = 'determinate';
    vm.loading.progress = 0;
    Promise.all(
      files
      .filter((file) => vm._checkDuplicate(file))
      .map((file, index, files) => {
        vm.csvFiles.push(file);
        return vm._analyzeData(file)
        .then(() => {
          console.log(file)
          vm.loading.progress = (index+1)/files.length * 100;
        })
        .catch((err) => console('catch',err))
      })
    ).then(() => {
      vm.loading.status = false;
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
      const lastTimestamp = new Date(result.data[result.data.length - 1][0]);
      const isNew = vm.kitLastUpdate < lastTimestamp;
      file.checked = isNew;
      file.progress = null;
      file.isNew = isNew;
      return result;
    });
  }

  vm._checkDuplicate(file) {
    if (vm.csvFiles.some(({name}) => file.name === name)) {
      file.$errorMessages = {};
      file.$errorMessages.duplicate = true;
      vm.invalidFiles.push(file);
      return false;
    } else {
      return true;
    }
  }



  vm.uploadData = function() {
    vm.loading.status = true;
    vm.loading.type = 'determinate';
    vm.loading.progress = 0;

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
          vm.loading.progress = (index+1)/vm.csvFiles.length * 100;
        })
        .catch((errors) =>  {
          console.log(errors);
          file.backEndErrors = errors;
          file.progress = null;
        });
      })
    ).then(() => {
      vm.loading.status = false;
    })
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
