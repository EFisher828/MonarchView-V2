import { map } from './forecast-model-layers.js';

// Similar code has already been commented in forest-model-layers.js

document.getElementById("layersdiv").activevar = 'spcstorm'

document.getElementById("layersicon").addEventListener('click', function() {
  if (document.getElementById("layersdiv").style.display == "block") {
    document.getElementById("layersdiv").style.display = "none"
  } else {
    document.getElementById("layersdiv").style.display = "block"
  }
});

const checkboxes = document.querySelectorAll('.tgl');

checkboxes.forEach(checkbox => {
  checkbox.addEventListener('click', () => {
    let sliderDiv = document.getElementById('dateSlider')
    let endDate = sliderDiv.max
    let selectedDate = sliderDiv.value;
    checkboxes.forEach(async cb => {
      if (cb !== checkbox) {
        cb.checked = false;
      } else {
        document.getElementById("layersdiv").activevar = cb.id
        if (cb.id == 'spcstorm') {
          const geoJsonData = await getSPCOutlookObj(selectedDate, "storm");
          map.getSource('spc-outlook').setData(geoJsonData);
          map.setPaintProperty('spc-outlook-layer', 'fill-color', [
                'match',
                ['get', 'dn'],
                2, '#C1E9C1',
                3, '#66A366',
                4, '#F6F67F',
                5, '#E6C27F',
                6, '#E67F7F',
                7, '#FF7FFC',
                'gray'
            ]);
        } else if (cb.id == 'spctor') {
          const geoJsonData = await getSPCOutlookObj(selectedDate, "tor");
          map.getSource('spc-outlook').setData(geoJsonData);
          map.setPaintProperty('spc-outlook-layer', 'fill-color', [
                'match',
                ['get', 'dn'],
                2, '#81C580',
                5, '#C5A393',
                10, '#FFEB80',
                15, '#FF0F17',
                30, '#FF00FC',
                45, '#912CEE',
                60, '#114E8B',
                'gray'
            ]);
        } else if (cb.id == 'spchail') {
          const geoJsonData = await getSPCOutlookObj(selectedDate, "hail");
          map.getSource('spc-outlook').setData(geoJsonData);
          map.setPaintProperty('spc-outlook-layer', 'fill-color', [
                'match',
                ['get', 'dn'],
                5, '#C5A393',
                10, 'rgba(1,1,1,0)',
                15, '#FFEB80',
                30, '#FF8080',
                45, '#FF80FC',
                60, '#912CEE',
                'gray'
            ]);
        } else if (cb.id == 'spcwind') {
          const geoJsonData = await getSPCOutlookObj(selectedDate, "wind");
          map.getSource('spc-outlook').setData(geoJsonData);
          map.setPaintProperty('spc-outlook-layer', 'fill-color', [
                'match',
                ['get', 'dn'],
                5, '#C5A393',
                10, 'rgba(1,1,1,0)',
                15, '#FFEB80',
                30, '#FF8080',
                45, '#FF80FC',
                60, '#912CEE',
                'gray'
            ]);
        }
      }
    });
  });
});

const generateDateStrings = (count) => {
  const today = new Date();
  const dates = [];

  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dates.push(`${year}${month}${day}`);
  }

  return dates;
}

const datetimes_spc_wpc = generateDateStrings(3);

function formatDay(date, selectedDate) {
  console.log(selectedDate)
  if (date) {
    const year = date.slice(0, 4);
    const month = new Date(date.slice(4, 6) + '/01/2000').toLocaleString('default', { month: 'long' });
    const day = date.slice(6);
    return `Day ${Number(selectedDate)+1} - ${month} ${day}, ${year}`;
  }
  return '';
}

async function getSPCOutlookObj(index) {
  let varString = document.getElementById("layersdiv").activevar
  console.log(varString)
  let url;
  if (varString == 'spcstorm') {
    url = `https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/SPC_wx_outlks/MapServer/${Number(index*8+1)}/query?where=1=1&outFields=*&f=geojson`
  } else if (varString == 'spctor') {
    url = `https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/SPC_wx_outlks/MapServer/${Number(index*8+3)}/query?where=1=1&outFields=*&f=geojson`
  } else if (varString == 'spchail') {
    url = `https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/SPC_wx_outlks/MapServer/${Number(index*8+5)}/query?where=1=1&outFields=*&f=geojson`
  } else if (varString == 'spcwind') {
    url = `https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/SPC_wx_outlks/MapServer/${Number(index*8+7)}/query?where=1=1&outFields=*&f=geojson`
  }
  const response = await fetch(url);
  const data = await response.json();

  // Parse the JSON object to extract the features
  const features = data.features;

  console.log(features)

  // Create a GeoJSON object
  const geoJsonData = {
      type: 'FeatureCollection',
      features: features
  };

  return geoJsonData;
}

function spcSliderListener() {
  const originalElement = document.getElementById('dateSlider');
  const clonedElement = originalElement.cloneNode(true);
  originalElement.parentNode.replaceChild(clonedElement, originalElement);

  document.getElementById('dateSlider').addEventListener('input', function(event) {
    let endDate = event.target.max;
    let selectedDate = event.target.value;
    let currentDate = document.getElementById('currentDate');
    currentDate.textContent = formatDay(datetimes_spc_wpc[selectedDate], selectedDate)
  });

  document.getElementById('dateSlider').addEventListener('change', async function(event) {
    let endDate = event.target.max
    let selectedDate = event.target.value;
    let currentDate = document.getElementById('currentDate');

    const geoJsonData = await getSPCOutlookObj(selectedDate);

    map.getSource('spc-outlook').setData(geoJsonData);
    currentDate.textContent = formatDay(datetimes_spc_wpc[selectedDate], selectedDate)
  });
}

function wpcSliderListener() {
  const originalElement = document.getElementById('dateSlider');
  const clonedElement = originalElement.cloneNode(true);
  originalElement.parentNode.replaceChild(clonedElement, originalElement);

  document.getElementById('dateSlider').addEventListener('input', function(event) {
    let endDate = event.target.max;
    let selectedDate = event.target.value;
    let currentDate = document.getElementById('currentDate');
    currentDate.textContent = formatDay(datetimes_spc_wpc[selectedDate], selectedDate)
  });

  document.getElementById('dateSlider').addEventListener('change', async function(event) {
    let endDate = event.target.max
    let selectedDate = event.target.value;
    let currentDate = document.getElementById('currentDate');

    const geoJsonData = await getWPCOutlookObj(selectedDate);

    map.getSource('spc-outlook').setData(geoJsonData);
    currentDate.textContent = formatDay(datetimes_spc_wpc[selectedDate], selectedDate)
  });
}

document.getElementById("spc").addEventListener('click', async function() {
  map.removeLayer("custom-data-layer")
  dictToLegend(spcCat_legend, 'Severe Storm Risk', 'Storm Prediction Center')
  spcSliderListener()

  let sliderThumb = document.getElementById('sliderRange');
  sliderThumb.style.width = `0%`

  // Fetch the JSON data from the URL
  fetch("https://mapservices.weather.noaa.gov/vector/rest/services/outlooks/SPC_wx_outlks/MapServer/1/query?where=1=1&outFields=*&f=geojson")
    .then(response => response.json())
    .then(data => {
      // Create a GeoJSON source
      const geoJsonSource = {
        type: 'geojson',
        data: data
      };

      console.log(geoJsonSource)

      if (map.getLayer('spc-outlook')) {
        console.log('Layer already exists')
      } else {
        map.addSource('spc-outlook', geoJsonSource);
      }

      // Add a layer to the map
      map.addLayer({
        id: 'spc-outlook-layer',
        type: 'fill',
        source: 'spc-outlook',
        paint: {
          'fill-color': [
            'match',
            ['get', 'dn'],
            2, '#C1E9C1',
            3, '#66A366',
            4, '#F6F67F',
            5, '#E6C27F',
            6, '#E67F7F',
            7, '#FF7FFC',
            'gray'
          ],
          'fill-opacity': 0.9
        }
      },"terrain");
    })
    .catch(error => {
      console.error('Error fetching JSON data:', error);
    });

  let sliderDivID = document.getElementById('dateSlider')
  sliderDivID.max = 2
  sliderDivID.value = 0
  let selectedDate = sliderDivID.value;
  document.getElementById("dateSlider").style.setProperty('--sliderSize', '33%');

  let currentDate = document.getElementById('currentDate')
  currentDate.textContent = formatDay(datetimes_spc_wpc[selectedDate],selectedDate)
})

document.getElementById("wpc").addEventListener('click', async function() {
  dictToLegend(wpcCat_legend, 'Severe Storm Risk', 'Storm Prediction Center')
  wpcSliderListener()

  let sliderThumb = document.getElementById('sliderRange');
  sliderThumb.style.width = `0%`

  // Fetch the JSON data from the URL
  fetch("https://mapservices.weather.noaa.gov/vector/rest/services/hazards/wpc_precip_hazards/MapServer/0/query?where=1=1&outFields=*&f=geojson")
    .then(response => response.json())
    .then(data => {
      // Create a GeoJSON source
      const geoJsonSource = {
        type: 'geojson',
        data: data
      };

      console.log(geoJsonSource)

      if (map.getLayer('wpc-outlook')) {
        console.log('Layer already exists')
      } else {
        map.addSource('wpc-outlook', geoJsonSource);
      }

      if (map.getLayer('custom-data-layer')) {
        map.removeLayer('custom-data-layer')
      }

      if (map.getLayer('spc-outlook-layer')) {
        map.removeLayer('spc-outlook-layer')
      }

      // Add a layer to the map
      map.addLayer({
        id: 'wpc-outlook-layer',
        type: 'fill',
        source: 'wpc-outlook',
        paint: {
          'fill-color': [
            'match',
            ['get', 'dn'],
            1, '#7FE581',
            2, '#F2F67D',
            3, '#FF7881',
            4, '#FD82F6',
            'gray'
          ],
          'fill-opacity': 0.9
        }
      },"terrain");
    })
    .catch(error => {
      console.error('Error fetching JSON data:', error);
    });

  let sliderDivID = document.getElementById('dateSlider')
  sliderDivID.max = 2
  sliderDivID.value = 0
  let selectedDate = sliderDivID.value;
  document.getElementById("dateSlider").style.setProperty('--sliderSize', '33%');

  let currentDate = document.getElementById('currentDate')
  currentDate.textContent = formatDay(datetimes_spc_wpc[selectedDate],selectedDate)
})
