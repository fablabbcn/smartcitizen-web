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
      var publishedPID;

      scope.vm.macAddressFieldVisible = true;

      scktoolService.scktool().then(function(){
        $(element).sckapp();

        $(element).on("sck_done", function(event, data){
          publishedPID = scope.$on('published', function(e, data) {
            scope.vm.nextAction = 'ready';
          });
        });

        $(element).on("sck_start", function(event, data){
          scope.vm.macAddressFieldVisible = false;
          scope.vm.nextAction = "no";
          if(publishedPID) publishedPID();
        });

        $(element).on("sck_info", function(event, data){
          scope.vm.macAddressFieldVisible = false;
          scope.vm.nextAction = "waiting";
          scope.vm.macAddress = data.mac;
          scope.$apply();
          scope.vm.submitForm();
        });
      });
    }
  }

})();
