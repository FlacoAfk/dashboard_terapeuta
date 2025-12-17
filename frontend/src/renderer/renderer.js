/**
 * Renderer Process
 * Main application logic for the Electron frontend
 */

// DOM Elements
const elements = {
    backendStatus: document.getElementById('backendStatus'),
    backendStatusText: document.getElementById('backendStatusText'),
    patientCount: document.getElementById('patientCount'),
    sessionCount: document.getElementById('sessionCount'),
    apiVersion: document.getElementById('apiVersion'),
    patientsList: document.getElementById('patientsList'),
};

/**
 * Initialize the application
 */
async function init() {
    console.log('🚀 Dashboard Terapeuta initialized');
    console.log('Platform:', window.electronAPI?.platform);

    // Check backend connection
    await checkBackendStatus();

    // Load initial data
    await loadDashboardData();

    // Set up periodic health check
    setInterval(checkBackendStatus, 30000); // Every 30 seconds
}

/**
 * Check if the backend is online
 */
async function checkBackendStatus() {
    try {
        const response = await window.HealthService.check();

        if (response.status === 'ok') {
            setBackendOnline(true);
        } else {
            setBackendOnline(false);
        }
    } catch (error) {
        console.error('Backend health check failed:', error);
        setBackendOnline(false);
    }
}

/**
 * Update the backend status indicator
 */
function setBackendOnline(isOnline) {
    if (isOnline) {
        elements.backendStatus.className = 'status-online';
        elements.backendStatusText.textContent = 'Conectado';
        elements.backendStatusText.classList.remove('text-red-400');
        elements.backendStatusText.classList.add('text-green-400');
    } else {
        elements.backendStatus.className = 'status-offline';
        elements.backendStatusText.textContent = 'Desconectado';
        elements.backendStatusText.classList.remove('text-green-400');
        elements.backendStatusText.classList.add('text-red-400');
    }
}

/**
 * Load dashboard data from the API
 */
async function loadDashboardData() {
    try {
        // Load API status
        const statusResponse = await window.HealthService.getStatus();
        if (statusResponse.success) {
            elements.apiVersion.textContent = statusResponse.version || '1.0';
        }
    } catch (error) {
        console.error('Failed to load API status:', error);
        elements.apiVersion.textContent = 'Error';
    }

    try {
        // Load patients
        const patientsResponse = await window.PatientService.getAll();
        if (patientsResponse.success) {
            const patients = patientsResponse.data;
            elements.patientCount.textContent = patients.length;
            renderPatientsList(patients);
        }
    } catch (error) {
        console.error('Failed to load patients:', error);
        elements.patientCount.textContent = '0';
        elements.patientsList.innerHTML = `
      <div class="flex items-center justify-center py-8 text-red-400">
        Error al cargar pacientes. ¿Está el backend activo?
      </div>
    `;
    }

    try {
        // Load sessions
        const sessionsResponse = await window.SessionService.getAll();
        if (sessionsResponse.success) {
            elements.sessionCount.textContent = sessionsResponse.data.length;
        }
    } catch (error) {
        console.error('Failed to load sessions:', error);
        elements.sessionCount.textContent = '0';
    }
}

/**
 * Render the patients list
 */
function renderPatientsList(patients) {
    if (!patients || patients.length === 0) {
        elements.patientsList.innerHTML = `
      <div class="flex items-center justify-center py-8 text-surface-500">
        No hay pacientes registrados
      </div>
    `;
        return;
    }

    elements.patientsList.innerHTML = patients.map(patient => `
    <div class="flex items-center gap-4 p-4 bg-surface-700/50 rounded-lg hover:bg-surface-700 transition-colors cursor-pointer">
      <div class="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold text-lg">
        ${patient.name.charAt(0).toUpperCase()}
      </div>
      <div class="flex-1">
        <div class="font-medium">${patient.name}</div>
        <div class="text-sm text-surface-400">Edad: ${patient.age || 'N/A'}</div>
      </div>
      <button class="btn-ghost p-2 rounded-lg">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  `).join('');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
