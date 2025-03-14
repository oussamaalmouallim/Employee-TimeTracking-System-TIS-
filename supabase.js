// Fonction pour initialiser Supabase et configurer le gestionnaire d'événements
function initSupabase() {
  // Configuration de Supabase
  const supabaseUrl = "https://quflgxjymdocfcqwppxl.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1ZmxneGp5bWRvY2ZjcXdwcHhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MjI5NzAsImV4cCI6MjA1NjM5ODk3MH0.084B-my88YIXT0TZ2uD0UT82xU2M4yRhBv2idNUSjLQ";

  // Make sure Supabase client is properly initialized
  let supabase;
  try {
    supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    console.log("Supabase client initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    return;
  }
  
  // Add event listener to the "Send to Supabase" button
  document.getElementById('submitToSupabase').addEventListener('click', async function(event) {
    event.preventDefault();
    
    // Show loading state
    this.innerText = "Envoi en cours...";
    this.classList.add('active');
    
    try {
      // Collect timesheet data from the table
      const timesheetTable = document.getElementById('timesheetBody');
      if (!timesheetTable || timesheetTable.querySelectorAll('tr').length === 0) {
        throw new Error("Aucune donnée de pointage disponible");
      }
      
      const timesheetRows = Array.from(timesheetTable.querySelectorAll('tr'));
      
      // Create an array to store records formatted for Supabase
      const records = [];
      
      // Iterate through table rows and collect data
      timesheetRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 6) {
          const record = {
            employee_name: cells[0].textContent,
            date: cells[1].textContent,
            clock_in: cells[2].textContent,
            clock_out: cells[3].textContent !== '—' ? cells[3].textContent : null,
            location: cells[4].textContent !== '—' ? cells[4].textContent : null,
            status: cells[5].textContent.includes('Présent') ? 'in' : 'out',
            submission_date: document.getElementById('submissionDate').value,
            submitted_at: new Date().toISOString()
          };
          
          records.push(record);
        }
      });
      
      if (records.length === 0) {
        throw new Error("Aucun enregistrement valide à envoyer");
      }
      
      console.log("Preparing to send records to Supabase:", records);
      
      // Test Supabase connection first
      const { data: testData, error: testError } = await supabase
        .from("employee_timesheets")
        .select("id")
        .limit(1);
        
      if (testError) {
        console.error("Supabase connection test failed:", testError);
        throw new Error(`Erreur de connexion à Supabase: ${testError.message}`);
      }
      
      console.log("Supabase connection test successful");
      
      // Send data to Supabase
      const { data, error } = await supabase
        .from("employee_timesheets")
        .insert(records);
      
      if (error) {
        console.error("Detailed Supabase error:", error);
        throw new Error(error.message || "Erreur lors de l'insertion des données");
      }
      
      console.log("Data successfully sent to Supabase:", data);
      
      // Show success message
      alert("Données de pointage envoyées avec succès à Supabase!");
      this.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8h-2V7h2v2z"/>
        </svg>
        Envoi réussi!
      `;
      
      // Return to initial state after a few seconds
      setTimeout(() => {
        this.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8h-2V7h2v2z"/>
          </svg>
          Send to Supabase
        `;
        this.classList.remove('active');
      }, 3000);
      
    } catch (error) {
      // Handle errors
      console.error("Error sending to Supabase:", error);
      alert(`Erreur lors de l'envoi des données: ${error.message}`);
      
      // Reset button
      this.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8h-2V7h2v2z"/>
        </svg>
        Réessayer
      `;
      this.classList.remove('active');
    }
  });
}

// Ensure supabase-js is loaded before initialization
document.addEventListener('DOMContentLoaded', function() {
  // Check if the correct version of supabase-js is loaded
  if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
    console.log("Supabase library detected, initializing...");
    initSupabase();
  } else {
    console.log("Loading Supabase library...");
    // Load the supabase-js script with a specific version
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js";
    script.onload = function() {
      console.log("Supabase library loaded successfully");
      initSupabase();
    };
    script.onerror = function() {
      console.error("Failed to load Supabase library");
      alert("Impossible de charger la bibliothèque Supabase. Veuillez réessayer plus tard.");
    };
    document.head.appendChild(script);
  }
});