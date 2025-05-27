// js/app.js

// --- Dependencies and Global Variables ---
// This file assumes that various DOM elements and global variables/functions are available,
// having been defined in index.html (for DOM elements) or loaded from other JS files (utils, history, ui, scanner, api).
// DOM Elements:
// - manualEntryError, manualNameInput, manualCaloriesInput, manualProteinInput,
// - manualEntryFormDiv, resultsArea, installPwaBtn, scanBarcodeBtn, stopScanBtn,
// - manualEntryBtn, cancelManualEntryBtn, entryForm, clearAllBtn, manageHistoryBtn.
// Global Variables (expected to be declared in index.html <script> block):
// - deferredPrompt (let, for PWA install)
// - html5QrCode, isScanning, lastScannedBarcode (managed by js/scanner.js)
// - scanHistory, isDeletingHistoryMode (managed by js/history.js)
// Functions from other modules:
// - getProteinInfo (js/utils.js)
// - updateUICurrentResult, showManualEntryUI, showIdleUI, resetUI (js/ui.js)
// - addToHistory, loadHistory, clearAllHistory, toggleDeleteMode (js/history.js)
// - initializeScanner, startScanning, stopScanning (js/scanner.js)

/**
 * Handles the submission of the manual entry form.
 * It reads values for product name, calories, and protein, validates them,
 * calculates the protein percentage, updates the UI with the result,
 * and adds the entry to the scan history if valid.
 * @param {Event} event - The form submission event object.
 */
function handleManualEntrySubmit(event) {
    event.preventDefault(); // Prevent default form submission

    // Ensure DOM elements are defined before using them.
    if (manualEntryError) manualEntryError.classList.add('hidden');

    const name = manualNameInput ? manualNameInput.value.trim() : '';
    const calories = manualCaloriesInput ? parseFloat(manualCaloriesInput.value) : NaN;
    const protein = manualProteinInput ? parseFloat(manualProteinInput.value) : NaN;

    if (isNaN(calories) || calories <= 0 || isNaN(protein) || protein < 0) {
        if (manualEntryError) {
            manualEntryError.textContent = 'Please enter valid positive numbers for calories and protein (protein can be 0).';
            manualEntryError.classList.remove('hidden');
        }
        return;
    }

    const caloriesFromProtein = protein * 4;
    const percentage = (caloriesFromProtein / calories) * 100;
    const proteinInfo = getProteinInfo(percentage); // From js/utils.js

    const displayData = {
         productName: name || 'Manual Entry',
         proteinInfo: proteinInfo,
         proteinGrams: protein.toFixed(1),
         energyKcal: calories.toFixed(0),
         barcode: null,
         calculationError: null,
         isManual: true
    };

    updateUICurrentResult(displayData); // From js/ui.js

    if (proteinInfo.label !== 'N/A') {
         const historyItem = {
             barcode: displayData.barcode,
             productName: displayData.productName,
             proteinActualPercentage: proteinInfo.actualPercentage,
             proteinDisplayPercentage: proteinInfo.displayPercentage,
             proteinLabel: proteinInfo.label,
             colorClass: proteinInfo.colorClass,
             fadedColorClass: proteinInfo.fadedColorClass,
             proteinGrams: displayData.proteinGrams,
             energyKcal: displayData.energyKcal,
             timestamp: new Date().toISOString(),
             errorMessage: displayData.calculationError,
             isManual: displayData.isManual
        };
         addToHistory(historyItem); // From js/history.js
    } else {
        console.log("Manual entry with N/A label (likely due to invalid calculation) not added to history:", displayData);
    }

    if (manualEntryFormDiv) manualEntryFormDiv.classList.add('hidden');
    if (resultsArea) resultsArea.classList.remove('hidden');
}

/**
 * Registers the service worker for PWA functionality.
 * Logs success or failure of the registration to the console.
 * The service worker is expected to be at './service-worker.js' relative to the site origin.
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { // Use window.load to ensure page is fully loaded
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  } else {
    console.log('Service workers are not supported in this browser.');
  }
}

/**
 * Sets up the PWA installation button logic.
 * It listens for the `beforeinstallprompt` event to enable the install button,
 * and handles the button click to trigger the install prompt.
 * Also listens for the `appinstalled` event to hide the button after installation.
 * Assumes `installPwaBtn` (DOM element) and `deferredPrompt` (global let variable, declared in index.html) are available.
 */
function setupInstallButton() {
    // deferredPrompt is expected to be a 'let' variable declared in the global scope (e.g., in index.html's script tag)
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e; // Store the event
        if (installPwaBtn) installPwaBtn.classList.remove('hidden'); // Show the install button
        console.log('`beforeinstallprompt` event was fired.');
    });

    if (installPwaBtn) {
        installPwaBtn.addEventListener('click', async () => {
            installPwaBtn.classList.add('hidden'); // Hide the button once clicked
            if (!deferredPrompt) {
                console.log("Install prompt event not available (deferredPrompt is null). User might have already installed or dismissed.");
                return;
            }
            deferredPrompt.prompt(); // Show the install prompt
            try {
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
            } catch (error) {
                console.error("Error during PWA install prompt:", error);
            }
            deferredPrompt = null; // Clear the deferred prompt, it can only be used once
        });
    }

    window.addEventListener('appinstalled', () => {
        if (installPwaBtn) installPwaBtn.classList.add('hidden'); // Hide the install button if app is installed
        deferredPrompt = null; // Clear the deferred prompt
        console.log('PWA was installed successfully.');
    });
}

/**
 * Initializes the application.
 * This function should be called when the DOM is fully loaded.
 * It sets up the scanner, loads history, resets the UI, registers PWA features,
 * and attaches all necessary event listeners to DOM elements.
 * Assumes all function dependencies from other modules (utils, history, ui, scanner, api)
 * and required DOM elements are loaded and available globally.
 */
function initializeApp() {
    // Initial setup calls
    initializeScanner(); // From js/scanner.js
    loadHistory();       // From js/history.js
    resetUI();           // From js/ui.js
    registerServiceWorker(); // From this file (js/app.js)
    setupInstallButton();    // From this file (js/app.js)

    /**
     * Sets up all primary event listeners for the application.
     * This includes buttons for scanning, manual entry, stopping scans,
     * form submissions, and history management.
     * Ensures that DOM elements are present before attaching listeners to prevent errors.
     */
    // Attach event listeners only if the respective elements exist to avoid errors if DOM structure changes.
    if (scanBarcodeBtn) scanBarcodeBtn.addEventListener('click', startScanning);
    if (stopScanBtn) stopScanBtn.addEventListener('click', stopScanning);
    if (manualEntryBtn) manualEntryBtn.addEventListener('click', showManualEntryUI);
    if (cancelManualEntryBtn) cancelManualEntryBtn.addEventListener('click', showIdleUI);
    if (entryForm) entryForm.addEventListener('submit', handleManualEntrySubmit);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllHistory);
    if (manageHistoryBtn) manageHistoryBtn.addEventListener('click', toggleDeleteMode);

    console.log("Application initialized and event listeners set up.");
}
