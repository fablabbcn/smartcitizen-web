'use strict';

describe('Controller: SignupController', function(){

  beforeEach(module('app'));

  var SignupController,
      scope,
      mdDialog,
      mockUserService,
      mockAnimationService;

  beforeEach(inject(function($controller, $rootScope, $q) {
    scope = $rootScope.$new();
    
    mdDialog = {
      show: function() {}
    };

    mockUserService = {
      post: function() {}
    };

    mockAnimationService = {
      blur: function() {},
      unblur: function() {}
    };
    
    SignupController = $controller('SignupController', {
      $scope: scope, $mdDialog: mdDialog, user: mockUserService, animation: mockAnimationService
    });
    
    spyOn(mockUserService, 'post').and.returnValue($q.when({}));
    spyOn(mockAnimationService, 'blur');  
    spyOn(mdDialog, 'show').and.returnValue($q.when({}));  
  }));


  it('should call blur on animate service when showSignup is called', function() {
    SignupController.showSignup();

    expect(mockAnimationService.blur).toHaveBeenCalled();
  });

  it('should open a popup when click on sign up button', function() {
    SignupController.showSignup();

    expect(mdDialog.show).toHaveBeenCalled();
  });

  it('should call post on user service when signup function is called', function() {
    SignupController.signup({username: 'Ruben', password: '0000', email: 'ruben1586@gmail.com'});

    expect(mockUserService.post).toHaveBeenCalled();
  });
});
