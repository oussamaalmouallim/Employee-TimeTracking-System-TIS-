// Location manager to handle both automatic and manual location updates
class LocationManager {
  constructor(options = {}) {
    this.options = {
      password: "1580",
      ...options
    };
    this.locationService = null;
    this.manualLocationActive = false;
  }

  async init() {
    // Import the location service
    try {
      const module = await import('./location.js');
      this.locationService = module.default;
    } catch (error) {
      console.error("Failed to import location service:", error);
    }
  }

  // Get location (automatic or manual based on state)
  async getLocation() {
    if (this.manualLocationActive) {
      return this.getManualLocation();
    } else {
      try {
        if (!this.locationService) await this.init();
        return await this.locationService.getLocation();
      } catch (error) {
        console.error("Error getting automatic location:", error);
        return {
          coords: { latitude: 0, longitude: 0 },
          source: "error"
        };
      }
    }
  }

  // Get current manual location if set
  getManualLocation() {
    const manualLocation = localStorage.getItem('manualLocation');
    if (manualLocation) {
      try {
        const location = JSON.parse(manualLocation);
        return {
          coords: {
            latitude: location.latitude || 0,
            longitude: location.longitude || 0
          },
          address: location.address || "Location manuelle",
          source: "manual"
        };
      } catch (e) {
        return {
          coords: { latitude: 0, longitude: 0 },
          address: "Location manuelle (erreur de format)",
          source: "manual-error"
        };
      }
    }
    return null;
  }

  // Set manual location
  setManualLocation(address, password) {
    if (password !== this.options.password) {
      throw new Error("Mot de passe incorrect");
    }

    // Create location with default coordinates if none provided
    const location = {
      address: address,
      latitude: 0, // Default value
      longitude: 0, // Default value
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('manualLocation', JSON.stringify(location));
    this.manualLocationActive = true;
    return location;
  }

  // Toggle between manual and automatic location
  toggleLocationMode(password) {
    if (password !== this.options.password) {
      throw new Error("Mot de passe incorrect");
    }
    
    this.manualLocationActive = !this.manualLocationActive;
    return this.manualLocationActive;
  }

  // Check if we're currently using manual location
  isUsingManualLocation() {
    return this.manualLocationActive;
  }

  // Get current location mode
  getLocationMode() {
    return this.manualLocationActive ? "manual" : "automatic";
  }
}

// Create and export a singleton instance
const locationManager = new LocationManager();

// Initialize on load
locationManager.init().catch(err => console.error("Failed to initialize location manager:", err));

export default locationManager;