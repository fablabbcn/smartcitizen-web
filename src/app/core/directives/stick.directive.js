'use strict';

angular.module('app.core')
  .directive('dynamicStick', dynamicStick)

  function dynamicStick($window) {
    
    function link(scope, element, attrs) {
      var data = [];

      for(var i=0; i<element.length; i++) {
        
      }
      var elementPosition = element[0].offsetTop;
      var elementHeight = element[0].offsetHeight;

      angular.element($window).on('scroll', function(event) {
        var windowPosition = document.body.scrollTop;
        //console.log('window', windowPosition);
        //console.log('element', element);
        if(windowPosition >= elementPosition + elementHeight) {
          element.addClass('stick');
          //console.log('added');
        } else {
          element.removeClass('stick');
          //console.log('removed');
        }
      })
    };

    return {
      scope: false,
      restrict: 'C',
      link: link
    }
  }