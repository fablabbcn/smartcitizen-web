




  export default function apiKey(){
    return {
      scope: {
        apiKey: '=apiKey'
      },
      restrict: 'A',
      controller: 'ApiKeyController',
      controllerAs: 'vm',
      templateUrl: 'app/components/apiKey/apiKey.html'
    };
  }
