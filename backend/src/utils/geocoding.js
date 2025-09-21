import axios from 'axios';

// Free geocoding service using OpenStreetMap Nominatim
export const geocodeAddress = async (address) => {
  try {
    const response = await axios.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: address,
          format: 'json',
          limit: 1,
          addressdetails: 1,
          countrycodes: 'in',
        },
        headers: {
          'User-Agent': 'BarberQueue-App/1.0',
        },
      }
    );

    let data = response.data || [];

    // Retry with ", India" appended if no results and address doesn't already contain country
    if ((!data || data.length === 0) && !/\bIndia\b/i.test(address)) {
      const retry = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: `${address}, India`,
            format: 'json',
            limit: 1,
            addressdetails: 1,
            countrycodes: 'in',
          },
          headers: {
            'User-Agent': 'BarberQueue-App/1.0',
          },
        }
      );
      data = retry.data || [];
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formattedAddress: result.display_name,
      };
    } else {
      throw new Error('Address not found');
    }
  } catch (error) {
    console.error('Geocoding error:', error.message);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
};

// Alternative: Google Geocoding API (requires API key)
export const geocodeAddressGoogle = async (address, apiKey) => {
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address: address,
          key: apiKey,
          region: 'in',
          components: 'country:IN',
        },
      }
    );

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const location = result.geometry.location;
      return {
        lat: location.lat,
        lng: location.lng,
        formattedAddress: result.formatted_address,
      };
    } else {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
  } catch (error) {
    console.error('Google Geocoding error:', error.message);
    throw new Error(`Failed to geocode address: ${error.message}`);
  }
};
