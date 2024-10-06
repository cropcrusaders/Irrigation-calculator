// Crop Coefficients (Kc) for different crops and growth stages
const cropCoefficients = {
    corn: {
        initial: 0.3,
        development: 0.7,
        "mid-season": 1.2,
        "late-season": 0.6
    },
    wheat: {
        initial: 0.4,
        development: 0.8,
        "mid-season": 1.15,
        "late-season": 0.25
    },
    soybean: {
        initial: 0.4,
        development: 0.8,
        "mid-season": 1.15,
        "late-season": 0.5
    }
    // Add more crops as needed
};

let ET0 = null;
let precipitation = null;

document.getElementById('fetchWeather').addEventListener('click', function() {
    navigator.geolocation.getCurrentPosition(fetchWeatherData, handleGeolocationError);
});

function handleGeolocationError(error) {
    alert('Geolocation error: ' + error.message);
}

function fetchWeatherData(position) {
    const lat = position.coords.latitude.toFixed(4);
    const lon = position.coords.longitude.toFixed(4);

    // Fetch weather data from Yr.no using proxy server
    const apiUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;

    // Use your AWS proxy server URL
    const proxyUrl = 'https://<your-aws-proxy-url>/proxy'; // Replace with your actual proxy URL

    fetch(proxyUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: apiUrl,
            headers: {
                'User-Agent': 'IrrigationCalculator/1.0 (your-email@example.com)'
            }
        })
    })
    .then(response => response.json())
    .then(data => {
        // Parse the weather data
        const timeseries = data.properties.timeseries;
        const nextHourData = timeseries[0];
        const instantDetails = nextHourData.data.instant.details;
        const airTemperature = instantDetails.air_temperature;
        const relativeHumidity = instantDetails.relative_humidity;
        const windSpeed = instantDetails.wind_speed;
        const precipitationAmount = nextHourData.data.next_1_hours?.details?.precipitation_amount || 0;

        // Simplified ET₀ calculation (using Hargreaves equation)
        const T_max = airTemperature; // Using current temperature as a proxy
        const T_min = airTemperature - 2; // Assume a 2°C drop for minimum temperature
        const T_avg = (T_max + T_min) / 2;
        const Ra = 0.0820; // Approximate extraterrestrial radiation (MJ/m²/day)
        ET0 = 0.0023 * (T_avg + 17.8) * Math.pow((T_max - T_min), 0.5) * Ra;

        document.getElementById('weatherInfo').innerHTML = `
            <p>Temperature: ${airTemperature} °C</p>
            <p>Relative Humidity: ${relativeHumidity} %</p>
            <p>Wind Speed: ${windSpeed} m/s</p>
            <p>Reference Evapotranspiration (ET₀): ${ET0.toFixed(2)} mm/day</p>
            <p>Forecasted Precipitation: ${precipitationAmount} mm</p>
        `;

        // Store ET0 and precipitation for use in calculations
        window.ET0 = ET0;
        window.precipitation = precipitationAmount;
    })
    .catch(error => {
        console.error('Error fetching weather data:', error);
        alert('Failed to fetch weather data.');
    });
}

function calculateIrrigation() {
    const cropType = document.getElementById('cropType').value;
    const growthStage = document.getElementById('growthStage').value;
    const soilMoisture = parseFloat(document.getElementById('soilMoisture').value);
    const fieldCapacity = parseFloat(document.getElementById('fieldCapacity').value);
    const wiltingPoint = parseFloat(document.getElementById('wiltingPoint').value);
    const rootDepth = parseFloat(document.getElementById('rootDepth').value);
    const irrigationEfficiency = parseFloat(document.getElementById('irrigationEfficiency').value);
    const pValue = parseFloat(document.getElementById('pValue').value);
    const efficiencyFactor = 0.8; // Assuming an efficiency factor for effective rainfall

    // Input validation
    if (!cropType || !growthStage || isNaN(soilMoisture) || isNaN(fieldCapacity) ||
        isNaN(wiltingPoint) || isNaN(rootDepth) || isNaN(irrigationEfficiency) ||
        isNaN(pValue) || window.ET0 === null || window.precipitation === null) {
        alert('Please fill in all fields and fetch weather data.');
        return;
    }

    const ET0 = window.ET0;
    const precipitation = window.precipitation;

    // Retrieve Kc value
    const Kc = cropCoefficients[cropType][growthStage];

    // Calculate ETc
    const ETc = ET0 * Kc;

    // Calculate Effective Rainfall (Pe)
    const Pe = precipitation * efficiencyFactor;

    // Net Irrigation Requirement (Ir)
    const Ir = ETc - Pe;

    // Gross Irrigation Requirement (Ig)
    const Ig = Ir / irrigationEfficiency;

    // Available Water Capacity (AWC)
    const AWC = (fieldCapacity - wiltingPoint) * rootDepth / 100;

    // Readily Available Water (RAW)
    const RAW = pValue * AWC;

    // Soil Moisture Deficit (SMD)
    const SMD = (fieldCapacity - soilMoisture) * rootDepth / 100;

    // Irrigation Interval (Ti)
    const Ti = RAW / ETc;

    // Determine if irrigation is needed
    const irrigationNeeded = SMD >= RAW;

    // Display results
    document.getElementById('result').innerHTML = `
        <h2>Irrigation Schedule</h2>
        <p><strong>Crop Evapotranspiration (ETc):</strong> ${ETc.toFixed(2)} mm/day</p>
        <p><strong>Effective Rainfall (Pe):</strong> ${Pe.toFixed(2)} mm/day</p>
        <p><strong>Net Irrigation Requirement (Ir):</strong> ${Ir.toFixed(2)} mm/day</p>
        <p><strong>Gross Irrigation Requirement (Ig):</strong> ${Ig.toFixed(2)} mm/day</p>
        <p><strong>Available Water Capacity (AWC):</strong> ${AWC.toFixed(2)} mm</p>
        <p><strong>Readily Available Water (RAW):</strong> ${RAW.toFixed(2)} mm</p>
        <p><strong>Soil Moisture Deficit (SMD):</strong> ${SMD.toFixed(2)} mm</p>
        <p><strong>Irrigation Interval (Ti):</strong> ${Ti.toFixed(2)} days</p>
        <p><strong>Irrigation Needed Now:</strong> ${irrigationNeeded ? 'Yes' : 'No'}</p>
    `;
}
