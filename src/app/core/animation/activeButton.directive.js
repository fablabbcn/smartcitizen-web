(function() {
  'use strict';

  angular.module('app.components')
    .directive('activeButton', activeButton);

    /**
     * Used to highlight and unhighlight buttons on kit menu
     *
     * It attaches click handlers dynamically
     */

    activeButton.$inject = ['$timeout', '$window'];
    function activeButton($timeout, $window) {
      return {
        link: link,
        restrict: 'A'

      };

      ////////////////////////////

      function link(scope, element) {
        var childrens = element.children();
        var container;

        $timeout(function() {
          var navbar = angular.element('.stickNav');
          var kitMenu = angular.element('.kit_menu');
          var kitOverview = angular.element('.kit_overview');
          var kitDashboard = angular.element('.kit_chart');
          var kitDetails = angular.element('.kit_details');
          var kitOwner = angular.element('.kit_owner');
          var kitComments = angular.element('.kit_comments');

          container = {
            navbar: {
              height: navbar.height()
            },
            kitMenu: {
              height: kitMenu.height()
            },
            kitOverview: {
              height: kitOverview.height(),
              offset: kitOverview.offset().top,
              buttonOrder: 0
            },
            kitDashboard: {
              height: kitDashboard.height(),
              offset: kitDashboard.offset().top,
              buttonOrder: 40
            },
            kitDetails: {
              height: kitDetails.height(),
              offset: kitDetails.offset() ? kitDetails.offset().top : 0,
              buttonOrder: 1
            },
            kitOwner: {
              height: kitOwner.height(),
              offset: kitOwner.offset() ? kitOwner.offset().top : 0,
              buttonOrder: 2
            },
            kitComments: {
              height: kitComments.height(),
              offset: kitComments.offset() ? kitComments.offset().top : 0,
              buttonOrder: 3
            }
          };
        }, 1000);

        function scrollTo(offset) {
          if(!container) {
            return;
          }
          angular.element($window).scrollTop(offset - container.navbar.height - container.kitMenu.height);
        }

        function getButton(buttonOrder) {
          return childrens[buttonOrder];
        }

        function unHighlightButtons() {
          //remove border, fill and stroke of every icon
          var activeButton = angular.element('.md-button.button_active');
          if(activeButton.length) {
            activeButton.removeClass('button_active');

            var strokeContainer = activeButton.find('.stroke_container');
            strokeContainer.css('stroke', 'none');
            strokeContainer.css('stroke-width', '1');

            var fillContainer = strokeContainer.find('.fill_container');
            fillContainer.css('fill', '#82A7B0');
          }
        }

        function highlightButton(button) {
          var clickedButton = angular.element(button);
          //add border, fill and stroke to every icon
          clickedButton.addClass('button_active');

          var strokeContainer = clickedButton.find('.stroke_container');
          strokeContainer.css('stroke', 'white');
          strokeContainer.css('stroke-width', '0.01px');

          var fillContainer = strokeContainer.find('.fill_container');
          fillContainer.css('fill', 'white');
        }

        //attach event handlers for clicks for every button and scroll to a section when clicked
        _.each(childrens, function(button) {
          angular.element(button).on('click', function() {
            var buttonOrder = angular.element(this).index();
            for(var elem in container) {
              if(container[elem].buttonOrder === buttonOrder) {
                var offset = container[elem].offset;
                scrollTo(offset);
                angular.element($window).trigger('scroll');
              }
            }
          });
        });

        var currentSection;

        //on scroll, check if window is on a section
        angular.element($window).on('scroll', function() {
          if(!container){ return; }

          var windowPosition = document.body.scrollTop;
          var appPosition = windowPosition + container.navbar.height + container.kitMenu.height;
          var button;
          if(currentSection !== 'none' && appPosition <= container.kitOverview.offset) {
            button = getButton(container.kitOverview.buttonOrder);
            unHighlightButtons();
            currentSection = 'none';
          } else if(currentSection !== 'overview' && appPosition >= container.kitOverview.offset && appPosition <= container.kitOverview.offset + container.kitOverview.height) {
            button = getButton(container.kitOverview.buttonOrder);
            unHighlightButtons();
            highlightButton(button);
            currentSection = 'overview';
          } else if(currentSection !== 'details' && appPosition >= container.kitDetails.offset && appPosition <= container.kitDetails.offset + container.kitDetails.height) {
            button = getButton(container.kitDetails.buttonOrder);
            unHighlightButtons();
            highlightButton(button);
            currentSection = 'details';
          } else if(currentSection !== 'owner' && appPosition >= container.kitOwner.offset && appPosition <= container.kitOwner.offset + container.kitOwner.height) {
            button = getButton(container.kitOwner.buttonOrder);
            unHighlightButtons();
            highlightButton(button);
            currentSection = 'owner';
          } else if(currentSection !== 'comments' && appPosition >= container.kitComments.offset && appPosition <= container.kitComments.offset + container.kitOwner.height) {
            button = getButton(container.kitComments.buttonOrder);
            unHighlightButtons();
            highlightButton(button);
            currentSection = 'comments';
          }
        });
      }
    }
})();
