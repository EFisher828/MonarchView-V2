// Initialize the map
var map = new maplibregl.Map({
    container: 'map', // Specify the ID of the container element
    style: './monarch_style.json', // Use your preferred map style
    center: [-98.64739999268166, 36.26427712144737], // Initial map center [longitude, latitude]
    zoom: 3.6 // Initial zoom level
});

// This function returns the most recent model run time - either 00z, 06z, 12z, or 18z
function nearestZTime() {
  // Get the current datetime
  let now = new Date();
  // Get the current hour
  let currentHour = now.getUTCHours();

  // Return a formatted string of the most recent model run time
  if (currentHour <= 0) {
    return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()-1).padStart(2, '0')}18`
  } else if (currentHour > 0 && currentHour <= 6) {
    return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}00`
  } else if (currentHour > 6 && currentHour <= 12) {
    return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}06`
  } else if (currentHour > 12 && currentHour <= 18) {
    return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}12`
  } else {
      return `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}18`
  }
}

// This function generates a list of datetimes based off the most recent model run time
// Essentially, this results in a list like this: ['2024040112', '2024040118', '2024040200', ... , 'beginning datetime + 6 days']
// The count variable is the number of desired datetimes, in this case 24 (24 frames at 6 hours a piece = 144 hours = 6 days)
function generateDatetimes(count) {
  const datetimes = [];
  // Fetch the most recent model run time
  let currentDatetime = nearestZTime();

  // Loop through the values 0 to count (24), adding each datetime to the datetimes list
  for (let i = 0; i < count; i++) {
    datetimes.push(currentDatetime);
    currentDatetime = incrementZTime(currentDatetime);
  }

  // Return the datetimes list
  return datetimes;
}

// This function increments a datetime by +6 hours - thank you ChatGPT
function incrementZTime(datetime) {
    // Convert the datetime string to a Date object
    let year = parseInt(datetime.slice(0, 4));
    let month = parseInt(datetime.slice(4, 6)) - 1; // Month is zero-based
    let day = parseInt(datetime.slice(6, 8));
    let hour = parseInt(datetime.slice(8, 10));

    // Increment the hour by 6
    hour += 6;
    if (hour >= 24) {
        hour -= 24;
        // Increment the day by 1
        let date = new Date(year, month, day);
        date.setDate(date.getDate() + 1);
        year = date.getFullYear();
        month = date.getMonth()
        day = date.getDate();
    }

    // Convert the new datetime to the desired format
    let formattedMonth = String(month+1).padStart(2, '0');
    let formattedDay = String(day).padStart(2, '0');
    let formattedHour = String(hour).padStart(2, '0');

    // Return a formatted string of the incremented datetime
    return `${year}${formattedMonth}${formattedDay}${formattedHour}`;
}

// A dictionary containing the datetimes - 4 per day & 6 days
const datetimes = generateDatetimes(24);

// Define the initial variable to be ptype_frames (needs to be changed to precip6hr_frames)
let varshort = 'ptype_frames'

// When the script is loaded, the html element with id 'currentDate' is given the text of the 0 key pair in the datetimes dictionary - i.e., the first model frame
document.getElementById("currentDate").innerText = formatDate(datetimes[0])
// When the script is loaded, the slider bar is given a width of 4.16667%, which corresponds to 24/100 (24 datetime intervals that collectiviely make up 100% of the datetime range)
document.getElementById("dateSlider").style.setProperty('--sliderSize', '4.16667%');

// This function fetches a variable layer that is filtered to one datetime
// This drastically reduces our load time - only loading one 6-hour period at a time
// The varShort variable should probably be passed into this... Reevaluate !!!!!
async function getFrameObj(date) {
  const year = date.slice(0, 4);
  const month = date.slice(4,6);
  const day = date.slice(6,8);
  const hour = date.slice(8);

  const response = await fetch(`https://monarchweatherenterprise.com/server/rest/services/Hosted/${varshort}/FeatureServer/0/query?where=dates%3D'${year}-${month}-${day}%20${hour}%3A00'&outFields=levels,dates&f=geojson`);
  const data = await response.json();

  // Parse the JSON object to extract the features
  const features = data.features;

  // Create a GeoJSON object
  const geoJsonData = {
      type: 'FeatureCollection',
      features: features
  };

  return geoJsonData;
}

// This function formats a date with the format HH:MM UTC mm, dd, YYYY
function formatDate(date) {
  if (date) {
    const year = date.slice(0, 4);
    const month = new Date(date.slice(4, 6) + '/01/2000').toLocaleString('default', { month: 'long' });
    const day = date.slice(6,8);
    const hour = date.slice(8);
    return `${hour}:00 UTC ${month} ${day}, ${year}`;
  }
  return '';
}

// This function creates two event listeners that are triggered by the time slider
// In this instance, when the html element with an ID of 'dateSlider' is changed, a new model layer is fetched and the date is subsequently changed
function regularSliderListener() {
  // This event listener is triggered as the user slides the time bar
  // This ensures that the user can see the time change as they drag the bar
  document.getElementById('dateSlider').addEventListener('input', function(event) {
    let endDate = event.target.max;
    let selectedDate = event.target.value;
    let currentDate = document.getElementById('currentDate');
    currentDate.textContent = formatDate(datetimes[selectedDate])
    // This conditional makes the time slider 'accumulate' as it is dragged - perfect for precipitation accumulation layers (only snow currently)
    if (varshort == 'asnow_frames') {
      let sliderThumb = document.getElementById('sliderRange');
      sliderThumb.style.width = `${(selectedDate/26*100)+0.5}%`
    }
  });

  // This event listener is only triggered when a user stops sliding the time bar
  // This ensures that the page does not attempt to load several layers at once
  document.getElementById('dateSlider').addEventListener('change', async function(event) {
    let endDate = event.target.max
    let selectedDate = event.target.value;
    let currentDate = document.getElementById('currentDate');

    const geoJsonData = await getFrameObj(datetimes[selectedDate]);

    map.getSource('custom-data').setData(geoJsonData);
    currentDate.textContent = formatDate(datetimes[selectedDate])
  });
}

// Define the popup variable with global scope
let popup;

// This function creates a popup with a layer ID, title, and variable - work in progress
const createPopup = (layerID, popupTitle, popupVar) => {
  // This function actually sets the popup in place
  let popupClick = (e) => {
    // Display the popup at the clicked location
    popup.setLngLat(e.lngLat)
      .setHTML(`<h3>${popupTitle}</h3><p><b>Valid</b>: ${e.features[0].properties.dates} UTC</p><p><b>Value</b>: ${popupVar[e.features[0].properties.levels]['label']}</p>`)
      .addTo(map)
  }

  // Attempt to remove the existing popup - may or may not be working
  if (typeof popup !== 'undefined') {
    popup.remove()
  }

  // Creating a new popup object
  popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false
  });

  // Attempt to disable the existing click event
  map.off('click', layerID, popupClick); // This won't work unless popupTitle and popupVar are the same, I think - testing...
  map.on('click', layerID, popupClick); // Enable a new click event
};

// This function adds a blank variable layer to the map
async function addCustomLayer() {
  map.getSource('custom-data').setData({
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: []
    }
  });

  // Add a new blank layer to the map beneath the hillshade
  // This function is always followed by another function that adds data back into the source
  // Probably inefficient, but works for now
  // Covers the instance where user clicks to SPC/WPC layer and then back to normal model layer
  map.addLayer({
    id: 'custom-data-layer',
    type: 'fill',
    source: 'custom-data',
    paint: {
      'fill-color': 'rgba(1,1,1,0)'
    }
  },'terrain');

}

// When the map has fully loaded, the code block below is executed
map.on('load', async function() {

  // Fetch geojson data - assumes default varString 'ptype_frames' - reevaluate !!!!!
  const geoJsonData = await getFrameObj(datetimes[0]);

  // Add a new data source using the geojson data
  map.addSource('custom-data', {
    type: 'geojson',
    data: geoJsonData
  });

  // Add a new layer to the map beneath hillshade using the source
  map.addLayer({
    id: 'custom-data-layer',
    type: 'fill',
    source: 'custom-data',
    paint: {
      'fill-color': [
        'match',
        ['get', 'levels'], // Property to match against (i.e., color using the 'levels' property)
        0, '#C8F7EE', // Each value of 'levels' is styled with a color
        1, '#BDE8DA',
        2, '#9AD0AC',
        3, '#73B77B',
        4, '#619655',
        5, '#FAF17F',
        6, '#FAD880',
        7, '#FAB864',
        8, '#FB8866',
        9, '#E26656',
        10, '#BC5341',
        11, '#FDCAD7',
        12, '#FE94D6',
        13, '#E965C7',
        14, '#C44EC6',
        15, '#A04AA1',
        16, '#754993',
        'grey' // Catches any exceptions and fills with grey
      ],
      'fill-opacity': 1
    }
  },'terrain');

  // Call the createPopup function and, well, create a popup
  createPopup('custom-data-layer', '6-Hour Total Precipitation', precip6Hr_legend)

  // Add the regular time slider event listener that changes the layers on input
  regularSliderListener()
});

// Add an event listener to the html element with id 'ptype'
// This is the button for the 'Precipitation Intensity' variable
// You'll see a lot of repeated code coming up - needs simplifying
document.getElementById("ptype").addEventListener('click', async function() {
  // Set varshort to 'ptype_frames'
  // This is default, but also covers instance where user clicks to another layer and then back to ptype
  varshort = "ptype_frames"
  // Create the ptype legend by calling the dictToLegend function
  dictToLegend(precip6Hr_legend, '6-Hour Total Precipitation', 'Inches')
  // I honestly can't remember why I added the next three lines - something to do with needing to refresh the time slider
  const originalElement = document.getElementById('dateSlider');
  const clonedElement = originalElement.cloneNode(true);
  originalElement.parentNode.replaceChild(clonedElement, originalElement);
  // Call the createPopup function and, well, create a popup
  createPopup('custom-data-layer', '6-Hour Total Precipitation', precip6Hr_legend)
  // Add the regular time slider event listener that changes the layers on input
  // This is default, but also covers the instance where user clicks to SPC/WPC layer and then back to normal model layer
  regularSliderListener()
  // When the script is loaded, the slider bar is given a width of 4.16667%, which corresponds to 24/100 (24 datetime intervals that collectiviely make up 100% of the datetime range)
  // This is default, but also covers the instance where user clicks to SPC/WPC layer and then back to normal model layer
  document.getElementById("dateSlider").style.setProperty('--sliderSize', '4%');

  // If the map layer doesn't already exist, add it
  // Covers instance where user clicks to SPC/WPC layer and then back to normal model layer
  if (!map.getLayer('custom-data-layer')) {
    addCustomLayer()
  }

  // If the previous layer was a spc/wpc layer, need to reformat the time slider and remove the outlook layer
  if (map.getLayer('spc-outlook-layer')) {
    map.removeLayer('spc-outlook-layer')
    let sliderDiv = document.getElementById('dateSlider')
    sliderDiv.max = 24
    sliderDiv.value = 0
    let currentDate = document.getElementById('currentDate');
    currentDate.textContent = formatDate(datetimes[0])
  }

  if (map.getLayer('wpc-outlook-layer')) {
    map.removeLayer('wpc-outlook-layer')
    let sliderDiv = document.getElementById('dateSlider')
    sliderDiv.max = 24
    sliderDiv.value = 0
    let currentDate = document.getElementById('currentDate');
    currentDate.textContent = formatDate(datetimes[0])
  }

  // Update the slider div with the correct datetime
  let sliderDiv = document.getElementById("dateSlider")
  let endDate = sliderDiv.max
  let selectedDate = sliderDiv.value;
  let currentDate = document.getElementById('currentDate');
  const geoJsonData = await getFrameObj(datetimes[selectedDate]);

  // Update the map layer to the correct timestamp - overwrites blank geometries created by addCustomLayer()
  map.getSource('custom-data').setData(geoJsonData);

  // Update the paint property of the layer to match ptype
  map.setPaintProperty('custom-data-layer', 'fill-color', [
        'match',
        ['get', 'levels'],
        0, '#C8F7EE',
        1, '#BDE8DA',
        2, '#9AD0AC',
        3, '#73B77B',
        4, '#619655',
        5, '#FAF17F',
        6, '#FAD880',
        7, '#FAB864',
        8, '#FB8866',
        9, '#E26656',
        10, '#BC5341',
        11, '#FDCAD7',
        12, '#FE94D6',
        13, '#E965C7',
        14, '#C44EC6',
        15, '#A04AA1',
        16, '#754993',
        'gray'
    ]);

    // Ensure that the slider is not enabled for 'accumulation'
    let sliderThumb = document.getElementById('sliderRange');
    sliderThumb.style.width = `0%`
})

// The rest of the code is pretty redundant so I'll stop comments here
document.getElementById("asnow").addEventListener('click', async function() {
  varshort = "asnow_frames"
  dictToLegend(snowAccu_legend, 'Total Snowfall', 'Dynamic SLR, Inches')
  const originalElement = document.getElementById('dateSlider');
  const clonedElement = originalElement.cloneNode(true);
  originalElement.parentNode.replaceChild(clonedElement, originalElement);
  createPopup('custom-data-layer', 'Total Snowfall', snowAccu_legend)
  regularSliderListener()
  document.getElementById("dateSlider").style.setProperty('--sliderSize', '4%');

  if (map.getLayer('custom-data-layer')) {
    console.log('Layer already exists')
  } else{
    addCustomLayer()
  }

  if (map.getLayer('spc-outlook-layer')) {
    map.removeLayer('spc-outlook-layer')
    let sliderDivID = document.getElementById('dateSlider')
    sliderDivID.max = 24
    sliderDivID.value = 0
    let currentDate = document.getElementById('currentDate');
    currentDate.textContent = formatDate(datetimes[0])
  }

  let sliderDivID = document.getElementById("dateSlider")
  let endDate = sliderDivID.max
  let selectedDate = sliderDivID.value;
  let currentDate = document.getElementById('currentDate');
  const geoJsonData = await getFrameObj(datetimes[selectedDate]);

  map.getSource('custom-data').setData(geoJsonData);

  map.setPaintProperty('custom-data-layer', 'fill-color', [
        'match',
        ['get', 'levels'], // Property to match against
        0, '#E3E3E3', // Unique colors for each level
        1, '#C2C2C2',
        2, '#A0DDED',
        3, '#8BC4E6',
        4, '#719DD2',
        5, '#5A83C9',
        6, '#5562B4',
        7, '#A482E5',
        8, '#CC9EEC',
        9, '#E5BEEC',
        10, '#EF9FB9',
        11, '#EF88A6',
        12, '#DA7298',
        13, '#A87C97',
        14, '#908797',
        15, '#6C7C97',
        16, '#6299B1',
        'gray' // Default color
    ]);

    let sliderThumb = document.getElementById('sliderRange');
    sliderThumb.style.width = `${(selectedDate/26*100)+0.5}%`
})

document.getElementById("temp2m").addEventListener('click', async function() {
  varshort = "temp2m_frames"
  dictToLegend(temp2m_legend, 'Surface Temperature', '2m AGL, °F')
  const originalElement = document.getElementById('dateSlider');
  const clonedElement = originalElement.cloneNode(true);
  originalElement.parentNode.replaceChild(clonedElement, originalElement);
  createPopup('custom-data-layer', 'Surface Temperature', temp2m_legend)
  regularSliderListener()
  document.getElementById("dateSlider").style.setProperty('--sliderSize', '4%');

  if (map.getLayer('custom-data-layer')) {
    console.log('Layer already exists')
  } else{
    addCustomLayer()
  }

  if (map.getLayer('spc-outlook-layer')) {
    map.removeLayer('spc-outlook-layer')
    let sliderDivID = document.getElementById('dateSlider')
    sliderDivID.max = 24
    sliderDivID.value = 0
    let currentDate = document.getElementById('currentDate');
    currentDate.textContent = formatDate(datetimes[0])
  }

  let sliderDivID = document.getElementById("dateSlider")
  let endDate = sliderDivID.max
  let selectedDate = sliderDivID.value;
  let currentDate = document.getElementById('currentDate');
  const geoJsonData = await getFrameObj(datetimes[selectedDate]);

  map.getSource('custom-data').setData(geoJsonData);

  map.setPaintProperty('custom-data-layer', 'fill-color', [
        'match',
        ['get', 'levels'], // Property to match against
        0, '#73CFD8', // Unique colors for each level
        1, '#A6CAE3',
        2, '#C4C2E3',
        3, '#E3B3E4',
        4, '#E096E7',
        5, '#BD83E7',
        6, '#9975E7',
        7, '#7B7BE7',
        8, '#6F95F5',
        9, '#7CB5EC',
        10, '#8DC8EB',
        11, '#8FD8E6',
        12, '#8FE6D1',
        13, '#89D5B3',
        14, '#6FC992',
        15, '#84B076',
        16, '#B3B077',
        17, '#DDCA83',
        18, '#F6EA8A',
        19, '#F6D88D',
        20, '#F7C58D',
        21, '#F7AD70',
        22, '#F78F71',
        23, '#EE716D',
        24, '#D371A3',
        25, '#F77EBE',
        26, '#FF9AC5',
        27, '#FFB6C5',
        28, '#D7B6B3',
        29, '#C0C5B2',
        30, '#B2D4B1',
        31, '#A1C392',
        'gray' // Default color
    ]);

    let sliderThumb = document.getElementById('sliderRange');
    sliderThumb.style.width = `0%`
})

export { map };
