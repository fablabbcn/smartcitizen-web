import controller from './store.controller';


export default function store() {
      return {
        scope: {
          isLoggedin: '=logged'
        },
        restrict: 'A',
        controller,
        controllerAs: 'vm',
        templateUrl: 'app/components/store/store.html'
      };
    }
