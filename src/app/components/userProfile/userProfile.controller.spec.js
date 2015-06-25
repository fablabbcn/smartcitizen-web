'use strict';

describe('Controller: User Profile', function() {
  var user;

  beforeEach(module('app'));

  var UserProfileController,
      scope,
      mockUserService;

  beforeEach(inject(function($controller, $rootScope, $q) {
    scope = $rootScope.$new();
    
    mockUserService = {
      post: function() {}
    };
    
    UserProfileController = $controller('SignupController', {
      $scope: scope, user: mockUserService
    });
    
    spyOn(mockUserService, 'post').and.returnValue($q.when({}));
    //spyOn(mockAnimationService, 'blur'); 

    describe('') 
});
