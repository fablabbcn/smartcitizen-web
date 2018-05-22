import angular from 'angular';

  angular.module('app.components')
    .controller('ApiKeyController', ApiKeyController);

  ApiKeyController.$inject = ['alert'];
  function ApiKeyController(alert){
    var vm = this;

    vm.copied = copied;
    vm.copyFail = copyFail;

    ///////////////

    function copied(){
      alert.success('API key copied to your clipboard.');
    }

    function copyFail(err){
      console.log('Copy error: ', err);
      alert.error('Oops! An error occurred copying the api key.');
    }

  }

