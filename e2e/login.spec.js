'use strict';


describe('Login and Signup process', function () {
  var page;

  beforeEach(function () {
    browser.get('http://localhost:8080/kits/');
    browser.waitForAngular();
    var Page = require('./kits-index.po');
    page = new Page;
  });

  it('should show the login modal when clicking on login button', function() {
    page.loginNavbar.click();
    expect(page.loginForm.isPresent()).toBe(true);
    expect(page.loginForm.getAttribute('name')).toBe('login_form');
  });

});
