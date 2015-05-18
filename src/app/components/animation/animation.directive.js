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
        var navbarHeight = angular.element('.stickNav').height();  

        $timeout(function() {
          elementPosition = element[0].offsetTop;
          //var elementHeight = element[0].offsetHeight;
          navbarHeight = angular.element('.stickNav').height();          
        }, 1000);  
          

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

    changeMapHeight.$inject = ['$document', 'layout', '$timeout'];
    function changeMapHeight($document, layout, $timeout) {
      function link(scope, element, attrs, animationController) {

        var screenHeight = $document[0].body.clientHeight;
        var navbarHeight = angular.element('.stickNav').height();
        
        var overviewHeight = angular.element('.kit_overview').height(); 
        var menuHeight = angular.element('.kit_menu').height();

        $timeout(function() {
          var overviewHeight = angular.element('.kit_overview').height(); 
          var menuHeight = angular.element('.kit_menu').height();
          
          var mapHeight = screenHeight - navbarHeight - menuHeight - overviewHeight; // screen height - navbar height - menu height - overview height - charts height
          element.css('height', mapHeight + 'px');
          
          //layout.setKit(position);
          //var position = mapHeight + navbarHeight // map height + navbar height;
        });
        
      }

      return {
        link: link,
        scope: true,
        restrict: 'A'
      };
    }
    
    changeContentMargin.$inject = ['layout', '$timeout'];
    function changeContentMargin(layout, $timeout) {
      function link(scope, element) {
        $timeout(function() {
          var mapHeight = angular.element('.angular-leaflet-map').height();
          var navbarHeight = angular.element('.stickNav').height();

          element.css('margin-top', mapHeight + navbarHeight + 'px');
        });
      }     
 
      return {
        link: link
      };
    }
})();
