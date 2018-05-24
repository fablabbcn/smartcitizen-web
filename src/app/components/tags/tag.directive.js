



  export default function tag(){
    return{
      restrict: 'E',
      scope:{
        tagName: '=',
        openTag: '&'
      },
      controller:function($scope, $state){
        $scope.openTag = function(){
          $state.go('layout.home.tags', {tags:[$scope.tagName]});
        };
      },
      template:'{{tagName}}',
      link: function(scope, element, attrs){
        element.addClass('tag');

        if(typeof(attrs.clickable) !== 'undefined'){
          element.bind('click', scope.openTag);
        }
      }
    };
  }
