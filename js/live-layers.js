// Initialize the map
var map = new maplibregl.Map({
    container: 'map', // Specify the ID of the container element
    style: './monarch_style.json', // Define the map style (json)
    center: [-98.64739999268166, 36.26427712144737], // Initial map center [longitude, latitude]
    zoom: 3.6 // Initial zoom level
});

// Dictionary of short term alerts and their colors
const shortTermAlertDict = {
  'Flash Flood Warning': {
    'color': '#BF6F6F'
  },
  'Flash Flood Watch': {
    'color': '#8CBC9F'
  },
  'Severe Thunderstorm Warning': {
    'color': '#FFCC75'
  },
  'Severe Thunderstorm Watch': {
    'color': '#EBADC1'
  },
  'Special Marine Warning': {
    'color': '#FFCC75'
  },
  'Tornado Warning': {
    'color': '#FF6F70'
  },
  'Tornado Watch': {
    'color': '#FFFE78'
  }
}

// This function creates html that is seperately added to the legend
const pushLegend = (features, legendItems) => {
  let legendEvents = []
  // For each feature in the geojson data
  for (let i = 0; i < features.length; i++) {
    // If the name (event) of the feature does not exist in the legendEvents array, add it
    // This creates an array of the unique event names where each name is present only once
    if (!legendEvents.includes(features[i].properties.Event)) {
      legendEvents.push(features[i].properties.Event)
    }
  }
  // Sort alphabetically
  legendEvents.sort()
  // For each event name, create some html and append to a string
  for (let i = 0; i < legendEvents.length; i++) {
    legendItems += `<div><span style="background-color: ${shortTermAlertDict[legendEvents[i]]['color']}"></span>` + legendEvents[i] + '</div>'
  }
  return legendItems
}

// This function fetches a watches/warning/advisories feature from rest
// This is called twice to grab 'severe' and 'extreme' layers
async function getStatementsObj(severityNum) {
  const response = await fetch(`https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NWS_Watches_Warnings_v1/FeatureServer/${severityNum}/query?where=Event%20IN%20(%27Severe%20Thunderstorm%20Watch%27,%20%27Severe%20Thunderstorm%20Warning%27,%20%27Tornado%20Watch%27,%20%27Tornado%20Warning%27,%20%27Flash%20Flood%20Warning%27)&outFields=*&f=geojson`);
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

// This function fetches the datetimes associated with the latest radar frames
// Frames are stored locally with a unique ID (0 through 36)
async function fetchDatetimes() {
  const response = await fetch(`./data/MRMS/BaseRef/radarframes.json`);
  const data = await response.json();
  return data
}

// This function formats a date with the format HH:MM UTC mm, dd, YYYY
let formatDate = (date) => {
  console.log(date)
  if (date) {
    const year = date.slice(0, 4);
    const month = new Date(date.slice(4, 6) + '/01/2000').toLocaleString('default', { month: 'long' });
    const day = date.slice(6,8);
    const hour = date.slice(8,10);
    const minute = date.slice(10);
    return `${hour}:${minute} UTC ${month} ${day}, ${year}`;
  }
  return '';
}

// This function creates an event listener that is triggered on input
// In this instance, when the html element with an ID of 'dateSlider' is changed, the radar image and date are subsequently changed
function regularSliderListener() {
  document.getElementById('dateSlider').addEventListener('input', async function(event) {
    let endDate = event.target.max
    let selectedDate = event.target.value;
    let currentDate = document.getElementById('currentDate');

    map.getSource('image-source').updateImage({ url: `./data/MRMS/BaseRef/${datetimes[36-selectedDate]}.png` });
    currentDate.textContent = formatDate(datetimes[36-selectedDate])
  });
}

// A dictionary containing the datetimes tied to the radar images
const datetimes = await fetchDatetimes();

// When the script is loaded, the html element with id 'currentDate' is given the text of the 0 key pair in the datetimes dictionary - i.e., the most recent radar datetime
document.getElementById("currentDate").innerText = formatDate(datetimes[0])
// When the script is loaded, the slider bar is given a width of 2.778%, which corresponds to 36/100 (36 datetime intervals that collectiviely make up 100% of the datetime range)
document.getElementById("dateSlider").style.setProperty('--sliderSize', '2.7778%');
// When the script is loaded, trigger the event listener for the slider bar
regularSliderListener()

// When the map has fully loaded, the code block below is executed
map.on('load', async function() {
  // Initialize the radar image source
  map.addSource('image-source', {
    'type': 'image',
    'url': `./data/MRMS/BaseRef/${datetimes[0]}.png`, // Initial date
    'coordinates': [
        [-126, 52],
        [-65, 52], // The images are bounded by these coordinates
        [-65, 23],
        [-126, 23]
    ],
  });

  // Add a radar image layer to the map, beneath the buildings base layer
  map.addLayer({
    'id': 'image-layer',
    'type': 'raster',
    'source': 'image-source',
    'paint': {
      'raster-opacity': 1,
      'raster-fade-duration': 0,
      'raster-resampling': "nearest"
    }
  },'building');

  // Below, we loop through the layerNums array, using both 8 and 9
  // These numbers correspond to rest api urls - 8 for the extreme events, 9 for the severe events
  let layerNums = [8, 9]
  let legendItems = '<p class="side-legend-title" id="legend-title-text">Severe Alerts</p><p class="side-legend-subtitle" id="legend-subtitle-text">United States Only</p>'
  for (let i = 0; i < layerNums.length; i++) {
    let layerNum = layerNums[i]

    // Fetch the geojson geometries of the watch/warning/advisory layer
    const geoJsonData = await getStatementsObj(layerNum);

    // Configure legend elements with the geojson data - not pushed to HTML until after looping is complete
    legendItems = pushLegend(geoJsonData.features, legendItems)

    // Add a new source to the map with the geojson geometries
    map.addSource(`statements-data-${layerNum}`, {
      type: 'geojson',
      data: geoJsonData
    });

    // Create a new layer to the map with the source - made unique with the ${layerNum}
    // This is a dark outline layer that helps the watches/warnings/advisories stand out
    map.addLayer({
      'id': `statements-layer-${layerNum}-blur`,
      'type': 'line',
      'source': `statements-data-${layerNum}`,
      'line-join': "bevel",
      'line-cap': "round",
      'paint': {
        'line-color': 'gray',
        'line-width': 4,
        'line-opacity': 1
      }
    });

    // Add another layer with the same source
    // This is a transparent fill layer - the fill can't be seen, but it can be used for click popups (the outline layers do not work well with popups)
    map.addLayer({
      id: `statements-layer-fill-${layerNum}`,
      type: 'fill',
      source: `statements-data-${layerNum}`,
      paint: {
        'fill-opacity': 0
      }
    });

    // Add another layer with the same source
    // This is a colored outline layer the is the primary watch/warning/advisory layer seen on the map
    map.addLayer({
      id: `statements-layer-${layerNum}`,
      type: 'line',
      source: `statements-data-${layerNum}`,
      paint: {
        'line-color': [
          'match',
          ['get', 'Event'],
          'Flash Flood Warning', shortTermAlertDict['Flash Flood Warning']['color'],
          'Flash Flood Watch', shortTermAlertDict['Flash Flood Watch']['color'],
          'Severe Thunderstorm Warning', shortTermAlertDict['Severe Thunderstorm Warning']['color'],
          'Severe Thunderstorm Watch', shortTermAlertDict['Severe Thunderstorm Watch']['color'],
          'Special Marine Warning', shortTermAlertDict['Special Marine Warning']['color'],
          'Tornado Warning', shortTermAlertDict['Tornado Warning']['color'],
          'Tornado Watch', shortTermAlertDict['Tornado Watch']['color'],
          'gray'
        ],
        'line-width': 2
      }
    });

    // Create a new popup for the watch/warning/advisory layer
    var popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false
    });

    // Add a click event listener to the watch/warning/advisory layer that opens the popup
    map.on('click', `statements-layer-fill-${layerNum}`, function (e) {
        // Display the popup at the clicked location
        popup.setLngLat(e.lngLat)
            // Set the html within the popup to display the properties of the watch/warning/advisory layer (event type, areas affected, and event summary)
            .setHTML('<h3>' + e.features[0].properties.Event + '</h3><p><b>Areas Affected</b>: ' + e.features[0].properties.Affected + '</p><p><b>Summary</b>: ' + e.features[0].properties.Summary + '</p><p><b>Last Updated</b>: ' + new Date(e.features[0].properties.Updated) + '</p>')
            .addTo(map);
    });
  }
  // Add the severe alerts to the legend after looping is complete
  document.getElementById('legend-items').innerHTML += legendItems
});
