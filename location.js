// Location service with enhanced tablet support and robust fallback mechanisms
class LocationService {
  constructor(options = {}) {
    this.options = {
      enableHighAccuracy: true,
      timeout: 15000, // Longer timeout for tablets
      maximumAge: 0,
      retryCount: 5, // More retries
      retryDelay: 2000,
      useIpFallbackFirst: false, // Option to use IP fallback first on tablet detection
      ...options
    };
    this.currentRetry = 0;
    this.isTablet = this.detectTablet();
    this.cachedPosition = null;
    
    // Adjust options based on device type
    if (this.isTablet) {
      this.options.timeout = 20000; // Even longer timeout for tablets
      this.options.maximumAge = 60000; // Accept positions up to 1 minute old on tablets
    }
  }

  // Detect if device is likely a tablet
  detectTablet() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIpad = /ipad/.test(userAgent);
    const isAndroidTablet = /android/.test(userAgent) && !/mobile/.test(userAgent);
    const isWindowsTablet = /windows/.test(userAgent) && /touch/.test(userAgent);
    const isTabletBySize = window.innerWidth >= 600 && window.innerWidth <= 1200;
    
    return isIpad || isAndroidTablet || isWindowsTablet || isTabletBySize;
  }

  // Get location with retry mechanism and tablet adaptations
  async getLocation() {
    // For tablets, try to use cached position first
    if (this.isTablet && this.cachedPosition) {
      console.log("Using cached position for tablet");
      return this.cachedPosition;
    }
    
    // For tablets with poor GPS, try IP fallback first if option is set
    if (this.isTablet && this.options.useIpFallbackFirst) {
      try {
        const ipLocation = await this.getLocationFallback();
        this.cachedPosition = ipLocation;
        return ipLocation;
      } catch (error) {
        console.log("IP fallback failed, trying GPS...");
        // Continue to GPS method if IP fallback fails
      }
    }
    
    try {
      const position = await this.getCurrentPosition();
      this.cachedPosition = position; // Cache successful position
      return position;
    } catch (error) {
      console.warn(`Location attempt ${this.currentRetry + 1} failed: ${error.message}`);
      
      if (this.currentRetry < this.options.retryCount) {
        this.currentRetry++;
        
        // Modify options for retry (less accurate but more likely to succeed)
        if (this.currentRetry > 1) {
          this.options.enableHighAccuracy = false;
          this.options.timeout += 5000; // Increase timeout more aggressively
          this.options.maximumAge += 60000; // Accept increasingly older positions
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
        return this.getLocation();
      }
      
      // All retries failed, try IP-based fallback
      return this.getLocationFallback();
    }
  }

  // Promise wrapper for getCurrentPosition with tablet-specific handling
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      // For tablets, use watchPosition with a timeout to improve chances of getting a fix
      if (this.isTablet) {
        const watchId = navigator.geolocation.watchPosition(
          position => {
            navigator.geolocation.clearWatch(watchId);
            resolve(position);
          },
          error => {
            navigator.geolocation.clearWatch(watchId);
            reject(error);
          },
          this.options
        );
        
        // Set a timeout to stop watching if it takes too long
        setTimeout(() => {
          navigator.geolocation.clearWatch(watchId);
          reject(new Error("Tablet GPS timeout - falling back to alternative method"));
        }, this.options.timeout);
      } else {
        // Standard getCurrentPosition for non-tablet devices
        navigator.geolocation.getCurrentPosition(
          position => resolve(position),
          error => reject(error),
          this.options
        );
      }
    });
  }

  // Enhanced fallback to IP-based geolocation with multiple providers
  async getLocationFallback() {
    // Try multiple IP geolocation services for better reliability
    const geoipServices = [
      {
        url: 'https://ipapi.co/json/',
        parser: data => ({ latitude: data.latitude, longitude: data.longitude, accuracy: 5000 })
      },
      {
        url: 'https://ipinfo.io/json?token=2ad8f7c4f81edd', // Use a token or consider removing if not valid
        parser: data => {
          if (data.loc) {
            const [latitude, longitude] = data.loc.split(',').map(Number);
            return { latitude, longitude, accuracy: 8000 };
          }
          throw new Error("Invalid response format");
        }
      },
      {
        url: 'https://geolocation-db.com/json/',
        parser: data => ({ latitude: data.latitude, longitude: data.longitude, accuracy: 10000 })
      }
    ];
    
    // Try each service in order until one works
    for (const service of geoipServices) {
      try {
        const response = await fetch(service.url);
        if (!response.ok) continue;
        
        const data = await response.json();
        const coords = service.parser(data);
        
        return {
          coords: coords,
          timestamp: Date.now(),
          source: 'ip-fallback'
        };
      } catch (error) {
        console.warn(`IP geolocation service failed: ${error.message}`);
        // Continue to next service
      }
    }
    
    // All services failed, use a very approximate location or reject
    return {
      coords: {
        latitude: 31.7917, // Default to Morocco center coordinates
        longitude: -7.0926,
        accuracy: 500000 // Very poor accuracy
      },
      timestamp: Date.now(),
      source: 'default-fallback'
    };
  }

  // Get readable address from coordinates (unchanged)
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
