(function(){
  'use strict';

  angular.module('app.components')
    .directive('setuptool', setuptool);

  setuptool.$inject = ['scktoolService']
  function setuptool(scktoolService){
    return {
      restrict: 'A',
      link: link,
      scope:false
    }

    function link(scope, element, attrs){
      scktoolService.scktool().then(function(){
        $(element).sckapp();

        $(element).on("sck_info", function(event, data){
          scope.vm.macAddress = data.mac;
          scope.$apply();
          scope.vm.submitForm();
        });
      });
    }
  }

})();
