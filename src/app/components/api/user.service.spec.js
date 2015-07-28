'use strict';

describe('Service: User', function() {

  beforeEach(module('app.components'));

  var $httpBackend, user;

  beforeEach(inject( function($injector) {
    user = $injector.get('user');
    $httpBackend = $injector.get('$httpBackend');
  }));

  it('should contain an object', function() {
    expect(user).toEqual(jasmine.any(Object));
  });

  it('should have certain properties', function() {
    expect(Object.keys(user)).toContain('createUser', 'getUser', 'updateUser', 'removeUser');
  });

  describe('#createUser', function() {
    it('should call API to create a user', function() {
      $httpBackend.whenPOST('/users')
        .respond(function(method, url, data, headers) {
          return data;
        });
      user.createUser({
        username: 'Ruben',
        password: 'secret'
      }).then(function(res) {
        expect(_.pluck(res)).toEqual(['username', 'passwor']);
      });
      $httpBackend.flush();
    });
  });

  describe('#getUser', function() {
    it('should get a user', function() {
      var path = new RegExp(/\/users\/[0-9]+/);
      $httpBackend.whenGET(path)
        .respond(function(method, url, data, headers) {
          return {
            username: 'Ruben',
            city: 'Barcelona'
          }
        });
      user.getUser(1)
        .then(function(res) {
          expect(_.pluck(res)).toEqual(['username', 'city']);
        });
      $httpBackend.flush();
    });
  });

  describe('#updateUser', function() {
    it('should update auth user', function() {
      var path = '/me';
      $httpBackend.whenPUT(path)
        .respond(function(method, url, data, headers) {
          return data
        });
      user.updateUser({
        username: 'Ruben',
        city: 'Barcelona'
      }).then(function(res) {
        expect(_.pluck(res)).toEqual(['username', 'city']);
      });
      $httpBackend.flush();
    });
  });

  describe('#removeUser', function() {
  });
}); 

