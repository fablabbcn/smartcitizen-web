(function(){
  'use strict';
  angular.module('app.components')
    .directive('kitList',kitList);

  function kitList(){
    return{
      restrict:'E',
      scope:{
        devices:'=devices',
        actions: '=actions'
      },
      controllerAs:'vm',
      templateUrl:'app/components/kitList/kitList.html'
    };
  }
})();
