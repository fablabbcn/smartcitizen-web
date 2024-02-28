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



controller.$inject = ['device', 'Papa', '$mdDialog', '$q'];
function controller(device, Papa, $mdDialog, $q) {
  var vm = this;
  vm.loadingStatus = false;
  vm.loadingProgress = 0;
  vm.loadingType = 'indeterminate';
  vm.csvFiles = [];
  vm.$onInit = function() {
    vm.kitLastUpdate = Math.floor(new Date(vm.kit.time).getTime() / 1000);
  }
  vm.onSelect = function() {
    vm.loadingStatus = true;
    vm.loadingType = 'indeterminate';
  }
  vm.change = function(files, invalidFiles) {
    let count = 0;
    vm.invalidFiles = invalidFiles;
    if (!files) { return; }
    vm.loadingStatus = true;
    vm.loadingType = 'determinate';
    vm.loadingProgress = 0;
    $q.all(
      files
      .filter((file) => vm._checkDuplicate(file))
      .map((file, index, filteredFiles) => {
        vm.csvFiles.push(file);
        return vm._analyzeData(file)
        .then((result) => {
          if (result.errors && result.errors.length > 0) {
            file.parseErrors = result.errors;
          }
          const lastTimestamp = Math.floor((new Date(result.data[result.data.length - 1][0])).getTime() / 1000);
          const isNew = vm.kitLastUpdate < lastTimestamp;
          file.checked = isNew;
          file.progress = null;
          file.isNew = isNew;
        })
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

  vm.haveSelectedFiles = function() {
    return vm.csvFiles && vm.csvFiles.some((file) => file.checked);
  };

  vm.haveSelectedNoFiles = function() {
    return vm.csvFiles && !vm.csvFiles.some((file) => file.checked);
  };

  vm.haveSelectedAllFiles = function() {
    return vm.csvFiles && vm.csvFiles.every((file) => file.checked);
  };

  vm.doAction = function() {
    switch (vm.action) {
      case 'selectAll':
        vm.selectAll(true);
        break;
      case 'deselectAll':
        vm.selectAll(false);
        break;
      case 'upload':
        vm.uploadData();
        break;
      case 'remove':
        vm.csvFiles = vm.csvFiles.filter((file) => !file.checked);
        break;
    }
    vm.action = null;
  };

  vm.selectAll = function(value) {
    vm.csvFiles.forEach((file) => { file.checked = value });
  };

  vm.removeFile = function(index) {
    vm.csvFiles.splice(index, 1);
  };
  vm._analyzeData = function(file) {
    file.progress = true;
    return Papa.parse(file, {
      delimiter: ',',
      dynamicTyping: true,
      worker: false,
      skipEmptyLines: true
    }).catch((err) => {
      file.progress = null;
      console('catch',err)
    });
  };

  vm._checkDuplicate = function(file) {
    if (vm.csvFiles.some((csvFile) => file.name === csvFile.name)) {
      file.$errorMessages = {};
      file.$errorMessages.duplicate = true;
      vm.invalidFiles.push(file);
      return false;
    } else {
      return true;
    }
  };

  vm.showErrorModal = function(csvFile) {
    $mdDialog.show({
      hasBackdrop: true,
      controller: ['$mdDialog',function($mdDialog) {
        this.parseErrors = csvFile.parseErrors;
        this.backEndErrors = csvFile.backEndErrors;
        this.cancel = function() { $mdDialog.hide(); };
      }],
      controllerAs: 'csvFile',
      templateUrl: 'app/components/upload/errorModal.html',
      clickOutsideToClose: true
    });
  }


  vm.uploadData = function() {
    vm.loadingStatus = true;
    vm.loadingType = 'indeterminate';
    vm.loadingProgress = 0;
    let count = 0;

    $q.all(
      vm.csvFiles
      .filter((file) => file.checked && !file.success)
      .map((file, index, filteredFiles) => {
        file.progress = true;
        return vm._analyzeData(file)
        .then((result) => parseDataForPost(result.data)) // TODO: Improvement remove
        // TODO: Improvement with workers
        .then((payload) => device.postReadings(vm.kit, payload))
        .then(() => {
          if (vm.loadingType === 'indeterminate') { vm.loadingType = 'determinate'; };
          file.success = true;
          file.progress = null;
          count += 1;
          vm.loadingProgress = (count)/filteredFiles.length * 100;
        })
        .catch((errors) =>  {
          console.log(errors);
          file.detailShowed = true;
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
};


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
