(function() {
  'use strict';


    angular.module('app.components')
      .directive('moveDown', moveDown)
      .directive('stick', stick)
      .directive('blur', blur)
      .directive('focus', focus)
      .directive('changeMapHeight', changeMapHeight)
      .directive('changeContentMargin', changeContentMargin);

    moveDown.$inject = ['layout'];
    function moveDown(layout) {
      
      function link(scope, element) {
        scope.$watch('moveDown', function(isTrue) {
          if(isTrue) {
            element.addClass('move_down');
          } else {
            element.removeClass('move_down');
          }
        });
      }

      return {
        link: link,
        scope: false,
        restrict: 'A'
      };
    }

    stick.$inject = ['$window', '$timeout'];
    function stick($window, $timeout) {
      function link(scope, element) {
        var elementPosition = element[0].offsetTop;
        //var elementHeight = element[0].offsetHeight;
        var navbarHeight = 64;  

        $timeout(function() {
          elementPosition = element[0].offsetTop;
          //var elementHeight = element[0].offsetHeight;
          navbarHeight = 64;          
        }, 0);  
          

        angular.element($window).on('scroll', function() {
          var windowPosition = document.body.scrollTop;

          if(windowPosition + navbarHeight >= elementPosition) {
            element.addClass('stickMenu');
            scope.$apply(function() {
              scope.moveDown = true;
            });
          } else {
            element.removeClass('stickMenu');
            scope.$apply(function() {
              scope.moveDown = false;
            });
          }
        });
      }

      return {
        link: link,
        scope: false,
        restrict: 'A'
      };
    }

    function blur() {
      
      function link(scope, element) {

        scope.$on('blur', function() {
          element.addClass('blur');
        });

        scope.$on('unblur', function() {
          element.removeClass('blur');
        });
      }

      return {
        link: link,
        scope: false,
        restrict: 'A'
      };
    }

    focus.$inject = ['animation'];
    function focus(animation) {
      function link(scope, element) {
        element.on('focusin', function() {
          animation.removeNav();
        });

        element.on('focusout', function() {
          animation.addNav();
        });
      }

      return {
        link: link
      };
    }

    changeMapHeight.$inject = ['$document', 'layout'];
    function changeMapHeight($document, layout) {
      function link(scope, element, attrs, animationController) {
        var mapHeight;
        var screenHeight = $document[0].body.clientHeight;
        var menuHeight = 35;
        var overviewHeight = 150; 
        var dashboardHeight;

        mapHeight = screenHeight - 64 - menuHeight - overviewHeight; // screen height - navbar height - menu height - overview height - charts height

        element.css('height', mapHeight + 'px');
        
        var position = mapHeight + 64 // map height + navbar height;
        layout.setKit(position);
      }

      return {
        link: link,
        scope: true,
        restrict: 'A'
      };
    }
    
    changeContentMargin.$inject = ['layout'];
    function changeContentMargin(layout) {
      function link(scope, element) {
        var position = layout.getKit();
        console.log('position', position);
        element.css('margin-top', position + 'px');
      }     
 
      return {
        link: link
      };
    }
})();
