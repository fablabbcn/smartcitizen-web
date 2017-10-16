(function(){
  'use strict';

  angular.module('app.components')
    .directive('setuptool', setuptool);

  setuptool.$inject = ['scktoolService'];
  function setuptool(scktoolService){
    return {
      restrict: 'A',
      link: link,
      scope:false
    };

    function link(scope, element, attrs){
      var publishedPID;

      scope.vm.macAddressFieldVisible = true;

      scktoolService.scktool().then(function(){
        $(element).sckapp();

        $(element).on('sck_start', function(event, data){
          scope.vm.macAddressFieldVisible = false;
          scope.vm.nextAction = 'no';
          if(publishedPID){
            publishedPID();
          }
          scope.$apply();
        });

        $(element).on('sck_info', function(event, data){
          scope.vm.macAddress = data.mac;
          scope.$apply();
          scope.vm.submitForm();
        });

        $(element).on('sck_done', function(event, data){
          scope.vm.nextAction = 'waiting';
          publishedPID = scope.$on('published', function(e, data) { // here is the error...
            scope.vm.nextAction = 'ready';
            scope.$apply();
          });
        });

      });
    }
  }

})();
