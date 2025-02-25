// Load the necessary data
let histogram, choroplethMap, choroplethMap2, scatterplot, healthBarChart;
let lineFilter = [];
let geoData;
let countyData;

//const messageContainer5 = document.getElementById('message-container5'); 
function filterData() {
  //messageContainer5.innerHTML = lineFilter.length;

  let filteredData;
  if (lineFilter.length === 0) {
    choroplethMap.setData(geoData); 
    choroplethMap2.setData(geoData); // If no selection, use the full dataset
    scatterplot.setData(countyData);
    histogram.setData(countyData);
    healthBarChart.setData(countyData);
  } else {
    //messageContainer2.innerHTML = "Filtering data..."; // Check if message shows up

    // Debugging: Check what lineFilter contains
    //messageContainer5.innerHTML += "<br>lineFilter: " + JSON.stringify(lineFilter);

    // Attempt filtering with proper matching logic
    

    // Check if filtering was successful
   
    
    histogram.setData(lineFilter);
    scatterplot.setData(lineFilter);
    healthBarChart.setData(lineFilter);
    //scatterplot.setData(lineFilter);


    //messageContainer2.innerHTML = "FILTER GEOMTETRY"

    //choroplethMap.setData(filteredData);
    //choroplethMap2.setData(filteredData);
  }
  //messageContainer2.innerHTML = "exited if statement"
  
  // Update histogram with filtered da
}


//const messageContainer3 = document.getElementById('message-container3'); 


function filterMapData() {

  let filteredGeoData;
  

  if (lineFilter.length === 0) {
    //filteredData = data; // Use full dataset if no selection
  } else {
    filteredGeoData = JSON.parse(JSON.stringify(geoData));
    //messageContainer5.innerHTML += "<br>filtered geo data: " + JSON.stringify(filteredGeoData);

    // Filter geometries by matching FIPS codes from lineFilter
    filteredGeoData.objects.counties.geometries.forEach(d => {
      let match = lineFilter.find(c => String(c.cnty_fips) === String(d.id));
      if (match) {
        // If county is in the filter, merge health data
        d.properties.percent_inactive = +match.percent_inactive;
        d.properties.percent_coronary_heart_disease = +match.percent_coronary_heart_disease;
        d.properties.percent_high_cholesterol = +match.percent_high_cholesterol;
        d.properties.percent_stroke = +match.percent_stroke;
        d.properties.filtered = true;  // Mark it as filtered for coloring
      } else {
        // Otherwise, mark it as not filtered
        d.properties.filtered = false;
      }
    });
  }

  //messageContainer5.innerHTML += "<br>filtered geo data: " + JSON.stringify(filteredGeoData);

  //messageContainer5.innerHTML = selectedAttribute;
  choroplethMap.setData(filteredGeoData);
  choroplethMap2.setData(filteredGeoData);


  //lkfjsldkfjlsdkfj
  
}

d3.select('#reset-button')
          .on('click', function() {
              console.log('Button clicked');
              //messageContainer3.innerHTML = "reset clicked"; 
              lineFilter = [];
              filterData();
          });



Promise.all([
  d3.json('data/topoCounties.json'),  // GeoJSON for map
  d3.csv('data/national_health_data_2024.csv')  // CSV for health attributes
]).then(data => {
  geoData = data[0];  // GeoJSON data
  countyData = data[1];  // CSV data

  // Merge health data with the GeoJSON data based on FIPS code
  geoData.objects.counties.geometries.forEach(d => {
      let match = countyData.find(c => String(c.cnty_fips) === String(d.id));
      if (match) {
          d.properties.percent_inactive = +match.percent_inactive;
          d.properties.percent_coronary_heart_disease = +match.percent_coronary_heart_disease;
          d.properties.percent_high_cholesterol = +match.percent_high_cholesterol;
          d.properties.percent_stroke = +match.percent_stroke;
          d.properties.filtered = true;
      } else{
          d.properties.filtered = false;
      }
  });

  choroplethMap = new ChoroplethMap({ 
    parentElement: '#map',
    containerWidth: 600, // Adjust width of the first map
    containerHeight: 500,
    
  }, geoData, 'percent_inactive', 'Percent Inactive (%)');

  // Default selected attribute
  let selectedAttribute = 'percent_coronary_heart_disease';

  // Initialize the Choroplfeth map
  choroplethMap2 = new ChoroplethMap2({
      parentElement: '#map2',
      containerWidth: 600, // Adjust width of the first map
      containerHeight: 500,
      
  }, geoData, selectedAttribute);

  // Initialize the Scatterplot
  scatterplot = new ScatterPlot({
      parentElement: '#scatterplot',
      containerHeight: 300,
      containerWidth: 600
  }, countyData);

  // Initialize the Histogram
  histogram = new Histogram({
      parentElement: '#histogram',
      containerHeight: 325,//made it have to scroll
      containerWidth: 500
  }, countyData);

  healthBarChart = new HealthBarChart({
    parentElement: '#healthBarChart',
    containerHeight: 325,//made it have to scroll
    containerWidth: 500
}, countyData);

  // Handle dropdown changes
  d3.select("#attribute-select").on("change", function() {
      selectedAttribute = this.value;  // Get selected value

      // Update each visualization with the new selected attribute
      choroplethMap2.updateAttribute(selectedAttribute);
      scatterplot.selectedAttribute = selectedAttribute;
      scatterplot.updateVis();
      healthBarChart.attribute = selectedAttribute;
      healthBarChart.updateVis();
  });
}).catch(error => {
  console.error('Error loading data:', error);
});


