// Weather API Service for IremboCare+
// Provides weather-based health recommendations for Rwanda

const { fetchWithRetry } = require('../utils/apiRetry');
const logger = require('../utils/logger');

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY;
    this.baseUrl = process.env.WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5';
    this.defaultLocation = { lat: -1.9441, lon: 30.0619 }; // Kigali coordinates
  }

  // Get coordinates for Rwanda districts
  getDistrictCoordinates(district) {
    const coordinates = {
      'Bugesera': { lat: -2.2167, lon: 30.2000 },
      'Burera': { lat: -1.4833, lon: 29.8667 },
      'Gakenke': { lat: -1.6833, lon: 29.7833 },
      'Gasabo': { lat: -1.9536, lon: 30.1044 },
      'Gatsibo': { lat: -1.5833, lon: 30.4167 },
      'Gicumbi': { lat: -1.5500, lon: 30.1167 },
      'Gisagara': { lat: -2.5333, lon: 29.8333 },
      'Huye': { lat: -2.5967, lon: 29.7394 },
      'Kamonyi': { lat: -2.0333, lon: 29.8167 },
      'Karongi': { lat: -1.9667, lon: 29.3833 },
      'Kayonza': { lat: -1.8833, lon: 30.6167 },
      'Kicukiro': { lat: -1.9667, lon: 30.1000 },
      'Kirehe': { lat: -2.2167, lon: 30.7167 },
      'Muhanga': { lat: -2.0833, lon: 29.7500 },
      'Musanze': { lat: -1.4997, lon: 29.6350 },
      'Ngoma': { lat: -2.1833, lon: 30.5333 },
      'Ngororero': { lat: -1.7833, lon: 29.5333 },
      'Nyabihu': { lat: -1.6500, lon: 29.5167 },
      'Nyagatare': { lat: -1.2833, lon: 30.3167 },
      'Nyamagabe': { lat: -2.4500, lon: 29.6167 },
      'Nyamasheke': { lat: -2.3167, lon: 29.1167 },
      'Nyanza': { lat: -2.3500, lon: 29.7500 },
      'Nyarugenge': { lat: -1.9536, lon: 30.0606 },
      'Nyaruguru': { lat: -2.5833, lon: 29.5000 },
      'Rubavu': { lat: -1.6833, lon: 29.2667 },
      'Ruhango': { lat: -2.1833, lon: 29.7833 },
      'Rulindo': { lat: -1.7667, lon: 30.0667 },
      'Rusizi': { lat: -2.4833, lon: 28.9167 },
      'Rutsiro': { lat: -1.8333, lon: 29.3333 },
      'Rwamagana': { lat: -1.9500, lon: 30.4333 }
    };

    return coordinates[district] || this.defaultLocation;
  }

  // Get current weather data
  async getCurrentWeather(district = 'Kigali') {
    if (!this.apiKey) {
      logger.warn('Weather API key not configured, using mock data');
      return this.getMockWeatherData(district);
    }

    try {
      const coords = this.getDistrictCoordinates(district);
      const url = `${this.baseUrl}/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${this.apiKey}&units=metric`;

      const response = await fetchWithRetry(url, {
        timeout: 10000
      }, {
        context: `Weather API - ${district}`,
        maxRetries: 2
      });

      const data = await response.json();
      
      logger.info(`Weather data fetched for ${district}`, {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        condition: data.weather[0].main
      });

      return this.formatWeatherData(data, district);
    } catch (error) {
      logger.error(`Failed to fetch weather for ${district}`, {
        error: error.message
      });
      
      // Return mock data as fallback
      return this.getMockWeatherData(district);
    }
  }

  // Format weather data
  formatWeatherData(data, district) {
    return {
      location: district,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      windSpeed: data.wind?.speed || 0,
      visibility: data.visibility ? data.visibility / 1000 : null, // Convert to km
      timestamp: new Date().toISOString()
    };
  }

  // Generate health recommendations based on weather
  generateHealthRecommendations(weatherData) {
    const recommendations = [];
    const { temperature, humidity, condition, description } = weatherData;

    // Temperature-based recommendations
    if (temperature > 30) {
      recommendations.push({
        type: 'heat_warning',
        priority: 'high',
        title: 'Heat Warning',
        message: 'High temperatures detected. Stay hydrated and avoid prolonged sun exposure.',
        actions: [
          'Drink plenty of water throughout the day',
          'Wear light-colored, loose-fitting clothing',
          'Seek shade during peak hours (10 AM - 4 PM)',
          'Watch for signs of heat exhaustion'
        ]
      });
    }

    if (temperature < 15) {
      recommendations.push({
        type: 'cold_weather',
        priority: 'medium',
        title: 'Cold Weather Advisory',
        message: 'Cool temperatures may affect those with respiratory conditions.',
        actions: [
          'Dress warmly in layers',
          'Keep indoor spaces well-ventilated but warm',
          'Be extra cautious if you have asthma or COPD',
          'Ensure adequate nutrition to maintain body heat'
        ]
      });
    }

    // Humidity-based recommendations
    if (humidity > 80) {
      recommendations.push({
        type: 'high_humidity',
        priority: 'medium',
        title: 'High Humidity Alert',
        message: 'High humidity can worsen respiratory conditions and increase infection risk.',
        actions: [
          'Ensure good ventilation in living spaces',
          'Be aware of increased mosquito activity',
          'Monitor for signs of respiratory discomfort',
          'Keep skin dry to prevent fungal infections'
        ]
      });
    }

    // Weather condition-based recommendations
    if (condition === 'Rain' || description.includes('rain')) {
      recommendations.push({
        type: 'rainy_weather',
        priority: 'high',
        title: 'Rainy Season Health Alert',
        message: 'Rainy weather increases risk of waterborne diseases and mosquito-borne illnesses.',
        actions: [
          'Use mosquito nets and repellents',
          'Ensure drinking water is clean and safe',
          'Avoid walking through stagnant water',
          'Be extra vigilant about malaria symptoms',
          'Keep wounds clean and dry'
        ]
      });
    }

    if (condition === 'Thunderstorm') {
      recommendations.push({
        type: 'storm_warning',
        priority: 'high',
        title: 'Thunderstorm Safety',
        message: 'Severe weather can pose health and safety risks.',
        actions: [
          'Stay indoors during the storm',
          'Avoid using electrical appliances',
          'Keep emergency supplies ready',
          'Monitor for flooding in your area'
        ]
      });
    }

    // Seasonal recommendations for Rwanda
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) { // Long rainy season
      recommendations.push({
        type: 'malaria_season',
        priority: 'high',
        title: 'Malaria Prevention - Rainy Season',
        message: 'This is peak malaria season in Rwanda. Take extra precautions.',
        actions: [
          'Sleep under treated mosquito nets',
          'Use mosquito repellent regularly',
          'Eliminate standing water around your home',
          'Seek immediate medical attention for fever',
          'Consider prophylactic medication if traveling'
        ]
      });
    }

    return recommendations;
  }

  // Mock weather data for fallback
  getMockWeatherData(district) {
    const mockData = {
      location: district,
      temperature: 22,
      feelsLike: 24,
      humidity: 65,
      pressure: 1013,
      condition: 'Partly Cloudy',
      description: 'partly cloudy',
      windSpeed: 3.5,
      visibility: 10,
      timestamp: new Date().toISOString(),
      isMockData: true
    };

    logger.info(`Using mock weather data for ${district}`);
    return mockData;
  }

  // Get weather-based health tips
  async getWeatherHealthTips(district = 'Kigali') {
    try {
      const weatherData = await this.getCurrentWeather(district);
      const recommendations = this.generateHealthRecommendations(weatherData);

      return {
        success: true,
        data: {
          weather: weatherData,
          healthRecommendations: recommendations,
          location: district,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Failed to generate weather health tips', {
        district,
        error: error.message
      });

      throw new Error('Unable to fetch weather-based health recommendations');
    }
  }
}

module.exports = new WeatherService();