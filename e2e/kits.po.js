/**
 * This file uses the Page Object pattern to define the main page for tests
 * https://docs.google.com/presentation/d/1B6manhG0zEXkC-H-tPo2vwU06JhL8w9-XCF9oehXzAQ
 */

'use strict';

function KitsPage() {
  this.mapNavbar = element(by.css('a.map'));
  this.communityNavbar = element(by.css('a.community'));
  this.searchNavbar = element(by.css('search input'));
  this.loginNavbar = element(by.css('.navbar_login_button button'));
  this.signupNavbar = element(by.css('.navbar_signup_button button'));
  this.loginForm = element(by.css('md-dialog form'));
};

module.exports = KitsPage;
