'use strict';

describe('Controller: User Profile', function() {
  // var user;

  beforeEach(module('app.components'));

  var UserProfileController,
      scope,
      mockUserConstructor,
      mockUserData;

  beforeEach(inject(function($controller, $rootScope) {
    scope = $rootScope.$new();
    
    mockUserConstructor = function(userData) {
      _.extend(this, userData);
    };

    mockUserData = {
      username: 'ruben'
    };
    
    UserProfileController = $controller('UserProfileController', {
      $scope: scope, User: mockUserConstructor, userData: mockUserData
    });
    
    //spyOn(mockUserService, 'post').and.returnValue($q.when({}));
    //spyOn(mockAnimationService, 'blur'); 
  })); 
  describe('State', function() {
    it('should expose a user instance', function() {
      expect(UserProfileController.user).toBeDefined();
      expect(UserProfileController.user).toEqual(jasmine.any(Object));
      //expect(UserProfileController.user.prototype.constructor).toEqual(mockUserConstructor);
    });
    //add kits before state load on ui-router?
    it('should expose a kit instance', function() {
      //expect(UserProfileController.kits).toBeDefined();
    });
    it('should expose filterKits function', function() {
      expect(UserProfileController.filterKits).toEqual(jasmine.any(Function));
    });
    it('should expose kits filtered', function() {
      
    });
    it('should expose the status of the filter with value undefined by default', function() {
      expect(UserProfileController.status).toBeUndefined();
    });
    it('should expose dropdown options', function() {
      expect(UserProfileController.dropdownOptions).toEqual(jasmine.any(Array));
    });
    it('should expose dropdown options with predefined text & values', function() {
      expect(_.pluck(UserProfileController.dropdownOptions, 'text')).toEqual(['SET UP', 'EDIT']);
      expect(_.pluck(UserProfileController.dropdownOptions, 'value')).toEqual(['1', '2']);
    });
  }); 
});

