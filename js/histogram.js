class Histogram {
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
  
      vis.chartInactive = vis.svg.append("g")
        .attr("transform", `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);
  
      
  
      // X-Axis scale for inactive histogram
      vis.xScaleInactive = d3.scaleBand()
        .domain(["0-5", "5-10", "10-15", "15-20", "20-25", "25-30", "30-35", "35-40", "40-45", "45-50"])
        .range([0, vis.width])
        .padding(0.1);
  
      
      
      // Y-Axis scale
      vis.yScaleHist = d3.scaleLinear().range([vis.height, 0]);
  
      vis.histogramGroupInactive = vis.chartInactive.append("g").attr("class", "histogram-group");
      
  
      // Axes
      vis.xAxisGroupInactive = vis.chartInactive.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${vis.height})`);
  
     
  
      vis.yAxisGroupInactive = vis.chartInactive.append("g").attr("class", "y-axis");
     
  
      // Labels
      vis.chartInactive.append("text")
        .attr("class", "x-axis-label")
        .attr("x", vis.width / 2)
        .attr("y", vis.height + 40)
        .attr("text-anchor", "middle")
        .text("Percent Inactive (%)");
  
     
  
      vis.chartInactive.append("text")
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
  
  
        vis.brushG = vis.chartInactive.append('g')
            .attr('class', 'brush x-brush');
  
      
  
        const filterButton = d3.select('#histfilter-button').style('display', 'none');
        
  
        d3.select('#histfilter-button')
            .on('click', function() {
                
                if (vis.selection) {
                    vis.brushed(vis.selection); 
                }
            });
  
       
  
        vis.brushInactive = d3.brushX()
            .extent([[0, 0], [vis.xScaleInactive.range()[1], vis.height]])
            .on('brush', function({selection}) {
                vis.selection = selection; 
  
            })
            .on('end', function({selection}) {  
              if (selection) {
                filterButton.style('display', 'block'); // Show button if there's a selection
              } else {
                filterButton.style('display', 'none'); // Hide if no selection
                vis.selection = null; // Clear selection
              }
            });
  
        
  
      vis.updateVis();
    }
  
    updateVis() {
      let vis = this;
  
      // **Inactive Histogram Binning**
      const binsInactive = d3.bin()
        .domain([0, 50])
        .thresholds(d3.range(0, 51, 5))
        (this.data.map(d => d.percent_inactive));
  
      // Update Y scale for inactive histogram
      vis.yScaleHist.domain([0, d3.max(binsInactive, d => d.length)]);
  
      // **Create Inactive Histogram Bars**
      vis.histogramGroupInactive.selectAll(".bar-inactive")
        .data(binsInactive)
        .join("rect")
        .attr("class", "bar-inactive")
        .attr("x", d => vis.xScaleInactive(`${d.x0}-${d.x1}`))
        .attr("y", d => vis.yScaleHist(d.length))
        .attr("width", vis.xScaleInactive.bandwidth())
        .attr("height", d => vis.height - vis.yScaleHist(d.length))
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
          vis.tooltip.style("display", "block")
            .html(`Percent Inactive: ${d.x0}-${d.x1}%<br>Counties: ${d.length}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", () => vis.tooltip.style("display", "none"));
  
      
  
      // **Update Axes**
      vis.xAxisGroupInactive.call(d3.axisBottom(vis.xScaleInactive));
      vis.yAxisGroupInactive.call(d3.axisLeft(vis.yScaleHist));
   
  
    
      vis.brushG.lower(); 
  
      vis.brushG
        .call(vis.brushInactive)
  
  
      
    }
  
    // Method to update the selected attribute (called from main.js)
    updateAttribute(newAttribute) {
      this.attribute = newAttribute;
      this.updateVis(); // Re-render with the new attribute
    }
  
  
    brushed(selection) {
      let vis = this;
      //const messageContainer4 = document.getElementById('message-container4'); 
      //const messageContainer3 = document.getElementById('message-container3'); 
      //messageContainer2.innerHTML = "INSIDE BRUSHED"; 
      if (selection) {
          // Get pixel coordinates of brush selection
          const [x0,x1] = selection;
          //messageContainer4.innerHTML = selection;
          // Convert pixel coordinates back to data values using the scales
          const selectedBins = vis.xScaleInactive.domain().filter(bin => {
            const bandStart = vis.xScaleInactive(bin);
            const bandEnd = bandStart + vis.xScaleInactive.bandwidth();
            return bandStart >= x0 && bandEnd <= x1;
          });
  
          //messageContainer4.innerHTML = `Selected bins: ${selectedBins.join(', ')}`;
          
          //messageContainer4.innerHTML = "HO";
          //messageContainer3.innerHTML = xDomain1;
  
          lineFilter = vis.data.filter(d => {
            const bin = `${Math.floor(d.percent_inactive / 5) * 5}-${Math.floor(d.percent_inactive / 5) * 5 + 5}`;
            return selectedBins.includes(bin);
        });
  
          const message = lineFilter.length > 0
              ? lineFilter.map(d => `inactive: ${d.percent_inactive}, county: ${d.cnty_fips}`).join('<br>')
              : 'No data selected.';
  
          // Show the filtered data on the webpage
         //messageContainer3.innerHTML = message;
         filterMapData();
         filterData();
  
        
      } else {
         // messageContainer.innerHTML = 'No brush selection.';
      }
    }
  }
  