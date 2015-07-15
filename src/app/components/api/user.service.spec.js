/*'use strict';

describe('Service: User', function() {

  beforeEach(module('app.components'));

  var $httpBackend, Restangular, user;

  beforeEach(inject( function($injector) {
    Restangular = $injector.get('Restangular');
    user = $injector.get('user');
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should contain an object', function() {
    expect(user).toEqual(jasmine.any(Object));
  });

  it('should have certain properties', function() {
    expect(Object.keys(user)).toContain('createUser', 'getUser');
  });

  describe('#createUser', function() {
    it('should return a promise', function() {
      var createUser = user.createUser();
      expect(createUser).toEqual(jasmine.any(Object));
      expect(Object.keys(createUser)).toContain('$$state');
    });

    describe('with valid data', function() {
      xit('should create a new user', function() {

      });
    });

    describe('with invalid data', function() {
      xit('should not create a new user', function() {

      });
    });
  });

  describe('#getUser', function() {

  });
}); 
*/
