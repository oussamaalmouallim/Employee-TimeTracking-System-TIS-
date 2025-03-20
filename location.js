// Location service with retry mechanism and fallbacks
class LocationService {
  constructor(options = {}) {
    this.options = {
      enableHighAccuracy: true,
      timeout: 10000, // Longer timeout
      maximumAge: 0,
      retryCount: 3,
      retryDelay: 2000,
      ...options
    };
    this.currentRetry = 0;
  }

  // Get location with retry mechanism
  async getLocation() {
    try {
      return await this.getCurrentPosition();
    } catch (error) {
      console.warn(`Location attempt ${this.currentRetry + 1} failed: ${error.message}`);
      
      if (this.currentRetry < this.options.retryCount) {
        this.currentRetry++;
        
        // Modify options for retry (less accurate but more likely to succeed)
        if (this.currentRetry > 1) {
          this.options.enableHighAccuracy = false;
          this.options.timeout += 3000;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
        return this.getLocation();
      }
      
      // All retries failed, try IP-based fallback
      return this.getLocationFallback();
    }
  }

  // Promise wrapper for getCurrentPosition
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        this.options
      );
    });
  }

  // Fallback to IP-based geolocation
  async getLocationFallback() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      return {
        coords: {
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: 5000 // Approximate accuracy in meters
        },
        timestamp: Date.now(),
        source: 'ip-fallback'
      };
    } catch (error) {
      throw new Error('Both GPS and IP geolocation failed');
    }
  }

  // Get readable address from coordinates
  async getAddressFromCoords(latitude, longitude) {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'TimeClockApp/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Network response error');
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.error('Address lookup error:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }
}

// Export an instance
const locationService = new LocationService();
export default locationService;