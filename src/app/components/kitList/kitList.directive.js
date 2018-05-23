  export default function kitList(){
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
