'use strict';

describe('Controller: User Profile', function() {
  // var user;

  beforeEach(module('app.components'));

  var UserProfileController,
      scope,
      mockUserConstructor,
      mockUserData,
      stateParams,
      mockKitsData;

  beforeEach(inject(function($controller, $rootScope) {
    scope = $rootScope.$new();
    
    mockUserConstructor = function(userData) {
      _.extend(this, userData);
    };

    mockUserData = {
      username: 'ruben'
    };

    stateParams = {
      id: 4
    };

    mockKitsData = {
      
    };
    
    UserProfileController = $controller('UserProfileController', {
      $scope: scope, User: mockUserConstructor, userData: mockUserData, $stateParams: stateParams,
       kitsData: mockKitsData
    });
    
    //spyOn(mockUserService, 'post').and.returnValue($q.when({}));
    //spyOn(mockAnimationService, 'blur'); 
  })); 
  describe('State', function() {
    xit('should expose a user instance', function() {
      expect(UserProfileController.user).toBeDefined();
      expect(UserProfileController.user).toEqual(jasmine.any(Object));
      //expect(UserProfileController.user.prototype.constructor).toEqual(mockUserConstructor);
    });
    //add kits before state load on ui-router?
    xit('should expose a kit instance', function() {
      //expect(UserProfileController.kits).toBeDefined();
    });
    xit('should expose filterKits function', function() {
      expect(UserProfileController.filterKits).toEqual(jasmine.any(Function));
    });
    xit('should expose kits filtered', function() {
      
    });
    xit('should expose the status of the filter with value undefined by default', function() {
      expect(UserProfileController.status).toBeUndefined();
    });
    xit('should expose dropdown options', function() {
      expect(UserProfileController.dropdownOptions).toEqual(jasmine.any(Array));
    });
    xit('should expose dropdown options with predefined text & values', function() {
      expect(_.pluck(UserProfileController.dropdownOptions, 'text')).toEqual(['SET UP', 'EDIT']);
      expect(_.pluck(UserProfileController.dropdownOptions, 'value')).toEqual(['1', '2']);
    });
  }); 
});

