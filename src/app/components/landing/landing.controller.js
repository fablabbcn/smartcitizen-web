

  
    

  LandingController.$inject = ['$timeout', 'animation', '$mdDialog', '$location', '$anchorScroll'];

  export default function $1Controller($timeout, animation, $mdDialog, $location, $anchorScroll) {
    var vm = this;

    vm.showStore = showStore;
    vm.goToHash = goToHash;

    ///////////////////////

    initialize();

    //////////////////

    function initialize() {
      $timeout(function() {
        animation.viewLoaded();
        if($location.hash()) {
          $anchorScroll();
        }
      }, 500);
    }

    function goToHash(hash){
      $location.hash(hash);
      $anchorScroll();
    }

    function showStore() {
      $mdDialog.show({
        hasBackdrop: true,
        controller: 'StoreDialogController',
        templateUrl: 'app/components/store/storeModal.html',
        clickOutsideToClose: true
      });
    }
  }

