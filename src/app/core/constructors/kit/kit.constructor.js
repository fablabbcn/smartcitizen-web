


    Kit.$inject = ['Sensor', 'kitUtils'];
export default function Kit(Sensor, kitUtils) {

      /**
       * Kit constructor.
       * @constructor
       * @param {Object} object - Object with all the data about the kit from the API
       * @property {number} id - ID of the kit
       * @property {string} name - Name of the kit
       * @property {string} type - Type of kit. Ex: SmartCitizen Kit
       * @property {string} location - Location of kit. Ex: Madrid, Spain; Germany; Paris, France
       * @property {string} avatar - URL that contains the user avatar
       * @property {Array} labels - System tags
       * @property {string} state - State of the kit. Ex: Never published
       * @property {Array} userTags - User tags. Ex: ''
       */
      function Kit(object) {
        this.id = object.id;
        this.name = object.name;
        this.type = kitUtils.parseType(object);
        this.location = kitUtils.parseLocation(object);
        this.avatar = kitUtils.parseAvatar(object, this.type);
        this.labels = kitUtils.parseLabels(object); //TODO: refactor name to systemTags
        this.state = kitUtils.parseState(object);
        /*jshint camelcase: false */
        this.userTags = object.user_tags;
      }

      return Kit;
    }
