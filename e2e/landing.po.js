/**
 * This file uses the Page Object pattern to define the main page for tests
 * https://docs.google.com/presentation/d/1B6manhG0zEXkC-H-tPo2vwU06JhL8w9-XCF9oehXzAQ
 */

'use strict';

var LandingPage = function() {
  this.videoSection = element(by.css('.video-section'))
  this.h1El = this.videoSection.element(by.css('h1'));
  this.ctaVideo = this.videoSection.element(by.css('a.btn-yellow'));
  this.ctaPlatform = element(by.css('a.sc-off-cta-platform'));
};

module.exports = LandingPage;
