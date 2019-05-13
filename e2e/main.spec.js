
describe('Protractor Demo App', function() {
  beforeEach(function () {
    console.log('Started before each block');
  });

  it('should have a title', function() {
    browser.get('http://localhost:8080/');
    expect(browser.getTitle()).toEqual('Smart Citizen');
  });

  it('visits the styleguide page', function() {
    browser.get('http://localhost:8080/styleguide');
    expect(browser.getTitle()).toEqual('Smart Citizen');

    element.all(by.css('.profile_sidebar_button')).first().click()

    element(by.model('$mdAutocompleteCtrl.scope.searchText'))
      .sendKeys('barcelona')
    //.sendKeys(protractor.Key.down)
    // .sendKeys(protractor.Key.enter)

    // TODO: verify the search has some results

    //element(by.model('$mdAutocompleteCtrl.scope.searchText')).click();

    //expect( $('.btn-cyan') ).toEqual('bbcd')
    //expect( element(by.css('.btn-cyan')) ).toEqual('bbcddf')
  });

  it('visits the about page', function() {
    browser.get('http://localhost:8080/about');
  });

  it('visits the /kits page', function() {
    //browser.get('http://localhost:8080/kits/4');
    //element(by.model('$mdAutocompleteCtrl.scope.searchText')).click();
  });
    // Find search input
    //element(by.model('$mdAutocompleteCtrl.scope.searchText')).click();
    //element(by.model('vm-selectedSensor')).click();
    //element(by.model('vm.dropDownSelection')).click();
});
