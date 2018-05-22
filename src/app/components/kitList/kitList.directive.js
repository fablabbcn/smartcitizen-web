import angular from 'angular';
  angular.module('app.components')
    .directive('kitList',kitList);

  function kitList(){
    return{
      restrict:'E',
      scope:{
        kits:'=kits',
        actions: '=actions'
      },
      controllerAs:'vm',
      templateUrl:'app/components/kitList/kitList.html'
    };
  }

