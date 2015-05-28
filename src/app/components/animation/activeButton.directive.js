(function() {
  'use strict';

  angular.module('app.components') 
    .directive('activeButton', activeButton);
    
    activeButton.$inject = ['$timeout'];
    function activeButton($timeout) {
      return {
        link: link,
        restrict: 'A'

      };

      ////////////////////////////

      function link(scope, element) {
        var childrens = element.children();
        var container;

        $timeout(function() {
          var offsetContainer;
          container = {
            navbar: {
              height: angular.element('.stickNav').height(),
            },            
            kitMenu: {
              height: angular.element('.kit_menu').height()
            },
            kitOverview: {               
              height: angular.element('.kit_overview').height(),
              offset: angular.element('.kit_overview').offset().top,
              buttonOrder: 0                   
            },
            kitDashboard: {
              buttonOrder: 1
            },
            kitUser: {

            },
            kitComments: {
              
            }
          };
        }, 1000);

        function scrollTo(offset) {
          angular.element(window).scrollTop(offset - container.navbar.height - container.kitMenu.height);        
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
        for(var i=0; i<childrens.length; i++) {
          var button = childrens[i];
          angular.element(button).on('click', function() {
            var buttonOrder = angular.element(this).index();
            for(var elem in container) {
              if(container[elem].buttonOrder === buttonOrder) {
                var offset = container[elem].offset;
              }
            }
            scrollTo(offset);
          });
        }

        //on scroll, check if window is on a section
        angular.element(window).on('scroll', function() {
          var windowPosition = document.body.scrollTop;

          if(windowPosition + container.navbar.height + container.kitMenu.height <= container.kitOverview.offset) {
            var button = getButton(container.kitOverview.buttonOrder);
            unHighlightButtons();
          } else if(windowPosition + container.navbar.height + container.kitMenu.height >= container.kitOverview.offset) {
            var button = getButton(container.kitOverview.buttonOrder);
            highlightButton(button);
          }            
        });
      }
    } 
})();
