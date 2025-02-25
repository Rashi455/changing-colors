class HealthBarChart {
    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 2000,
        containerHeight: _config.containerHeight || 250,
        margin: { top: 20, right: 50, bottom: 70, left: 80 }
      };
  
      this.data = _data;
      this.attribute = 'percent_coronary_heart_disease'; // Default heealth attribute
      this.initVis();
    }
  
    setData(newData) {
      //const messageContainer2 = document.getElementById('message-container2'); 
      //messageContainer2.innerHTML = "inside set data";
      this.data = newData;
      
      this.updateVis(); // Refresh the chart with new data
    }
  
    initVis() {
      let vis = this;
  
      vis.width = (vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right);
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
      vis.svg = d3.select(vis.config.parentElement)
        .attr("width", vis.config.containerWidth)
        .attr("height", vis.config.containerHeight);
  
      vis.chartHealth = vis.svg.append("g")
        .attr("transform", `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);
  
      
      // X-Axis scale for health histogram
      vis.xScaleHealth = d3.scaleBand()
        .domain(["0-5", "5-10", "10-15", "15-20", "20-25", "25-30", "30-35", "35-40", "40-45", "45-50"])
        .range([0, vis.width])
        .padding(0.1);
  
      // Y-Axis scale
      vis.yScaleHist = d3.scaleLinear().range([vis.height, 0]);
  
      vis.histogramGroupHealth = vis.chartHealth.append("g").attr("class", "histogram-group");
  
      // Axes
    
  
      vis.xAxisGroupHealth = vis.chartHealth.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${vis.height})`);
  
   
      vis.yAxisGroupHealth = vis.chartHealth.append("g").attr("class", "y-axis");
  
      // Labels
    
  
      vis.chartHealth.append("text")
        .attr("class", "x-axis-label")
        .attr("x", vis.width / 2)
        .attr("y", vis.height + 40)
        .attr("text-anchor", "middle")
        .text("Health Attribute (%)");
  
      
  
      vis.chartHealth.append("text")
        .attr("class", "y-axis-label")
        .attr("x", -vis.height / 2)
        .attr("y", -50)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .text("Number of Counties");
  
      // Tooltip
      vis.tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "5px")
        .style("border", "1px solid black")
        .style("border-radius", "5px")
        .style("display", "none");
  
  
       
  
        vis.brushG2 = vis.chartHealth.append('g')
            .attr('class', 'brush x-brush');
  
  
       
        const filterButton2 = d3.select('#histfilter-button2').style('display', 'none');
  
  
        d3.select('#histfilter-button2')
            .on('click', function() {
                
                if (vis.selection) {
                    vis.brushed2(vis.selection); 
                }
            });
  
        
        vis.brushHealth = d3.brushX()
            .extent([[0, 0], [vis.xScaleHealth.range()[1], vis.height]])
            .on('brush', function({selection}) {
                vis.selection = selection; 
            })
            
            .on('end', function({selection}) {  
              if (selection) {
                filterButton2.style('display', 'block'); // Show button if there's a selection
              } else {
                filterButton2.style('display', 'none'); // Hide if no selection
                vis.selection = null; // Clear selection
              }
            });
  
      vis.updateVis();
    }
  
    updateVis() {
      let vis = this;
  
      
      
      // **Health Histogram Binning**
      const binsHealth = d3.bin()
        .domain([0, 50])
        .thresholds(d3.range(0, 51, 5))
        (this.data.map(d => d[this.attribute]));
  
      // Update Y scale for health histogram
      vis.yScaleHist.domain([0, d3.max(binsHealth, d => d.length)]);
  
      // **Create Health Histogram Bars**
      vis.histogramGroupHealth.selectAll(".bar-health")
        .data(binsHealth)
        .join("rect")
        .attr("class", "bar-health")
        .attr("x", d => vis.xScaleHealth(`${d.x0}-${d.x1}`))
        .attr("y", d => vis.yScaleHist(d.length))
        .attr("width", vis.xScaleHealth.bandwidth())
        .attr("height", d => vis.height - vis.yScaleHist(d.length))
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
          vis.tooltip.style("display", "block")
            .html(`Health Attribute: ${d.x0}-${d.x1}%<br>Counties: ${d.length}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", () => vis.tooltip.style("display", "none"));
  
      // **Update Axes**
      
      vis.xAxisGroupHealth.call(d3.axisBottom(vis.xScaleHealth));
      vis.yAxisGroupHealth.call(d3.axisLeft(vis.yScaleHist));
  
      // **Update the X-Axis label for health histogram**
      vis.chartHealth.select(".x-axis-label")
        .text(`${this.attribute.replace('_', ' ').toUpperCase()} (%)`);
  
  
    
  
      vis.brushG2.lower(); 
      vis.brushG2
        .call(vis.brushHealth)
    }
  
    // Method to update the selected attribute (called from main.js)
    updateAttribute(newAttribute) {
      this.attribute = newAttribute;
      this.updateVis(); // Re-render with the new attribute
    }
  
  
    brushed2(selection) {
      let vis = this;
      
      //messageContainer2.innerHTML = "INSIDE BRUSHED"; 
      if (selection) {
          // Get pixel coordinates of brush selection
          const [x0,x1] = selection;
          
          const selectedBins = vis.xScaleHealth.domain().filter(bin => {
            const bandStart = vis.xScaleHealth(bin);
            const bandEnd = bandStart + vis.xScaleHealth.bandwidth();
            return bandStart >= x0 && bandEnd <= x1;
          });
  
          //messageContainer4.innerHTML = `Selected bins: ${selectedBins.join(', ')}`;
          
          //messageContainer4.innerHTML = "HO";
          //messageContainer3.innerHTML = xDomain1;
  
          lineFilter = vis.data.filter(d => {
            const bin = `${Math.floor(d[this.attribute] / 5) * 5}-${Math.floor(d[this.attribute] / 5) * 5 + 5}`;
            return selectedBins.includes(bin);
        });
  
          const message = lineFilter.length > 0
              ? lineFilter.map(d => `inactive: ${d[this.attribute]}, county: ${d.cnty_fips}`).join('<br>')
              : 'No data selected.';
  
          // Show the filtered data on the webpage
         //messageContainer3.innerHTML = message;
         filterMapData();
         filterData();
  
        
      } else {
        //do nothing
          
      }
    }
  

  }
  