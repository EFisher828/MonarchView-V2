// Initialize the map
var map = new maplibregl.Map({
    container: 'map', // Specify the ID of the container element
    style: './monarch_style.json', // Use your preferred map style
    center: [-98.64739999268166, 38.06427712144737], // Initial map center [longitude, latitude]
    zoom: 3.8 // Initial zoom level
});

// This function creates html adds it to the legend
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
    console.log(alertDict[legendEvents[i]])
    legendItems += `<div><span style="background-color: ${alertDict[legendEvents[i]]['color']}"></span>` + legendEvents[i] + '</div>'
  }
  document.getElementById('legend-items').innerHTML = legendItems
  return legendItems
}

// This function fetches a watches/warning/advisories feature from rest
// This is called twice to grab 'severe' and 'extreme' layers
async function getStatementsObj(severityNum) {
  const response = await fetch(`https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NWS_Watches_Warnings_v1/FeatureServer/${severityNum}/query?where=1=1&outFields=*&f=geojson`);
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

// Dictionary of all possible alerts and their colors
const alertDict = {
  'Avalanche Advisory': {
    'color': '#E3B890'
  },
  'Avalanche Warning': {
    'color': '#89BFFD'
  },
  'Avalanche Watch': {
    'color': '#F8CAA3'
  },
  'Blizzard Warning': {
    'color': '#FF9472'
  },
  'Blizzard Watch': {
    'color': '#D1FE77'
  },
  'Coastal Flood Advisory': {
    'color': '#B6FD77'
  },
  'Coastal Flood Statement': {
    'color': '#ABBE7C'
  },
  'Coastal Flood Warning': {
    'color': '#87BC7E'
  },
  'Coastal Flood Watch': {
    'color': '#A9E2CE'
  },
  'Dense Fog Advisory': {
    'color': '#ADB6C0'
  },
  'Dust Storm Warning': {
    'color': '#FFE4C4'
  },
  'Earthquake Warning': {
    'color': '#BE9474'
  },
  'Excessive Heat Warning': {
    'color': '#E178B9'
  },
  'Excessive Heat Watch': {
    'color': '#B86F6F'
  },
  'Extreme Cold Warning': {
    'color': '#7C76FB'
  },
  'Extreme Cold Watch': {
    'color': '#7C76FB'
  },
  'Extreme Fire Danger': {
    'color': '#F3C2B2'
  },
  'Extreme Wind Warning': {
    'color': '#FFBD74'
  },
  'Fire Warning': {
    'color': '#CA9B86'
  },
  'Fire Weather Watch': {
    'color': '#FFECCF'
  },
  'Flash Flood Warning': {
    'color': '#BF6F6F'
  },
  'Flash Flood Watch': {
    'color': '#8CBC9F'
  },
  'Flood Advisory': {
    'color': '#8FFEB5'
  },
  'Flood Statement': {
    'color': '#8FFE76'
  },
  'Flood Warning': {
    'color': '#6DFE6D'
  },
  'Flood Watch': {
    'color': '#8CBC9F'
  },
  'Freeze Warning': {
    'color': '#9691BD'
  },
  'Freeze Watch': {
    'color': '#90FFFE'
  },
  'Freezing Fog Advisory': {
    'color': '#7DB6B7'
  },
  'Freezing Rain Advisory': {
    'color': '#EAADE7'
  },
  'Freezing Spray Advisory': {
    'color': '#89DBFD'
  },
  'Frost Advisory': {
    'color': '#A7C3F4'
  },
  'Hard Freeze Warning': {
    'color': '#C471E4'
  },
  'Hard Freeze Watch': {
    'color': '#95AAED'
  },
  'Heat Advisory': {
    'color': '#FFB69A'
  },
  'Heavy Freezing Spray Warning': {
    'color': '#89DBFD'
  },
  'Heavy Freezing Spray Watch': {
    'color': '#D8BFBF'
  },
  'High Wind Warning': {
    'color': '#EACB74'
  },
  'High Wind Watch': {
    'color': '#D6B973'
  },
  'Hurricane Force Wind Warning': {
    'color': '#E3A1A2'
  },
  'Hurricane Force Wind Watch': {
    'color': '#C68AE1'
  },
  'Hurricane Warning': {
    'color': '#ED758F'
  },
  'Hurricane Watch': {
    'color': '#FF6EFC'
  },
  'Ice Storm Warning': {
    'color': '#BF6EBC'
  },
  'Lake Effect Snow Advisory': {
    'color': '#9CE4E2'
  },
  'Lake Effect Snow Warning': {
    'color': '#7FBCBD'
  },
  'Lake Effect Snow Watch': {
    'color': '#BBE3FC'
  },
  'Lakeshore Flood Advisory': {
    'color': '#B6FD77'
  },
  'Lakeshore Flood Statement': {
    'color': '#ABBE7C'
  },
  'Lakeshore Flood Warning': {
    'color': '#87BC7E'
  },
  'Lakeshore Flood Watch': {
    'color': '#A9E2CE'
  },
  'Red Flag Warning': {
    'color': '#FF75C1'
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
  'Storm Warning': {
    'color': '#C471E4'
  },
  'Storm Watch': {
    'color': '#FFEFD4'
  },
  'Tornado Warning': {
    'color': '#FF6F70'
  },
  'Tornado Watch': {
    'color': '#FFFE78'
  },
  'Tropical Storm Warning': {
    'color': '#D4807F'
  },
  'Tropical Storm Watch': {
    'color': '#F6B6B6'
  },
  'Tsunami Advisory': {
    'color': '#E6AA77'
  },
  'Tsunami Warning': {
    'color': '#FFA694'
  },
  'Tsunami Watch': {
    'color': '#FF6EFC'
  },
  'Typhoon Local Statement': {
    'color': '#FFEFD4'
  },
  'Typhoon Warning': {
    'color': '#ED758F'
  },
  'Typhoon Watch': {
    'color': '#FF6EFC'
  },
  'Wind Advisory': {
    'color': '#E5D4BD'
  },
  'Wind Chill Advisory': {
    'color': '#D1F5F5'
  },
  'Wind Chill Warning': {
    'color': '#D2DDEB'
  },
  'Wind Chill Watch': {
    'color': '#A4C7C9'
  },
  'Winter Storm Warning': {
    'color': '#FFA9D3'
  },
  'Winter Storm Watch': {
    'color': '#97B8D4'
  },
  'Winter Weather Advisory': {
    'color': '#B4A9F4'
  }
}

// When the map has fully loaded, the code block below is executed
map.on('load', async function() {
  // Below, we loop through the layerNums array, using both 8 and 9
  // These numbers correspond to rest api urls - 8 for the extreme events, 9 for the severe events
  let layerNums = [8, 9]
  let legendItems = ''
  for (let i = 0; i < layerNums.length; i++) {
    let layerNum = layerNums[i]

    // Fetch the geojson geometries of the watch/warning/advisory layer
    const geoJsonData = await getStatementsObj(layerNum);

    // Configure legend elements with the geojson data
    legendItems = pushLegend(geoJsonData.features, legendItems)

    // Add the GeoJSON data as a new layer to the map
    map.addSource(`statements-data-${layerNum}`, {
      type: 'geojson',
      data: geoJsonData
    });

    // Add a new layer to the map
    map.addLayer({
      id: `statements-layer-${layerNum}`,
      type: 'fill',
      source: `statements-data-${layerNum}`,
      paint: {
        'fill-color': [
          'match',
          ['get', 'Event'],
          'Avalanche Advisory', alertDict['Avalanche Advisory']['color'],
          'Avalanche Warning', alertDict['Avalanche Warning']['color'],
          'Avalanche Watch', alertDict['Avalanche Watch']['color'],
          'Blizzard Warning', alertDict['Blizzard Warning']['color'],
          'Blizzard Watch', alertDict['Blizzard Watch']['color'],
          'Coastal Flood Advisory', alertDict['Coastal Flood Advisory']['color'],
          'Coastal Flood Statement', alertDict['Coastal Flood Statement']['color'],
          'Coastal Flood Warning', alertDict['Coastal Flood Warning']['color'],
          'Coastal Flood Watch', alertDict['Coastal Flood Watch']['color'],
          'Dense Fog Advisory', alertDict['Dense Fog Advisory']['color'],
          'Dust Storm Warning', alertDict['Dust Storm Warning']['color'],
          'Earthquake Warning', alertDict['Earthquake Warning']['color'],
          'Excessive Heat Warning', alertDict['Excessive Heat Warning']['color'],
          'Excessive Heat Watch', alertDict['Excessive Heat Watch']['color'],
          'Extreme Cold Warning', alertDict['Extreme Cold Warning']['color'],
          'Extreme Cold Watch', alertDict['Extreme Cold Watch']['color'],
          'Extreme Fire Danger', alertDict['Extreme Fire Danger']['color'],
          'Extreme Wind Warning', alertDict['Extreme Wind Warning']['color'],
          'Fire Warning', alertDict['Fire Warning']['color'],
          'Fire Weather Watch', alertDict['Fire Weather Watch']['color'],
          'Flash Flood Warning', alertDict['Flash Flood Warning']['color'],
          'Flash Flood Watch', alertDict['Flash Flood Watch']['color'],
          'Flood Advisory', alertDict['Flood Advisory']['color'],
          'Flood Statement', alertDict['Flood Statement']['color'],
          'Flood Warning', alertDict['Flood Warning']['color'],
          'Flood Watch', alertDict['Flood Watch']['color'],
          'Freeze Warning', alertDict['Freeze Warning']['color'],
          'Freeze Watch', alertDict['Freeze Watch']['color'],
          'Freezing Fog Advisory', alertDict['Freezing Fog Advisory']['color'],
          'Freezing Rain Advisory', alertDict['Freezing Rain Advisory']['color'],
          'Freezing Spray Advisory', alertDict['Freezing Spray Advisory']['color'],
          'Frost Advisory', alertDict['Frost Advisory']['color'],
          'Hard Freeze Warning', alertDict['Hard Freeze Warning']['color'],
          'Hard Freeze Watch', alertDict['Hard Freeze Watch']['color'],
          'Heat Advisory', alertDict['Heat Advisory']['color'],
          'Heavy Freezing Spray Warning', alertDict['Heavy Freezing Spray Warning']['color'],
          'Heavy Freezing Spray Watch', alertDict['Heavy Freezing Spray Watch']['color'],
          'High Wind Warning', alertDict['High Wind Warning']['color'],
          'High Wind Watch', alertDict['High Wind Watch']['color'],
          'Hurricane Force Wind Warning', alertDict['Hurricane Force Wind Warning']['color'],
          'Hurricane Force Wind Watch', alertDict['Hurricane Force Wind Watch']['color'],
          'Hurricane Warning', alertDict['Hurricane Warning']['color'],
          'Hurricane Watch', alertDict['Hurricane Watch']['color'],
          'Ice Storm Warning', alertDict['Ice Storm Warning']['color'],
          'Lake Effect Snow Advisory', alertDict['Lake Effect Snow Advisory']['color'],
          'Lake Effect Snow Warning', alertDict['Lake Effect Snow Warning']['color'],
          'Lake Effect Snow Watch', alertDict['Lake Effect Snow Watch']['color'],
          'Lakeshore Flood Advisory', alertDict['Lakeshore Flood Advisory']['color'],
          'Lakeshore Flood Statement', alertDict['Lakeshore Flood Statement']['color'],
          'Lakeshore Flood Warning', alertDict['Lakeshore Flood Warning']['color'],
          'Lakeshore Flood Watch', alertDict['Lakeshore Flood Watch']['color'],
          'Red Flag Warning', alertDict['Red Flag Warning']['color'],
          'Severe Thunderstorm Warning', alertDict['Severe Thunderstorm Warning']['color'],
          'Severe Thunderstorm Watch', alertDict['Severe Thunderstorm Watch']['color'],
          'Special Marine Warning', alertDict['Special Marine Warning']['color'],
          'Storm Warning', alertDict['Storm Warning']['color'],
          'Storm Watch', alertDict['Storm Watch']['color'],
          'Tornado Warning', alertDict['Tornado Warning']['color'],
          'Tornado Watch', alertDict['Tornado Watch']['color'],
          'Tropical Storm Warning', alertDict['Tropical Storm Warning']['color'],
          'Tropical Storm Watch', alertDict['Tropical Storm Watch']['color'],
          'Tsunami Advisory', alertDict['Tsunami Advisory']['color'],
          'Tsunami Warning', alertDict['Tsunami Warning']['color'],
          'Tsunami Watch', alertDict['Tsunami Watch']['color'],
          'Typhoon Local Statement', alertDict['Typhoon Local Statement']['color'],
          'Typhoon Warning', alertDict['Typhoon Warning']['color'],
          'Typhoon Watch', alertDict['Typhoon Watch']['color'],
          'Wind Advisory', alertDict['Wind Advisory']['color'],
          'Wind Chill Advisory', alertDict['Wind Chill Advisory']['color'],
          'Wind Chill Warning', alertDict['Wind Chill Warning']['color'],
          'Wind Chill Watch', alertDict['Wind Chill Watch']['color'],
          'Winter Storm Warning', alertDict['Winter Storm Warning']['color'],
          'Winter Storm Watch', alertDict['Winter Storm Watch']['color'],
          'Winter Weather Advisory', alertDict['Winter Weather Advisory']['color'],
          'gray'
        ],
        'fill-opacity': 1
      }
    },'terrain');

    // Create a new popup for the watch/warning/advisory layer
    var popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: false
    });

    // Add a click event listener to the watch/warning/advisory layer that opens the popup
    map.on('click', `statements-layer-${layerNum}`, function (e) {
        // Display the popup at the clicked location
        popup.setLngLat(e.lngLat)
            // Set the html within the popup to display the properties of the watch/warning/advisory layer (event type, areas affected, and event summary)
            .setHTML('<h3>' + e.features[0].properties.Event + '</h3><p><b>Areas Affected</b>: ' + e.features[0].properties.Affected + '</p><p><b>Summary</b>: ' + e.features[0].properties.Summary + '</p><p><b>Last Updated</b>: ' + new Date(e.features[0].properties.Updated) + '</p>')
            .addTo(map);
    });
  }
});
