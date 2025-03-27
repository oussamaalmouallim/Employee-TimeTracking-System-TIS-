import locationManager from './location-manager.js';
import locationHelper from './location-helper.js';

// Employee data
const employees = [
  { id: 1, name: "Oussama", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Ingénieur" },
  { id: 2, name: "Reda", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Chargé de mission" },
  { id: 3, name: "Amina", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Assistante" },
  { id: 4, name: "Nouhaila", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Charge de marketing" },
  { id: 5, name: "Aya", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Chargé d'inventaire" },
  { id: 6, name: "Aymane", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Technicien" },
  { id: 7, name: "Driss", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Technicien" },
  { id: 8, name: "Achraf", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Technicien" },
  { id: 9, name: "Brahim", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Technicien" },
  { id: 10, name: "ASOPHI", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Technicien" },
  { id: 11, name: "Mousstafa", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Technicien" },
  { id: 12, name: "Abdlekrim", image: "https://img.freepik.com/vecteurs-premium/icone-utilisateur-simple-3d-isolee_169241-7120.jpg", status: "out", jobTitle: "Technicien" },
];

// Timesheet data storage - load from localStorage if available
let timeRecords = JSON.parse(localStorage.getItem('timeRecords')) || [];

// Update employee status based on saved records
function syncEmployeeStatusWithRecords() {
  // Reset all employees to 'out' status first
  employees.forEach(emp => emp.status = 'out');
  
  // Go through the records and update employee status for those still clocked in
  timeRecords.forEach(record => {
    if (record.status === 'in' && !record.clockOutTime) {
      const employee = employees.find(emp => emp.id === record.employeeId);
      if (employee) {
        employee.status = 'in';
        employee.clockInTime = record.clockInTime;
        employee.clockInDate = record.date;
        employee.clockInLocation = record.location;
      }
    }
  });
}

function updateDateTime() {
  const now = new Date();
  document.getElementById('datetime').textContent = now.toLocaleString('fr-FR');
  document.getElementById('dateTimeInput').value = now.toISOString();
}
setInterval(updateDateTime, 1000);
updateDateTime();

async function updateLocation() {
  const locationDiv = document.getElementById('location');
  try {
    locationDiv.textContent = 'Recherche de la position...';
    
    // Use the location manager instead of importing location.js directly
    const position = await locationManager.getLocation();
    
    const { latitude, longitude } = position.coords;
    const source = position.source || 'gps';
    
    // If this is manual location and has an address already
    if (source === 'manual' && position.address) {
      locationDiv.innerHTML = `
        <div>${position.address} <small>(manuel)</small></div>
        <div class="location-details">
          Latitude: ${latitude.toFixed(6)}<br>
          Longitude: ${longitude.toFixed(6)}
        </div>
      `;
      document.getElementById('locationInput').value = position.address;
      return;
    }
    
    locationDiv.innerHTML = `
      <div>Coordonnées trouvées (${source})</div>
      <div class="location-details">
        Latitude: ${latitude.toFixed(6)}<br>
        Longitude: ${longitude.toFixed(6)}
      </div>
    `;
    
    // Only get address from coords if not manual source
    if (source !== 'manual') {
      // Import location service for getAddressFromCoords
      const locationService = (await import('./location.js')).default;
      const address = await locationService.getAddressFromCoords(latitude, longitude);
      if (address) {
        locationDiv.innerHTML = `
          <div>${address}${source === 'manual' ? ' <small>(manuel)</small>' : ''}</div>
          <div class="location-details">
            Latitude: ${latitude.toFixed(6)}<br>
            Longitude: ${longitude.toFixed(6)}
          </div>
        `;
        document.getElementById('locationInput').value = address;
      }
    }
  } catch (error) {
    locationDiv.textContent = `Impossible de déterminer votre position exacte`;
    document.getElementById('locationInput').value = "Position non disponible";
  }
}

updateLocation();
setInterval(() => {
  const locationText = document.getElementById('location').textContent;
  if (locationText.includes('Erreur') || 
      locationText.includes('Recherche') || 
      locationText.includes('Impossible')) {
    updateLocation();
  }
}, 120000); // Check every 2 minutes instead of every minute

// Initialize employee grid
function initEmployeeGrid() {
  const grid = document.getElementById('employeeGrid');
  grid.innerHTML = '';
  
  employees.forEach(employee => {
    const card = document.createElement('div');
    card.className = `employee-card ${employee.status === 'in' ? 'active' : 'inactive'}`;
    card.dataset.employeeId = employee.id;
    
    const statusIndicator = document.createElement('div');
    statusIndicator.className = `status-indicator status-${employee.status}`;
    
    const imageContainer = document.createElement('div');
    imageContainer.className = 'employee-image-container';
    
    const img = document.createElement('img');
    img.src = employee.image;
    img.alt = employee.name;
    img.className = 'employee-image';
    
    const editBtn = document.createElement('div');
    editBtn.className = 'edit-employee';
    editBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
      </svg>
    `;
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(employee);
    });
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'employee-info';
    
    const jobTitleDiv = document.createElement('div');
    jobTitleDiv.className = 'job-title';
    jobTitleDiv.textContent = employee.jobTitle;
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'employee-name';
    nameDiv.textContent = employee.name;
    
    imageContainer.appendChild(img);
    imageContainer.appendChild(editBtn);
    imageContainer.appendChild(statusIndicator);
    
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(jobTitleDiv);
    
    const actionDiv = document.createElement('div');
    actionDiv.className = 'clock-action';
    
    if (employee.status === 'out') {
      const clockInBtn = document.createElement('button');
      clockInBtn.className = 'action-button clock-in-btn';
      clockInBtn.textContent = 'Arrivée';
      clockInBtn.onclick = (e) => {
        e.stopPropagation();
        clockInEmployee(employee.id);
      };
      actionDiv.appendChild(clockInBtn);
    } else {
      const clockOutBtn = document.createElement('button');
      clockOutBtn.className = 'action-button clock-out-btn';
      clockOutBtn.textContent = 'Départ';
      clockOutBtn.onclick = (e) => {
        e.stopPropagation();
        clockOutEmployee(employee.id);
      };
      actionDiv.appendChild(clockOutBtn);
    }
    
    card.appendChild(imageContainer);
    card.appendChild(infoDiv);
    card.appendChild(actionDiv);
    
    card.addEventListener('click', () => {
      if (employee.status === 'out') {
        clockInEmployee(employee.id);
      } else {
        clockOutEmployee(employee.id);
      }
    });
    
    grid.appendChild(card);
  });
}

// Function to open the edit modal
function openEditModal(employee) {
  // Populate the form fields
  document.getElementById('editEmployeeId').value = employee.id;
  document.getElementById('editName').value = employee.name;
  document.getElementById('editJobTitle').value = employee.jobTitle;
  document.getElementById('editImageUrl').value = employee.image;
  
  // Show the modal
  const modal = document.getElementById('employeeEditModal');
  const modalContent = modal.querySelector('.modal-content');
  modal.classList.add('modal-show');
  setTimeout(() => {
    modalContent.classList.add('modal-content-show');
  }, 10);
}

// Function to save employee edits
function saveEmployeeEdit(event) {
  event.preventDefault();
  
  const id = parseInt(document.getElementById('editEmployeeId').value);
  const name = document.getElementById('editName').value.trim();
  const jobTitle = document.getElementById('editJobTitle').value.trim();
  const imageUrl = document.getElementById('editImageUrl').value.trim();
  
  if (!name || !jobTitle || !imageUrl) {
    alert('Veuillez remplir tous les champs');
    return;
  }
  
  // Find and update the employee
  const employeeIndex = employees.findIndex(emp => emp.id === id);
  if (employeeIndex !== -1) {
    employees[employeeIndex].name = name;
    employees[employeeIndex].jobTitle = jobTitle;
    employees[employeeIndex].image = imageUrl;
    
    // Update any related records in timeRecords
    timeRecords.forEach(record => {
      if (record.employeeId === id) {
        record.employeeName = name;
      }
    });
    
    // Save updated records to localStorage
    localStorage.setItem('timeRecords', JSON.stringify(timeRecords));
    
    // Update the UI
    initEmployeeGrid();
    updateTimesheetTable();
    
    // Close the modal
    closeEditModal();
    
    alert('Informations de l\'employé mises à jour avec succès');
  }
}

// Function to close the edit modal
function closeEditModal() {
  const modal = document.getElementById('employeeEditModal');
  const modalContent = modal.querySelector('.modal-content');
  
  modalContent.classList.remove('modal-content-show');
  setTimeout(() => {
    modal.classList.remove('modal-show');
  }, 300);
}

// Clock in an employee
function clockInEmployee(employeeId) {
  const employee = employees.find(emp => emp.id === employeeId);
  if (!employee) return;
  
  // Get current date and time
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.toLocaleTimeString('fr-FR');
  const locationText = document.getElementById('location').textContent;
  
  // Update employee status
  employee.status = 'in';
  employee.clockInTime = currentTime;
  employee.clockInDate = today;
  employee.clockInLocation = locationText;
  
  // Create timesheet record
  const newRecord = {
    employeeId: employee.id,
    employeeName: employee.name,
    date: today,
    clockInTime: currentTime,
    clockOutTime: null,
    location: locationText,
    status: 'in'
  };
  
  // Add to time records
  timeRecords.push(newRecord);
  
  // Save to localStorage
  localStorage.setItem('timeRecords', JSON.stringify(timeRecords));
  
  // Update UI
  initEmployeeGrid();
  updateTimesheetTable();
  
  // Show success message
  alert(`${employee.name} s'est pointé à ${currentTime}`);
}

// Clock out an employee
function clockOutEmployee(employeeId) {
  const employee = employees.find(emp => emp.id === employeeId);
  if (!employee) return;
  
  // Get current time
  const now = new Date();
  const currentTime = now.toLocaleTimeString('fr-FR');
  
  // Find the record for this employee
  const record = timeRecords.find(rec => 
    rec.employeeId === employeeId && 
    rec.status === 'in' && 
    !rec.clockOutTime
  );
  
  if (record) {
    // Update record
    record.clockOutTime = currentTime;
    record.status = 'out';
    
    // Update employee status
    employee.status = 'out';
    employee.clockOutTime = currentTime;
    
    // Save to localStorage
    localStorage.setItem('timeRecords', JSON.stringify(timeRecords));
    
    // Update UI
    initEmployeeGrid();
    updateTimesheetTable();
    
    // Show success message
    alert(`${employee.name} s'est déconnecté à ${currentTime}`);
  }
}

// Update the timesheet table in the summary modal
function updateTimesheetTable() {
  const tbody = document.getElementById('timesheetBody');
  tbody.innerHTML = '';
  
  timeRecords.forEach(record => {
    const row = document.createElement('tr');
    
    const nameCell = document.createElement('td');
    nameCell.textContent = record.employeeName;
    
    const dateCell = document.createElement('td');
    dateCell.textContent = record.date;
    
    const clockInCell = document.createElement('td');
    clockInCell.textContent = record.clockInTime;
    
    const clockOutCell = document.createElement('td');
    clockOutCell.textContent = record.clockOutTime || '—';
    
    const locationCell = document.createElement('td');
    locationCell.textContent = record.location || '—';
    
    const statusCell = document.createElement('td');
    const statusSpan = document.createElement('span');
    statusSpan.className = `timesheet-status status-${record.status}`;
    statusSpan.textContent = record.status === 'in' ? 'Présent' : 'Sorti';
    statusCell.appendChild(statusSpan);
    
    row.appendChild(nameCell);
    row.appendChild(dateCell);
    row.appendChild(clockInCell);
    row.appendChild(clockOutCell);
    row.appendChild(locationCell);
    row.appendChild(statusCell);
    
    tbody.appendChild(row);
  });
}

// Show/hide summary modal
document.getElementById('toggleSummary').addEventListener('click', function() {
  const summaryModal = document.getElementById('summaryModal');
  const modalContent = summaryModal.querySelector('.modal-content');
  
  // Update timesheet table
  updateTimesheetTable();
  
  // Show modal with animation
  summaryModal.classList.add('modal-show');
  setTimeout(() => {
    modalContent.classList.add('modal-content-show');
  }, 10);
  
  // Change icon when toggled
  this.classList.toggle('active');
  if (this.classList.contains('active')) {
    this.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
    `;
  } else {
    this.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
      </svg>
    `;
  }
});

// Close modal event listeners
document.getElementById('closeModal').addEventListener('click', function() {
  const summaryModal = document.getElementById('summaryModal');
  const modalContent = summaryModal.querySelector('.modal-content');
  
  // Hide with animation
  modalContent.classList.remove('modal-content-show');
  setTimeout(() => {
    summaryModal.classList.remove('modal-show');
  }, 300);
  
  // Reset toggle button state
  const toggleButton = document.getElementById('toggleSummary');
  toggleButton.classList.remove('active');
  toggleButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
  `;
});

document.getElementById('summaryModal').addEventListener('click', function(event) {
  if (event.target === this) {
    document.getElementById('closeModal').click();
  }
});

// Manual location button
document.getElementById('manualLocationBtn').addEventListener('click', function() {
  const modal = document.getElementById('manualLocationModal');
  const modalContent = modal.querySelector('.modal-content');
  
  // Reset the form and password verification
  document.getElementById('passwordForm').style.display = 'block';
  document.getElementById('manualLocationForm').style.display = 'none';
  document.getElementById('locationPassword').value = '';
  document.getElementById('manualAddress').value = '';
  locationHelper.resetPasswordStatus();
  
  // Show modal with animation
  modal.classList.add('modal-show');
  setTimeout(() => {
    modalContent.classList.add('modal-content-show');
  }, 10);
});

// Password verification
document.getElementById('verifyPasswordBtn').addEventListener('click', function(e) {
  e.preventDefault();
  
  const password = document.getElementById('locationPassword').value;
  
  try {
    if (locationHelper.verifyPassword(password, "1580")) {
      // Hide password form, show location form
      document.getElementById('passwordForm').style.display = 'none';
      document.getElementById('manualLocationForm').style.display = 'block';
      
      // Pre-fill with existing data if available
      const savedLocation = locationManager.getManualLocation();
      if (savedLocation && savedLocation.address) {
        document.getElementById('manualAddress').value = savedLocation.address || '';
      }
    } else {
      alert("Mot de passe incorrect");
    }
  } catch (error) {
    alert(`Erreur: ${error.message}`);
  }
});

// Manual location form submission
document.getElementById('manualLocationForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const address = document.getElementById('manualAddress').value;
  
  try {
    if (!locationHelper.isPasswordVerified()) {
      throw new Error("Veuillez vérifier le mot de passe d'abord");
    }
    
    await locationManager.setManualLocation(address, "1580");
    updateLocation(); // Update the location display
    closeManualLocationModal();
    alert('Localisation manuelle définie avec succès');
  } catch (error) {
    alert(`Erreur: ${error.message}`);
  }
});

// Close manual location modal
function closeManualLocationModal() {
  const modal = document.getElementById('manualLocationModal');
  const modalContent = modal.querySelector('.modal-content');
  
  modalContent.classList.remove('modal-content-show');
  setTimeout(() => {
    modal.classList.remove('modal-show');
  }, 300);
  
  // Clear password field
  document.getElementById('locationPassword').value = '';
}

document.getElementById('closeManualLocationModal').addEventListener('click', closeManualLocationModal);

document.getElementById('manualLocationModal').addEventListener('click', function(event) {
  if (event.target === this) {
    closeManualLocationModal();
  }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  // Load data from localStorage and sync employee status
  syncEmployeeStatusWithRecords();
  
  initEmployeeGrid();
  updateTimesheetTable();
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('submissionDate').value = today;
  
  // Clear timesheet history button functionality
  document.getElementById('clearTimesheet').addEventListener('click', function() {
    if (confirm('Êtes-vous sûr de vouloir supprimer tout l\'historique de pointage?')) {
      localStorage.removeItem('timeRecords');
      timeRecords = [];
      
      // Reset employee status
      employees.forEach(emp => emp.status = 'out');
      
      // Update UI
      initEmployeeGrid();
      updateTimesheetTable();
      
      alert('L\'historique de pointage a été supprimé.');
    }
  });
  
  // Add clear data button functionality
  document.getElementById('toggleSummary').addEventListener('dblclick', function() {
    if (confirm('Voulez-vous effacer toutes les données de pointage enregistrées?')) {
      localStorage.removeItem('timeRecords');
      timeRecords = [];
      
      // Reset employee status
      employees.forEach(emp => emp.status = 'out');
      
      // Update UI
      initEmployeeGrid();
      updateTimesheetTable();
      
      alert('Toutes les données ont été effacées.');
    }
  });
  
  // Google Sheets submission handler
  document.getElementById("timeclockForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const submitBtn = document.getElementById("submitTogooglesheet");
    submitBtn.innerText = "Envoi en cours...";
    submitBtn.classList.add('active');

    const formData = new FormData();
    formData.append('action', 'timesheet');
    formData.append('date', document.getElementById('submissionDate').value);
    
    // Add all timesheet records
    formData.append('records', JSON.stringify(timeRecords));

    fetch("https://script.google.com/macros/s/AKfycbwslJzwnb1OZA2VahPAafUrqr7_xah-xh-CUp88pzuSGm8KMUQu_1TReL1yhKYOmqn5iw/exec", {
        method: "POST",
        body: formData
      })
      .then(response => response.text())
      .then(data => {
        alert("Données de pointage envoyées avec succès à Google Sheets !");
        submitBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.376 12.416L8.777 19.482c-.7.046-.137.078-.217.078-.133 0-.262-.053-.353-.146-.157-.148-.194-.368-.094-.558l3.53-6.39H5c-.202 0-.373-.116-.443-.3-.074-.181-.026-.385.116-.504l10.62-7.303c.094-.063.209-.095.323-.095.183 0 .341.084.437.232.094.147.105.333.026.49l-3.53 6.562h6.37c.204 0 .38.127.448.306.068.18.015.38-.12.495z"/>
          </svg>
          Send to Google Sheet
        `;
        setTimeout(() => submitBtn.classList.remove('active'), 2000);
      })
      .catch(error => {
        alert("Erreur lors de l'envoi des données.");
        submitBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.376 12.416L8.777 19.482c-.7.046-.137.078-.217.078-.133 0-.262-.053-.353-.146-.157-.148-.194-.368-.094-.558l3.53-6.39H5c-.202 0-.373-.116-.443-.3-.074-.181-.026-.385.116-.504l10.62-7.303c.094-.063.209-.095.323-.095.183 0 .341.084.437.232.094.147.105.333.026.49l-3.53 6.562h6.37c.204 0 .38.127.448.306.068.18.015.38-.12.495z"/>
          </svg>
          Try again
        `;
        submitBtn.classList.remove('active');
      });
  });
});

// Employee edit form submission
document.getElementById('employeeEditForm').addEventListener('submit', saveEmployeeEdit);

// Close edit modal buttons
document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);

document.getElementById('employeeEditModal').addEventListener('click', function(event) {
  if (event.target === this) {
    closeEditModal();
  }
});
