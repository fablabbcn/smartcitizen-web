(function() {
  'use strict';

    /**
     * TODO: This directives can be split up each one in a different file
     */

    angular.module('app.components')
      .directive('moveDown', moveDown)
      .directive('stick', stick)
      .directive('blur', blur)
      .directive('focus', focus)
      .directive('changeMapHeight', changeMapHeight)
      .directive('changeContentMargin', changeContentMargin)
      .directive('focusInput', focusInput);

    /**
     * It moves down kit section to ease the transition after the kit menu is sticked to the top
     *
     */
    moveDown.$inject = [];
    function moveDown() {

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

    /**
     * It sticks kit menu when kit menu touchs navbar on scrolling
     *
     */
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

          //sticking menu and moving up/down
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

    /**
     * Unused directive. Double-check is not being used before removing it
     *
     */

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

    /**
     * Used to remove nav and unable scrolling when searching
     *
     */
    focus.$inject = ['animation'];
    function focus(animation) {
      function link(scope, element) {
        element.on('focusin', function() {
          animation.removeNav();
        });

        element.on('focusout', function() {
          animation.addNav();
        });

        var searchInput = element.find('input');
        searchInput.on('blur', function() {
          //enable scrolling on body when search input is not active
          angular.element(document.body).css('overflow', 'auto');
        });

        searchInput.on('focus', function() {
          angular.element(document.body).css('overflow', 'hidden');
        });
      }

      return {
        link: link
      };
    }

    /**
     * Changes map section based on screen size
     *
     */
    changeMapHeight.$inject = ['$document', 'layout', '$timeout'];
    function changeMapHeight($document, layout, $timeout) {
      function link(scope, element) {

        var screenHeight = $document[0].body.clientHeight;
        var navbarHeight = angular.element('.stickNav').height();

        // var overviewHeight = angular.element('.kit_overview').height();
        // var menuHeight = angular.element('.kit_menu').height();
        // var chartHeight = angular.element('.kit_chart').height();

        $timeout(function() {
          var overviewHeight = angular.element('.over_map').height();

          var mapHeight = screenHeight - navbarHeight - overviewHeight; // screen height - navbar height - menu height - overview height - charts height
          element.css('height', mapHeight + 'px');

          var aboveTheFoldHeight = screenHeight - overviewHeight;
          angular.element('section[change-content-margin]').css('margin-top', aboveTheFoldHeight + 'px');
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

    /**
     * Changes margin on kit section based on above-the-fold space left after map section is resize
     */

    changeContentMargin.$inject = ['layout', '$timeout', '$document'];
    function changeContentMargin(layout, $timeout, $document) {
      function link(scope, element) {
          var screenHeight = $document[0].body.clientHeight;

          var overviewHeight = angular.element('.over_map').height();

          var aboveTheFoldHeight = screenHeight - overviewHeight; // screen height - navbar height - menu height - overview height - charts height
          element.css('margin-top', aboveTheFoldHeight + 'px');
      }

      return {
        link: link
      };
    }

    /**
     * Fixes autofocus for inputs that are inside modals
     *
     */
    focusInput.$inject = ['$timeout'];
    function focusInput($timeout) {
      function link(scope, elem) {
        $timeout(function() {
          elem.focus();
        });
      }
      return {
        link: link
      };
    }
})();
