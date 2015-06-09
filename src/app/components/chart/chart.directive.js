(function() {
  'use strict';

  angular.module('app.components')
    .directive('chart', chart);

    chart.$inject = ['sensor'];
    function chart(sensor) { 
      var margin, width, height, svg, xScale, yScale0, yScale1, xAxis, yAxisLeft, yAxisRight, dateFormat, areaMain, valueLineMain, areaCompare, valueLineCompare, focusCompare, focusMain, popup, dataMain, colorMain, yAxisScale, unitMain;

      return {
        link: link,
        restrict: 'A',
        scope: {
          chartDataMain: '=',
          chartDataCompare: '=',
          sensorDataMain: '=',
          sensorDataCompare: '='
        }
      };

      function link(scope, elem) {

        setTimeout(function() {
          createChart(elem[0]);          
          //updateChartMain(elem[0], {}, data, elem);                    
        }, 1000);

        scope.$watch('chartDataMain', function(newData) {
          if(newData !== undefined) {
            console.log('da', scope.sensorDataMain);
            var data = newData.map(function(dataPoint) {
              return {
                date: dateFormat(dataPoint.time),
                count: dataPoint && dataPoint.data           
              };
            });

            data.sort(function(a, b) {
              return a.date - b.date;
            });
            dataMain = data;
            colorMain = scope.sensorDataMain.color;
            unitMain = scope.sensorDataMain.unit;
            updateChartData(dataMain, {type: 'main', container: elem[0], color: colorMain, unit: unitMain });
          }
        });
        scope.$watch('chartDataCompare', function(newData) {
          if(newData !== undefined) {

            var data = newData.map(function(dataPoint) {
              return {
                date: dateFormat(dataPoint.time),
                count: dataPoint && dataPoint.data           
              };
            });

            data.sort(function(a, b) {
              return a.date - b.date;
            });

            var arr = [];
            arr.push(dataMain);
            arr.push(data);
             
            updateChartData(data, {type: 'compare', container: elem[0], color: scope.sensorDataCompare.color, unit: scope.sensorDataCompare.unit });
          }
        });
      }


      function createChart(elem) {
        margin = {top: 20, right: 15, bottom: 20, left: 40};
        width = elem.clientWidth - margin.left - margin.right;
        height = elem.clientHeight - margin.top - margin.bottom;

        xScale = d3.time.scale().range([0, width]);
        yScale0 = d3.scale.linear().range([height, 0]);
        yScale1 = d3.scale.linear().range([height, 0]);
        yAxisScale = d3.scale.linear().range([height, 0]); 

        dateFormat = d3.time.format.utc('%Y-%m-%dT%H:%M:%SZ').parse;//d3.time.format('%Y-%m-%dT%X.%LZ').parse; //'YYYY-MM-DDTHH:mm:ssZ'

        xAxis = d3.svg.axis()
          .scale(xScale)
          .orient('bottom')
          .ticks(5);

        yAxisLeft = d3.svg.axis()
          .scale(yScale0)
          .orient('left')
          .ticks(5);

        yAxisRight = d3.svg.axis()
          .scale(yScale1)
          .orient('right')
          .ticks(5);

        areaMain = d3.svg.area()
          .interpolate('linear')  //Here
          .x(function(d) { return xScale(d.date); })
          .y0(height)
          .y1(function(d) { return yScale0(d.count); });

        valueLineMain = d3.svg.line()
          .interpolate('linear')   
          .x(function(d) { return xScale(d.date); })
          .y(function(d) { return yScale0(d.count); });

        areaCompare = d3.svg.area()
          .interpolate('linear')  //Here
          .x(function(d) { return xScale(d.date); })
          .y0(height)
          .y1(function(d) { return yScale1(d.count); });

        valueLineCompare = d3.svg.line()
          .interpolate('linear')   
          .x(function(d) { return xScale(d.date); })
          .y(function(d) { return yScale1(d.count); });

        svg = d3
          .select(elem)
          .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
          .append('g')
            .attr('transform', 'translate(' + (margin.left - margin.right) + ',' + margin.top + ')');
      }

      function updateChartData(newData, options) {
        if(options.type === 'main') {
          updateChartMain(newData, options);
        } else if(options.type === 'compare') {
          updateChartCompare(newData, options);
        }
      }

      function updateChartMain(data, options) {
        xScale.domain(d3.extent(data, function(d) { return d.date; }));
        //yScale0.domain([0, d3.max(data, function(d) { return d.count; })]);
        yScale0.domain([(d3.min(data, function(d) { return d.count; })) * 0.8, (d3.max(data, function(d) { return d.count; })) * 1.2]);
        
        console.log('datum', data);

        svg.selectAll('*').remove();

        var top = d3.select('.chart_container svg');
        console.log('top', top);
        var gradient = svg.append('svg:defs')
            .append('svg:linearGradient')
            .attr('id', 'gradient')
            .attr('y1', '0%')
            .attr('x1', '0%')
            .attr('y2', '100%')
            .attr('x2', '100%')
            .attr('spreadMethod', 'pad');

        gradient.append('svg:stop')
            .attr('offset', '0%')
            .attr('stop-color', 'black')
            .attr('stop-opacity', 1);

        gradient.append('svg:stop')
            .attr('offset', '100%')
            .attr('stop-color', 'white')
            .attr('stop-opacity', 1);

        //Add the area path
        svg.append('path')
          .datum(data)
          .attr('class', 'chart_area')
          .attr('fill', options.color)
          .attr('d', areaMain);

        // Add the valueline path.
        svg.append('path')
          .attr('class', 'chart_line')
          .attr('stroke', options.color)
          .attr('d', valueLineMain(data));

        // Add the X Axis
        svg.append('g')
          .attr('class', 'axis x')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

        // Add the Y Axis
        svg.append('g')
          .attr('class', 'axis y_left')
          .style('fill', options.color)
          .call(yAxisLeft);
        
        // Draw the x Grid lines
        svg.append('g')
          .attr('class', 'grid')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xGrid()
            .tickSize(-height, 0, 0)
            .tickFormat('')
          );

        // Draw the y Grid lines
        svg.append('g')
          .attr('class', 'grid')
          .call(yGrid()
            .tickSize(-width, 0, 0)
            .tickFormat('')
          );
        
        focusMain = svg.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        /*focusMain.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 1)
          .attr('height', height)
          .attr('stroke-dasharray', '5, 5');
        */
        focusMain.append('circle')
          .style('stroke', options.color)
          .attr('r', 4.5);


        /*focus.append("text")
          .attr('class', 'text_hover_container')
          .attr("x", 9)
          .attr("dy", ".35em");
        */
        var popupWidth = 84;
        var popupHeight = 46;

        popup = svg.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        popup.append('rect')
          .attr('width', popupWidth)
          .attr('height', popupHeight)
          .attr('transform', function() {
            var result = 'translate(-42, 5)';
                                                  
            return result;
          })
          .style('stroke', 'grey')
          .style('stroke-width', '0.5')
          .style('fill', 'white');

        var text = popup.append('text')
          .attr('class', '');

        var textMain = text.append('tspan')
          .attr('class', 'popup_main')
          .attr('text-anchor', 'start');

          textMain.append('tspan')
          .attr('class', 'popup_value')
          .attr('x', (- popupWidth / 2) + 7)
          .attr('y', popupHeight / 2)
          .attr('dx', 0);
          //.attr( 'text-anchor', 'middle' );
          
          textMain.append('tspan')
          .attr('dx', 2)
          .attr('class', 'popup_unit');

        text.append('tspan')
          .attr('class', 'popup_date')
          .attr('x', 0)
          .attr('y', popupHeight)
          .attr( 'text-anchor', 'middle' );
          
        svg.append('rect')
          .attr('class', 'overlay')
          .attr('width', width)
          .attr('height', height)
          .on('mouseover', function() { 
            popup.style('display', null);             
            focusMain.style('display', null); 
          })          
          .on('mouseout', function() { 
            popup.style('display', 'none');             
            focusMain.style('display', 'none'); 
          })
          .on('mousemove', mousemove);

        function mousemove() {
          var bisectDate = d3.bisector(function(d) { return d.date; }).left;

          var x0 = xScale.invert(d3.mouse(this)[0]);
          var i = bisectDate(data, x0, 1);
          var d0 = data[i - 1];
          var d1 = data[i];
          var d = x0 - d0.date > d1.date - x0 ? d1 : d0;

          focusMain.attr('transform', 'translate(' + xScale(d.date) + ', ' + yScale0(d.count) + ')');
          popup.attr('transform', 'translate(' + (xScale(d.date) + 80) + ', ' + (d3.mouse(this)[1] - 20) + ')');
          var popupText = popup.select('text');
          popupText.select('.popup_value').text(parseValue(d.count));
          popupText.select('.popup_unit').text(options.unit);
          popupText.select('.popup_date').text(parseTime(d.date));
        }       
        function xGrid() {
          return d3.svg.axis()
            .scale(xScale)
            .orient('bottom')
            .ticks(5);
        }

        function yGrid() {
          return d3.svg.axis()
            .scale(yScale0)
            .orient('left')
            .ticks(5);
        }

        function parseValue(value) {
          if(value.toString().indexOf('.') !== -1) {
            var result = value.toString().split('.');
            return result[0] + '.' + result[1].slice(0, 2);            
          } else {
            return value.toString().slice(0, 2);
          }
        }

        function parseTime(time) {
          return moment(time).format('ddd Do MMM YYYY');
        }
      }


      function updateChartCompare(data, options) {
        xScale.domain(d3.extent(dataMain, function(d) { return d.date; }));
        //yScale0.domain([0, d3.max(dataMain, function(d) { return d.count; })]);        
        //yScale1.domain([0, d3.max(data, function(d) { return d.count; })]);
        yScale1.domain([(d3.min(data, function(d) { return d.count; })) * 0.8, (d3.max(data, function(d) { return d.count; })) * 1.2]);        

        console.log('datum', data);

        svg.selectAll('*').remove();

        //Add both area paths
        svg.append('path')
          .datum(dataMain)
          .attr('class', 'chart_area')
          .attr('fill', colorMain)
          .attr('d', areaMain);

        svg.append('path')
          .datum(data)
          .attr('class', 'chart_area')
          .attr('fill', options.color)
          .attr('d', areaCompare);

        // Add both valueline paths.
        svg.append('path')
          .attr('class', 'chart_line')
          .attr('stroke', colorMain)
          .attr('d', valueLineMain(dataMain));

        svg.append('path')
          .attr('class', 'chart_line')
          .attr('stroke', options.color)          
          .attr('d', valueLineCompare(data));

        // Add the X Axis
        svg.append('g')
          .attr('class', 'axis x')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xAxis);

        // Add both Y Axis
        svg.append('g')
          .attr('class', 'axis y_left')
          .style('fill', colorMain)
          .call(yAxisLeft);

        svg.append('g')
          .attr('class', 'axis y_right')
          .style('fill', options.color)
          .attr('transform', 'translate(' + width + ' ,0)') 
          .call(yAxisRight);
        
        // Draw the x Grid lines
        svg.append('g')
          .attr('class', 'grid')
          .attr('transform', 'translate(0,' + height + ')')
          .call(xGrid()
            .tickSize(-height, 0, 0)
            .tickFormat('')
          );

        // Draw the y Grid lines
        svg.append('g')
          .attr('class', 'grid')
          .call(yGrid()
            .tickSize(-width, 0, 0)
            .tickFormat('')
          );
        
        focusCompare = svg.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        focusMain = svg.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        focusCompare.append('circle')
          .style('stroke', options.color)
          .attr('r', 4.5);

        focusMain.append('circle')
          .style('stroke', colorMain)
          .attr('r', 4.5);

        /*focus.append("text")
          .attr('class', 'text_hover_container')
          .attr("x", 9)
          .attr("dy", ".35em");
        */
        var popupWidth = 84;
        var popupHeight = 75;

        popup = svg.append('g')
          .attr('class', 'focus')
          .style('display', 'none');

        popup.append('rect')
          .attr('width', popupWidth)
          .attr('height', popupHeight)
          .style('min-width', '40px')
          .attr('transform', function() {
            var result = 'translate(-42, 5)';
                                                  
            return result;
          })
          .style('stroke', 'grey')
          .style('stroke-width', '0.5')
          .style('fill', 'white');

        popup.append('rect')
          .attr('width', 8)
          .attr('height', 2)
          .attr('transform', function() {
            return 'translate(-40, 20)';
          })
          .style('fill', colorMain);

        popup.append('rect')
          .attr('width', 8)
          .attr('height', 2)
          .attr('transform', function() {
            return 'translate(-40, 45)';
          })
          .style('fill', options.color);

        var text = popup.append('text')
          .attr('class', '');

        var textMain = text.append('tspan')
          .attr('class', 'popup_main');

        textMain.append('tspan')
          .attr('class', 'popup_value')
          .attr('x', 0)
          .attr('y', popupHeight / 3)
          .attr( 'text-anchor', 'middle' );
        
        textMain.append('tspan')
          .attr('class', 'popup_unit');

        var textCompare = text.append('tspan')
          .attr('class', 'popup_compare');

        textCompare.append('tspan')
          .attr('class', 'popup_value')
          .attr('x', 0)
          .attr('y', popupHeight / 1.5)
          .attr( 'text-anchor', 'middle' );                    

        textCompare.append('tspan')
          .attr('class', 'popup_unit');

        text.append('tspan')
          .attr('class', 'popup_date')
          .attr('x', 0)
          .attr('y', popupHeight)
          .attr( 'text-anchor', 'middle' );
          
        svg.append('rect')
          .attr('class', 'overlay')
          .attr('width', width)
          .attr('height', height)
          .on('mouseover', function() { 
            focusCompare.style('display', null); 
            focusMain.style('display', null);             
            popup.style('display', null);                         
          })
          .on('mouseout', function() { 
            focusCompare.style('display', 'none'); 
            focusMain.style('display', 'none');             
            popup.style('display', 'none');                         
          })
          .on('mousemove', mousemove);

        function mousemove() {
          var bisectDate = d3.bisector(function(d) { return d.date; }).left;

          var x0 = xScale.invert(d3.mouse(this)[0]);
          var i = bisectDate(data, x0, 1);
          var d0 = data[i - 1];
          var d1 = data[i];
          var d = x0 - d0.date > d1.date - x0 ? d1 : d0;
          focusCompare.attr('transform', 'translate(' + xScale(d.date) + ', ' + yScale1(d.count) + ')');
          

          var dMain0 = dataMain[i - 1];
          var dMain1 = dataMain[i];
          var dMain = x0 - dMain0.date > dMain1.date - x0 ? dMain1 : dMain0;
          focusMain.attr('transform', 'translate(' + xScale(dMain.date) + ', ' + yScale0(dMain.count) + ')');

          popup.attr('transform', 'translate(' + (xScale(d.date) + 80) + ', ' + (d3.mouse(this)[1] - 20) + ')');
          
          var popupText = popup.select('text');
          var popupMain = popupText.select('.popup_main');
          popupMain.select('.popup_value').text(parseValue(dMain.count));
          popupMain.select('.popup_unit').text(unitMain);
          var popupCompare = popupText.select('.popup_compare');
          popupCompare.select('.popup_value').text(parseValue(d.count));
          popupCompare.select('.popup_unit').text(options.unit);
          popupText.select('.popup_date').text(parseTime(d.date));

          


        }       
        function xGrid() {
          return d3.svg.axis()
            .scale(xScale)
            .orient('bottom')
            .ticks(5);
        }

        function yGrid() {
          return d3.svg.axis()
            .scale(yScale0)
            .orient('left')
            .ticks(5);
        }
        function parseValue(value) {
          console.log('value', value);
          if(value.toString().indexOf('.') !== -1) {
            var result = value.toString().split('.');
            return result[0] + '.' + result[1].slice(0, 2);            
          } else {
            return result.toString().slice(0, 2);
          }
        }

        function parseTime(time) {
          return moment(time).format('ddd Do MMM YYYY');
        }
      }
    }

})();
