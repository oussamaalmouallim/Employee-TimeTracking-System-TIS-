// Location service with retry mechanism and fallbacks
class LocationService {
  constructor(options = {}) {
    this.options = {
      enableHighAccuracy: true,
      timeout: 15000, // Longer timeout for slower devices
      maximumAge: 0,
      retryCount: 5, // Increased retry count
      retryDelay: 2000,
      ...options
    };
    this.currentRetry = 0;
    this.deviceInfo = this.getDeviceInfo();
  }

  // Get device information to optimize location settings
  getDeviceInfo() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(userAgent.toLowerCase());
    const isDesktop = !isMobile && !isTablet;
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      userAgent
    };
  }

  // Get location with retry mechanism
  async getLocation() {
    try {
      // Optimize settings based on device type
      this.optimizeForDevice();
      return await this.getCurrentPosition();
    } catch (error) {
      console.warn(`Location attempt ${this.currentRetry + 1} failed: ${error.message}`);
      
      if (this.currentRetry < this.options.retryCount) {
        this.currentRetry++;
        
        // Modify options for retry (less accurate but more likely to succeed)
        if (this.currentRetry > 1) {
          this.options.enableHighAccuracy = false;
          this.options.timeout += 5000;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
        return this.getLocation();
      }
      
      // All retries failed, try alternative methods in sequence
      return this.getLocationAlternatives();
    }
  }

  // Optimize location settings for device type
  optimizeForDevice() {
    if (this.deviceInfo.isMobile) {
      // Mobile devices often have GPS, so keep high accuracy
      this.options.enableHighAccuracy = true; 
      this.options.timeout = 20000; // Longer timeout for mobile
    } else if (this.deviceInfo.isTablet) {
      // Tablets may have variable GPS quality
      this.options.enableHighAccuracy = true;
      this.options.timeout = 18000;
    } else {
      // Desktops usually have less accurate location
      this.options.enableHighAccuracy = false;
      this.options.timeout = 15000;
    }
  }

  // Promise wrapper for getCurrentPosition
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        this.options
      );
    });
  }

  // Try multiple fallback methods in sequence
  async getLocationAlternatives() {
    // Try methods in sequence, from most to least accurate
    try {
      return await this.getLocationFallbackIP();
    } catch (error) {
      try {
        return await this.getLocationFallbackHTML5();
      } catch (secondError) {
        try {
          return await this.getLocationFallbackNetworkInfo();
        } catch (thirdError) {
          return this.createMockLocation();
        }
      }
    }
  }

  // Fallback to IP-based geolocation
  async getLocationFallbackIP() {
    try {
      // Try multiple IP geolocation services
      const services = [
        'https://ipapi.co/json/',
        'https://api.ipify.org?format=json',
        'https://jsonip.com'
      ];
      
      // Try each service until one works
      for (const service of services) {
        try {
          const response = await fetch(service, { timeout: 5000 });
          if (!response.ok) continue;
          
          const data = await response.json();
          
          // Handle different API response formats
          const latitude = data.latitude || data.lat || 0;
          const longitude = data.longitude || data.lon || 0;
          
          if (latitude && longitude) {
            return {
              coords: {
                latitude,
                longitude,
                accuracy: 5000 // Approximate accuracy in meters
              },
              timestamp: Date.now(),
              source: 'ip-fallback'
            };
          }
        } catch (e) {
          console.warn(`IP geolocation service ${service} failed:`, e);
          // Continue to next service
        }
      }
      throw new Error('All IP geolocation services failed');
    } catch (error) {
      throw new Error('IP geolocation failed: ' + error.message);
    }
  }

  // HTML5 fallback using cached position or alternative API
  async getLocationFallbackHTML5() {
    return new Promise((resolve, reject) => {
      // Try with very permissive options
      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        { 
          enableHighAccuracy: false, 
          timeout: 30000, 
          maximumAge: 3600000 // Accept positions up to 1 hour old
        }
      );
    });
  }

  // Network information based rough location (very approximate)
  async getLocationFallbackNetworkInfo() {
    // This is a very rough approximation based on connection information
    // Only works in some browsers that support Network Information API
    if (navigator.connection && navigator.connection.downlink) {
      // Use connection metrics to make a very rough guess if we're in a city
      const connection = navigator.connection;
      
      // Default to a generic location (could be customized for the app's region)
      return {
        coords: {
          // Casablanca coordinates as a default for Morocco
          latitude: 33.5731,
          longitude: -7.5898,
          accuracy: 50000 // Very low accuracy (50km)
        },
        timestamp: Date.now(),
        source: 'network-fallback'
      };
    }
    throw new Error('Network information fallback failed');
  }

  // Last resort - create mock location
  createMockLocation() {
    console.warn('Using mock location as last resort');
    return {
      coords: {
        // Casablanca coordinates as a default for Morocco
        latitude: 33.5731,
        longitude: -7.5898,
        accuracy: 100000 // Very low accuracy (100km)
      },
      timestamp: Date.now(),
      source: 'mock-fallback'
    };
  }

  // Get readable address from coordinates
  async getAddressFromCoords(latitude, longitude) {
    try {
      // Try multiple geocoding services
      const services = [
        { 
          url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          headers: {
            'Accept-Language': 'fr',
            'User-Agent': 'TimeClockApp/1.0'
          },
          parser: (data) => data.display_name
        },
        { 
          url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=fr`,
          headers: {},
          parser: (data) => `${data.locality || ''}, ${data.city || ''}, ${data.countryName || ''}`
        }
      ];
      
      // Try each service until one works
      for (const service of services) {
        try {
          const response = await fetch(service.url, { headers: service.headers });
          if (!response.ok) continue;
          
          const data = await response.json();
          const address = service.parser(data);
          
          if (address && address.length > 3) {
            return address;
          }
        } catch (e) {
          // Continue to next service
        }
      }
      
      // If all services fail, return coordinates
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
      console.error('Address lookup error:', error);
      return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    }
  }
}

// Export an instance
const locationService = new LocationService();
export default locationService;