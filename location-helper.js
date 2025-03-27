// Helper module for location functionality
class LocationHelper {
  constructor() {
    this.passwordCorrect = false;
  }
  
  // Verify password before showing location form
  verifyPassword(password, correctPassword) {
    if (password === correctPassword) {
      this.passwordCorrect = true;
      return true;
    }
    this.passwordCorrect = false;
    return false;
  }
  
  // Reset password status
  resetPasswordStatus() {
    this.passwordCorrect = false;
  }
  
  // Check if password has been verified
  isPasswordVerified() {
    return this.passwordCorrect;
  }
}

// Create and export a singleton instance
const locationHelper = new LocationHelper();
export default locationHelper;