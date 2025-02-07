const axios = require("axios");

async function geocodeAddress(address) {
  try {
    const endpoint = "https://maps.googleapis.com/maps/api/geocode/json";
    const response = await axios.get(endpoint, {
      params: {
        address,
        key: process.env.GOOGLE_API_KEY,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    }
    throw new Error(`No geocoding results for address: "${address}"`);
  } catch (error) {
    throw new Error(
      `Geocoding error for address "${address}": ${error.message}`
    );
  }
}

module.exports = {
  geocodeAddress,
};
