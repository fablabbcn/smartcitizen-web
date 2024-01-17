(function() {
  'use strict';

  angular.module('app.components')
    .factory('Marker', ['deviceUtils', 'markerUtils', '$state', function(deviceUtils, markerUtils, $state) {
      /**
       * Marker constructor
       * @constructor
       * @param {Object} deviceData - Object with data about marker from API
       * @property {number} lat - Latitude
       * @property {number} lng - Longitude
       * @property {string} message - Message inside marker popup
       * @property {Object} icon - Object with classname, size and type of marker icon
       * @property {string} layer - Map layer that icons belongs to
       * @property {boolean} focus - Whether marker popup is opened
       * @property {Object} myData - Marker id and labels
       */
      function Marker(deviceData) {
        let linkStart = '', linkEnd = '';
        const id = deviceUtils.parseId(deviceData);
        if ($state.$current.name === 'embbed') {
          linkStart = '<a target="_blank" href="https://smartcitizen.me/kits/' + id + '">';
          linkEnd = '</a>';
        }
        // TODO - Do we need double implementations in marker and device of some of these things?
        this.lat = deviceUtils.parseCoordinates(deviceData).lat;
        this.lng = deviceUtils.parseCoordinates(deviceData).lng;
        // TODO - Refactor, pop-up lastreading at doesn't get updated by publication
        // (in production either)
        this.message = '<div class="popup"><div class="popup_top sck' +
          // TODO Refactor - Check if we ever going to do this differently...
          // The color of the popup seems to be determined by the slug
          // However, we do not use other colors, other than the sck class,
          // which has now been hardcoded above
          // markerUtils.classify(markerUtils.parseTypeSlug(deviceData)) +
          '">' + linkStart + '<p class="popup_name">' + deviceUtils.parseName(deviceData, true) +
          '</p><p class="popup_type">' +
          // TODO Refactor - Decide what we put here
          deviceUtils.parseType(deviceData) +
          '</p><p class="popup_time"><md-icon class="popup_icon" ' +
          'md-svg-src="./assets/images/update_icon.svg"></md-icon>' +
          deviceUtils.parseLastReadingAt(deviceData, true) + '</p>' + linkEnd + '</div>' +
          '<div class="popup_bottom"><p class="popup_location">' +
          '<md-icon class="popup_icon" ' +
          'md-svg-src="./assets/images/location_icon_dark.svg"></md-icon>' +
          deviceUtils.parseLocation(deviceData) +
          '</p><div class="popup_labels">' +
          createTagsTemplate(deviceUtils.parseSystemTags(deviceData), 'label') +
          createTagsTemplate(deviceUtils.parseUserTags(deviceData),
            'tag', true) +
          '</div></div></div>';

        this.icon = markerUtils.getIcon(deviceData);
        this.layer = 'devices';
        this.focus = false;
        this.myData = {
          id: id,
          labels: deviceUtils.parseSystemTags(deviceData),
          tags: deviceUtils.parseUserTags(deviceData)
        };
      }
      return Marker;

      function createTagsTemplate(tagsArr, tagType, clickable) {
        if(typeof(clickable) === 'undefined'){
          clickable = false;
        }
        var clickablTag = '';
        if(clickable){
          clickablTag = 'clickable';
        }

        if(!tagType){
          tagType = 'tag';
        }

        return _.reduce(tagsArr, function(acc, label) {
          var element ='';
          if(tagType === 'tag'){
            element = '<tag ng-attr-tag-name="\''+ label +'\'" ' +
              clickablTag +'></tag>';
          }else{
            element = '<span class="'+tagType+'">'+label+'</span>';
          }
          return acc.concat(element);
        }, '');
      }

    }]);
})();
