'use strict';



describe('The landing page', function () {
  var page;

  beforeEach(function () {
    browser.get('http://localhost:8080');
    browser.waitForAngular();
    var Page = require('./landing.po');
    page = new Page();
  });

  it('should inclue headings and link to video', function() {
    expect(page.h1El.getText()).toBe('CITIZEN SCIENCE REVOLUTION');
    expect(page.ctaVideo.getAttribute('href')).toMatch('PlayGroundMag/videos/2061510993888766');
  });

  it('should go on the platform when clicking on the cta', function() {
    page.ctaPlatform.click()
    expect(browser.getCurrentUrl()).toBe('http://localhost:8080/kits/');
  });
});
