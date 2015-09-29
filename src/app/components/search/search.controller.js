(function() {
  'use strict';

  angular.module('app.components')
    .controller('SearchController', SearchController);

    SearchController.$inject = ['$scope', 'search', 'SearchResult', '$location', 'animation', 'SearchResultLocation'];
    function SearchController($scope, search, SearchResult, $location, animation, SearchResultLocation) {
      var vm = this;
      
      vm.searchTextChange = searchTextChange;
      vm.selectedItemChange = selectedItemChange;
      vm.querySearch = querySearch;

      vm.isIconWhite = true;

      $scope.$on('removeNav', function() {
        $scope.$apply(function() {
          vm.isIconWhite = false;
        });
      });

      $scope.$on('addNav', function() {
        $scope.$apply(function() {
          vm.isIconWhite = true;
        });
      });
     
      ///////////////////

      function searchTextChange() {
      }

      function selectedItemChange(result) {
        if(result.type === 'User') {
          $location.path('/users/' + result.id);
        } else if(result.type === 'Device') {
          $location.path('/kits/' + result.id);
        } else {
          animation.goToLocation({lat: result.lat, lng: result.lng, type: result.type});
        }
      }

      function querySearch(query) {
        if(query.length < 3) {
          return [];
        }

        return search.globalSearch(query)
          .then(function(data) {
            
            if(data.length === 0) {
              //enable scrolling on body if there is no dropdown
              angular.element(document.body).css('overflow', 'auto');
              return data;
            }

            //disable scrolling on body if dropdown is present
            angular.element(document.body).css('overflow', 'hidden');

            return data.map(function(object) {

              if(object.type === 'City' || object.type === 'Country') {
                return new SearchResultLocation(object);
              } else {
                return new SearchResult(object);
              }
            });
          });
      }
    }
})();
