(function() {
  'use strict';

  angular.module('app.components')
    .factory('Sensor', function() {

      function Sensor(sensorData) {
        this.id = sensorData.id;
        this.name = getSensorName(sensorData);
        this.unit = getSensorUnit(this.name);
        this.value = getSensorValue(sensorData);
        this.icon = getSensorIcon(this.name);
        this.arrow = getSensorArrow(sensorData);
        this.color = getSensorColor(this.name);
      }

      return Sensor; 
    });


  function getSensorName(sensor) {
    var name = sensor.name;
    var description = sensor.description;
    var sensorName;

    if( new RegExp('custom circuit', 'i').test(description) ) {
      sensorName = name;
    } else {
      if(new RegExp('noise', 'i').test(description) ) {
        sensorName = 'SOUND';
      } else if(new RegExp('light', 'i').test(description) ) {
        sensorName = 'LIGHT';
      } else if(new RegExp('wifi', 'i').test(description) ) {  
        sensorName = 'NETWORKS';
      } else if(new RegExp('co', 'i').test(description) ) {
        sensorName = 'CO';
      } else if(new RegExp('no2', 'i').test(description) ) {
        sensorName = 'NO2';
      } else {
        sensorName = description;
      }          
    }
    return sensorName.toUpperCase();
  }

  function getSensorUnit(sensorName) {
    var sensorUnit;
    
    switch(sensorName) {
      case 'TEMPERATURE':
        sensorUnit = '°C';
        break;
      case 'LIGHT':
        sensorUnit = 'LUX';
        break;
      case 'SOUND':
        sensorUnit = 'DB';
        break;
      case 'HUMIDITY':
      case 'BATTERY':
        sensorUnit = '%';
        break;
      case 'CO': 
      case 'NO2':
        sensorUnit = 'KΩ';
        break;
      case 'NETWORKS': 
        sensorUnit = '#';
        break;
      case 'SOLAR PANEL': 
        sensorUnit = 'V';
        break;
      default: 
        sensorUnit = 'N/A';
    }
    return sensorUnit;
  }

  function getSensorValue(sensor) {
    var value = sensor.value;

    if(!value) {
      return 'N/A';
    } else {
      value = value.toString();
      if(value.indexOf('.') !== -1) {
        value = value.slice(0, value.indexOf('.') + 3);
      }
    }
    return value;
  }

  function getSensorPrevValue(sensor) {
    return sensor.prev_value;
  }

  function getSensorIcon(sensorName) {

    switch(sensorName) {
      case 'TEMPERATURE':
        return './assets/images/temperature_icon.svg';            
        
      case 'HUMIDITY':
        return './assets/images/humidity_icon.svg';
        
      case 'LIGHT':
        return './assets/images/light_icon.svg';
        
      case 'SOUND': 
        return './assets/images/sound_icon.svg';
        
      case 'CO':
        return './assets/images/co_icon.svg';
        
      case 'NO2':
        return './assets/images/no2_icon.svg';
      
      case 'NETWORKS': 
        return './assets/images/networks_icon.svg';

      case 'BATTERY': 
        return './assets/images/battery_icon.svg';

      case 'SOLAR PANEL': 
        return './assets/images/solar_panel_icon.svg';

      default: 
        return './assets/images/avatar.svg';                      
    }
  }

  function getSensorArrow(sensor) {
    var currentValue = getSensorValue(sensor);
    var prevValue = getSensorPrevValue(sensor);

    if(currentValue > prevValue) {
      return './assets/images/arrow_up_icon.svg';          
    } else if(currentValue < prevValue) {
      return './assets/images/arrow_down_icon.svg';
    } else {
      return './assets/images/equal_icon.svg';        
    }
  }

  function getSensorColor(sensorName) {
    switch(sensorName) {
      case 'TEMPERATURE':
        return '#ffc107';            
        
      case 'HUMIDITY':
        return '#4fc3f7';
        
      case 'LIGHT':
        return '#ffee58';
        
      case 'SOUND': 
        return '#f06292';
        
      case 'CO':
        return '#4caf50';
        
      case 'NO2':
        return '#8bc34a';
      
      case 'NETWORKS':
        return '#9575cd';

      case 'SOLAR PANEL': 
        return '#fff9c4';

      default: 
        return 'black';                      
    }
  }

})();