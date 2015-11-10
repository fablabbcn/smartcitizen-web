(function(){
  'use strict';
  angular.module('app.components')
    .directive('kitList',kitList);

  function kitList(){
    return{
      restrict:'E',
      scope:{
        kits:'=kits'
      },
      controller:'KitListController',
      controllerAs:'vm',
      templateUrl:'app/components/kitList/kitList.html'
    };
  }
})();
