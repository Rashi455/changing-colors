class ChoroplethMap {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 500,
            margin: _config.margin || {top: 20, right: 20, bottom: 20, left: 20},
            tooltipPadding: 10,
            
            legendBottom: 70,
            legendLeft: 315,
            legendRectHeight: 12, 
            legendRectWidth: 125
            
        }
        this.data = _data;
        this.initVis();
    }
  
    setData(newData) {
        this.data = newData;
        this.updateVis(); // Refresh the chart with new data
    }
  
    initVis() {
        let vis = this;
  
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);
  
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
        vis.projection = d3.geoAlbersUsa();
        vis.geoPath = d3.geoPath().projection(vis.projection);
  
        vis.colorScale = d3.scaleLinear()
            .range(['#cfe2f2', '#0d306b'])
            .interpolate(d3.interpolateHcl);
  
      
  
        vis.linearGradient = vis.svg.append('defs').append('linearGradient')
            .attr("id", "legend-gradient");
  
        vis.legend = vis.chart.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.config.legendLeft},${vis.height - vis.config.legendBottom})`);
  
        vis.legendRect = vis.legend.append('rect')
            .attr('width', vis.config.legendRectWidth)
            .attr('height', vis.config.legendRectHeight);
  
        vis.legendTitle = vis.legend.append('text')
            .attr('class', 'legend-title')
            .attr('dy', '.35em')
            .attr('y', -10)
            .text('Percent Inactive (%)');
          
  
        vis.updateVis();
    }
  
    updateVis() {
        let vis = this;
  
        const percentInactiveExtent = d3.extent(vis.data.objects.counties.geometries, d => d.properties.percent_inactive);
  
        vis.colorScale.domain(percentInactiveExtent);
  
        vis.legendStops = [
            { color: '#cfe2f2', value: percentInactiveExtent[0], offset: 0},
            { color: '#0d306b', value: percentInactiveExtent[1], offset: 100},
        ];
  
        vis.renderVis();
    }
  
    renderVis() {
      let vis = this;
  
      const counties = topojson.feature(vis.data, vis.data.objects.counties);
  
      vis.projection.fitSize([vis.width, vis.height], counties);
  
      const countyPath = vis.chart.selectAll('.county')
          .data(counties.features)
          .join('path')
          .attr('class', 'county')
          .attr('d', vis.geoPath)
          .attr('fill', d => {
              if (d.properties.filtered) {
                  // Color filtered counties with the color scale
                  return vis.colorScale(d.properties.percent_inactive);
              } else {
                  // Color unfiltered counties grey
                  return '#D3D3D3';  // Grey for unfiltered counties
              }
          })
          .attr('pointer-events', d => d.properties.filtered ? 'auto' : 'none'); // Disable interaction for unfiltered counties
  
      countyPath
          .on('mousemove', (event, d) => {
              if (!d.properties.filtered) return;  // Skip interaction for unfiltered counties
  
              const percentInactive = d.properties.percent_inactive !== undefined 
                  ? `<strong>${d.properties.percent_inactive}%</strong> inactive population`
                  : 'No data available';
  
              d3.select('#tooltip')
                  .style('display', 'block')
                  .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
                  .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                  .html(`
                      <div class="tooltip-title">${d.properties.name}</div>
                      <div>${percentInactive}</div>
                  `);
          })
          .on('mouseleave', () => {
              d3.select('#tooltip').style('display', 'none');
          });
  
      vis.legend.selectAll('.legend-label')
          .data(vis.legendStops)
          .join('text')
          .attr('class', 'legend-label')
          .attr('text-anchor', 'middle')
          .attr('dy', '.35em')
          .attr('y', 20)
          .attr('x', (d, index) => index === 0 ? 0 : vis.config.legendRectWidth)
          .text(d => Math.round(d.value));
  
      vis.linearGradient.selectAll('stop')
          .data(vis.legendStops)
          .join('stop')
          .attr('offset', d => d.offset + '%')
          .attr('stop-color', d => d.color);
  
      vis.legendRect.attr('fill', 'url(#legend-gradient)');
      
  }
  
  }
  