// Add click event listeners to the page links - enables action when div element is clicked
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('livepage').addEventListener('click', function() {
    window.location.href = './live-weather.html'
  });
  document.getElementById('currentpage').addEventListener('click', function() {
    window.location.href = './current-alerts.html'
  });
  document.getElementById('forecastpage').addEventListener('click', function() {
    window.location.href = './forecast.html'
  });
});
