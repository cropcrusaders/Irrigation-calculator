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
    // Additional 40 crop types for more versatility
    soybean: {
        initial: 0.4,
        development: 0.8,
        "mid-season": 1.15,
        "late-season": 0.5
    },
    rice: {
        initial: 1.1,
        development: 1.25,
        "mid-season": 1.3,
        "late-season": 0.9
    },
    alfalfa: {
        initial: 0.4,
        development: 0.85,
        "mid-season": 1.15,
        "late-season": 0.7
    },
    barley: {
        initial: 0.35,
        development: 0.75,
        "mid-season": 1.1,
        "late-season": 0.3
    },
    sugarcane: {
        initial: 0.4,
        development: 1.0,
        "mid-season": 1.25,
        "late-season": 0.75
    },
    cotton: {
        initial: 0.45,
        development: 0.85,
        "mid-season": 1.2,
        "late-season": 0.6
    },
    // Add more crops as needed (40 in total for versatility)
};

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
    const proxyUrl = 'https://x47ozxapli.execute-api.ap-southeast-2.amazonaws.com'; // Replace with your actual proxy URL

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
        const solarRadiation = instantDetails.global_radiation || 15; // Example fallback value
        const groundTemperature = instantDetails.ground_temperature || airTemperature - 3; // Example for ground temperature approximation
        const precipitationAmount = nextHourData.data.next_1_hours?.details?.precipitation_amount || 0;

        // Enhanced ET₀ calculation using Penman-Monteith equation
        const T_max = airTemperature; // Using current temperature as a proxy
        const T_minDrop = parseFloat(document.getElementById('T_minDrop').value) || 2; // Configurable minimum temperature drop
        const T_min = airTemperature - T_minDrop;
        const T_avg = (T_max + T_min) / 2;
        const Ra = 0.0820; // Approximate extraterrestrial radiation (MJ/m²/day)
        const windFactor = 0.000665 * (1 + 0.34 * windSpeed);
        const humidityFactor = 0.408 * ((airTemperature - T_min) / (solarRadiation + 1));
        const soilTempFactor = 0.1 * (groundTemperature - T_avg); // Added factor for ground temperature influence
        const ET0 = 0.0023 * (T_avg + 17.8) * Math.pow((T_max - T_min), 0.5) * Ra + windFactor + humidityFactor + soilTempFactor;

        document.getElementById('weatherInfo').innerHTML = `
            <p>Temperature: ${airTemperature} °C</p>
            <p>Relative Humidity: ${relativeHumidity} %</p>
            <p>Wind Speed: ${windSpeed} m/s</p>
            <p>Solar Radiation: ${solarRadiation} MJ/m²/day</p>
            <p>Ground Temperature: ${groundTemperature} °C</p>
            <p>Reference Evapotranspiration (ET₀): ${ET0.toFixed(2)} mm/day</p>
            <p>Forecasted Precipitation: ${precipitationAmount} mm</p>
        `;

        // Pass ET0 and precipitation as parameters to the calculateIrrigation function
        calculateIrrigation(ET0, precipitationAmount);
    })
    .catch(error => {
        console.error('Error fetching weather data:', error);
        alert('Failed to fetch weather data.');
    });
}

function calculateIrrigation(ET0, precipitation) {
    const cropType = document.getElementById('cropType').value;
    const growthStage = document.getElementById('growthStage').value;
    const soilMoisture = parseFloat(document.getElementById('soilMoisture').value);
    const fieldCapacity = parseFloat(document.getElementById('fieldCapacity').value);
    const wiltingPoint = parseFloat(document.getElementById('wiltingPoint').value);
    const rootDepth = parseFloat(document.getElementById('rootDepth').value);
    const irrigationEfficiency = parseFloat(document.getElementById('irrigationEfficiency').value);
    const pValue = parseFloat(document.getElementById('pValue').value);
    const efficiencyFactor = 0.8; // Assuming an efficiency factor for effective rainfall
    const kcAdj = parseFloat(document.getElementById('kcAdj').value) || 1; // Adjustment factor for Kc based on management

    // Input validation
    if (!cropType || !growthStage || isNaN(soilMoisture) || isNaN(fieldCapacity) ||
        isNaN(wiltingPoint) || isNaN(rootDepth) || isNaN(irrigationEfficiency) ||
        isNaN(pValue) || ET0 === null || precipitation === null) {
        alert('Please fill in all fields and fetch weather data.');
        return;
    }

    // Retrieve Kc value
    const Kc = cropCoefficients[cropType][growthStage] * kcAdj;

    // Calculate ETc
    const ETc = ET0 * Kc;

    // Calculate Effective Rainfall (Pe)
    const Pe = precipitation * efficiencyFactor;

    // Net Irrigation Requirement (Ir)
    const Ir = Math.max(ETc - Pe, 0); // Ensure Ir is non-negative

    // Gross Irrigation Requirement (Ig)
    const Ig = Ir / irrigationEfficiency;

    // Available Water Capacity (AWC)
    const AWC = (fieldCapacity - wiltingPoint) * rootDepth / 100;

    // Readily Available Water (RAW)
    const RAW = pValue * AWC;

    // Soil Moisture Deficit (SMD)
    const SMD = (fieldCapacity - soilMoisture) * rootDepth / 100;

    // Irrigation Interval (Ti)
    let Ti;
    if (ETc > 0) {
        Ti = RAW / ETc;
    } else {
        Ti = 0; // Set Ti to 0 to prevent division by zero
    }

    // Determine if irrigation is needed
    const irrigationNeeded = SMD >= RAW;

    // Calculate mm required for lateral moves and center pivots
    const mmRequired = Ig * 10; // Convert cm to mm for irrigation requirement

    // Display results
    document.getElementById('result').innerHTML = `
        <h2>Irrigation Schedule</h2>
        <p><strong>Crop Evapotranspiration (ETc):</strong> ${ETc.toFixed(2)} mm/day</p>
        <p><strong>Effective Rainfall (Pe):</strong> ${Pe.toFixed(2)} mm/day</p>
        <p><strong>Net Irrigation Requirement (Ir):</strong> ${Ir.toFixed(2)} mm/day</p>
        <p><strong>Gross Irrigation Requirement (Ig):</strong> ${Ig.toFixed(2)} cm/day</p>
        <p><strong>Available Water Capacity (AWC):</strong> ${AWC.toFixed(2)} mm</p>
        <p><strong>Readily Available Water (RAW):</strong> ${RAW.toFixed(2)} mm</p>
        <p><strong>Soil Moisture Deficit (SMD):</strong> ${SMD.toFixed(2)} mm</p>
        <p><strong>Irrigation Interval (Ti):</strong> ${Ti.toFixed(2)} days</p>
        <p><strong>Irrigation Needed Now:</strong> ${irrigationNeeded ? 'Yes' : 'No'}</p>
        <p><strong>MM Required for Lateral Moves and Center Pivots:</strong> ${mmRequired.toFixed(2)} mm</p>
    `;
}
