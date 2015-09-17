(function(){
  'use strict';

  angular.module('app.components')
    .directive('setuptool', setuptool);

  function setuptool(){
    return {
      restrict: 'A',
      link: link,
      scope:false
    }
  }

  function link(scope, element, attrs){
    $(element).sckapp();

    // listen to jquery event
    // modify scope

    $(element).on("sck_info", function(event, data){
      scope.vm.macAddress = data.mac;
      scope.$apply();
    });
  }

})();
