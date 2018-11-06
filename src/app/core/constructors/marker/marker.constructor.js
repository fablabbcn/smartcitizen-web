(function() {
  'use strict';

  angular.module('app.components')
    .factory('Marker', ['device', 'markerUtils', '$state', function(device, markerUtils, $state) {
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
        const id = markerUtils.parseId(deviceData);
        if ($state.$current.name === 'embbed') {
          linkStart = '<a target="_blank" href="https://smartcitizen.me/kits/' + id + '">';
          linkEnd = '</a>';
        }
        this.lat = markerUtils.parseCoordinates(deviceData).lat;
        this.lng = markerUtils.parseCoordinates(deviceData).lng;
        this.message = '<div class="popup"><div class="popup_top ' +
          markerUtils.classify(markerUtils.parseTypeSlug(deviceData)) +
          '">' + linkStart + '<p class="popup_name">' + markerUtils.parseName(deviceData) +
          '</p><p class="popup_type">' + markerUtils.parseType(deviceData) +
          '</p><p class="popup_time"><md-icon class="popup_icon" ' +
          'md-svg-src="./assets/images/update_icon.svg"></md-icon>' +
          markerUtils.parseTime(deviceData) + '</p>' + linkEnd + '</div>' +
          '<div class="popup_bottom"><p class="popup_location">' +
          '<md-icon class="popup_icon" ' +
          'md-svg-src="./assets/images/location_icon_dark.svg"></md-icon>' +
          markerUtils.parseLocation(deviceData) +
          '</p><div class="popup_labels">' +
          createTagsTemplate(markerUtils.parseLabels(deviceData), 'label') +
          createTagsTemplate(markerUtils.parseUserTags(deviceData),
            'tag', true) +
          '</div></div></div>';

        this.icon = markerUtils.getIcon(deviceData);
        this.layer = 'devices';
        this.focus = false;
        this.myData = {
          id: id,
          labels: markerUtils.parseLabels(deviceData),
          tags: markerUtils.parseUserTags(deviceData)
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
