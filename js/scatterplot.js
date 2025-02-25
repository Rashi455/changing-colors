class ScatterPlot {
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 600,
            containerHeight: _config.containerHeight || 400,
            margin: { top: 20, right: 50, bottom: 50, left: 70 }
        };
  
        this.data = _data;
        this.selectedAttribute = 'percent_coronary_heart_disease'; // Default Y-axis is heart disease
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
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
        // Create SVG element
        vis.svg = d3.select(vis.config.parentElement)
            .attr("width", vis.config.containerWidth)
            .attr("height", vis.config.containerHeight);
  
        vis.chart = vis.svg.append("g")
            .attr("transform", `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);
  
        // Set the X-axis scale based on a percentage range (0-100)
        vis.xScale = d3.scaleLinear()
            .domain([0, 40]) // Percentage range (percent_inactive is always between 0 and 100)
            .range([0, vis.width]);
  
        // Set the Y-axis scale for the default attribute (percent_coronary_heart_disease)
        vis.yScale = d3.scaleLinear()
            .domain([0, Math.max(d3.max(vis.data, d => d.percent_coronary_heart_disease), 20)]) // Default to coronary heart disease data range
            .range([vis.height, 0]);
  
        // Create the axes
        vis.xAxisGroup = vis.chart.append("g")
            .attr("transform", `translate(0,${vis.height})`)
            .attr("class", "x-axis");
  
        vis.yAxisGroup = vis.chart.append("g")
            .attr("class", "y-axis");
  
        // Add axis labels
        vis.chart.append("text")
            .attr("x", vis.width / 2)
            .attr("y", vis.height + 40)
            .attr("text-anchor", "middle")
            .text("Percent Inactive (%)");
  
        // Add the Y-axis label with a specific class to target for updates
        vis.chart.append("text")
            .attr("class", "y-axis-label")  // Add a class for easy selection
            .attr("transform", "rotate(-90)")
            .attr("x", -vis.height / 2)
            .attr("y", -50)
            .attr("text-anchor", "middle")
            .text("Health Attribute (%)"); // Default label text
  
        // Initialize the tooltip
        vis.tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("padding", "5px")
            .style("border", "1px solid black")
            .style("border-radius", "5px")
            .style("display", "none");
  
  
        vis.brushG = vis.chart.append('g')
            .attr('class', 'brush x-brush');
  
        const filterButton = d3.select('#filter-button').style('display', 'none');
  
        d3.select('#filter-button')
            .on('click', function() {
                console.log('Button clicked');
                if (vis.selection) {
                    vis.brushed(vis.selection); 
                }
            });
          
        
        vis.brush = d3.brush()
              .extent([[0, 0], [vis.width, vis.height]])
              .on('brush', function({ selection }) {
                  vis.selection = selection; // Store the selection
              })
              .on('end', function({ selection }) {
                  if (selection) {
                      filterButton.style('display', 'block'); // Show button if there's a selection
                  } else {
                      filterButton.style('display', 'none'); // Hide if no selection
                      vis.selection = null; // Clear selection
                  }
      });
          
        
  
        vis.updateVis(); // Initial rendering
    }
  
    updateVis() {
        let vis = this;
  
        // Dynamically set the Y-axis domain based on the selected attribute
        const maxValue = d3.max(vis.data, d => d[vis.selectedAttribute]);
  
        // Set Y-axis domain depending on the attribute value
        if (this.selectedAttribute === 'percent_stroke') {
            vis.yScale.domain([0, Math.max(maxValue, 10)]);  // Max value should be the actual value, maxed at 10%
        } else {
            vis.yScale.domain([0, Math.max(maxValue, 20)]);  // Adjust the range for other attributes, 20 as an example max range
        }
  
        // Update Y-axis
        vis.yAxisGroup.transition().duration(500).call(d3.axisLeft(vis.yScale));
  
        // Update Y-axis label based on selected attribute
        vis.chart.select(".y-axis-label")
            .text(`${this.selectedAttribute.replace('_', ' ').toUpperCase()} (%)`);
  
        // Bind data to circles and update them
        vis.chart.selectAll(".dot")
            .data(vis.data)
            .join("circle")
            .attr("class", "dot")
            .attr("cx", d => vis.xScale(d.percent_inactive)) // X position based on percent_inactive
            .attr("cy", d => vis.yScale(d[vis.selectedAttribute])) // Y position based on selected attribute
            .attr("r", 3)
            .attr("fill", "steelblue")
            .attr("opacity", 0.7)
            .on("mouseover", (event, d) => {
                vis.tooltip.style("display", "block")
                    .html(`
                        <div class="tooltip-title">${d.display_name}</div>
                        <ul>
                            <li>Percent Inactive: ${d.percent_inactive}</li>
                            <li>${this.selectedAttribute.replace('_', ' ').toUpperCase()}: ${d[this.selectedAttribute]}</li>
                        </ul>
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", () => vis.tooltip.style("display", "none"));
  
        // Update the X-axis
        vis.xAxisGroup.transition().duration(500).call(d3.axisBottom(vis.xScale));
        vis.brushG
              .call(vis.brush)
    }
  
    // Method to update the selected attribute (called from main.js)
    updateAttribute(newAttribute) {
        this.selectedAttribute = newAttribute;
        this.updateVis(); // Re-render with the new attribute
    }
  
  
    brushed(selection) {
      let vis = this;
     
      //messageContainer2.innerHTML = "ok"; 
      if (selection) {
          // Get pixel coordinates of brush selection
          const [[x0, y0], [x1, y1]] = selection;
  
          // Convert pixel coordinates back to data values using the scales
          const xDomain0 = vis.xScale.invert(x0);
          const xDomain1 = vis.xScale.invert(x1);
          const yDomain0 = vis.yScale.invert(y1); // Inverted because pixel 0 is at the top
          const yDomain1 = vis.yScale.invert(y0);
  
          // Filter data points within the selected range
          lineFilter = vis.data.filter(d =>
              d.percent_inactive >= xDomain0 && d.percent_inactive <= xDomain1 &&
              d[vis.selectedAttribute] >= yDomain0 && d[vis.selectedAttribute] <= yDomain1
          );
  
          // Format the selected data for display
          const message = lineFilter.length > 0
              ? lineFilter.map(d => `inactive: ${d.percent_inactive}, Health: ${d[vis.selectedAttribute]}, county: ${d.cnty_fips}`).join('<br>')
              : 'No data selected.';
  
          // Show the filtered data on the webpage
          //messageContainer.innerHTML = message;
          
         // filterMapData();
          filterData();
          filterMapData();
          //messageContainer3.innerHTML = 'um did it even go past';
          
      } else {
      }
  }
  }
  