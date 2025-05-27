// js/scanner.js

// --- Dependencies and Global Variables ---
// These functions assume certain global variables and functions are defined in the main script or other modules:
// Global Variables:
// - html5QrCode: (let) The Html5Qrcode instance. Initialized by `initializeScanner`.
// - isScanning: (let) Boolean flag indicating if scanning is currently active.
// - lastScannedBarcode: (let) Stores the last successfully scanned barcode to prevent immediate re-scans.
// DOM Elements (used by startScanning/stopScanning indirectly via UI functions or directly):
// - readerElement: The DOM element where the scanner video feed is rendered. (ID: "reader")
// - scanBarcodeBtn, manualEntryBtn, stopScanBtn: Buttons for controlling scan/manual entry modes.
// - statusMessage: DOM element for displaying status messages to the user.
// - errorMessageSpan: DOM element for displaying error messages.
// Functions from other modules:
// - showScannerUI(): (from js/ui.js) Updates UI for scanning mode.
// - fetchProductData(decodedText): (from js/api.js or main script) Fetches product data.
// - updateUIWithScanError(barcode, errorMsg): (from js/ui.js) Updates UI with scan error.

/**
 * Initializes the `html5QrCode` instance if it hasn't been created yet.
 * The instance is stored in the global `html5QrCode` variable.
 * Relies on `Html5Qrcode` library being loaded and a DOM element with ID "reader".
 */
function initializeScanner() {
    if (!html5QrCode) { // html5QrCode should be a global 'let' variable declared in the main script
        try {
            html5QrCode = new Html5Qrcode("reader");
        } catch (e) {
            console.error("Failed to initialize Html5Qrcode. Ensure #reader element exists and library is loaded.", e);
            if (typeof statusMessage !== 'undefined' && statusMessage) { // Check if statusMessage is defined
                statusMessage.textContent = "Scanner library failed to load. Please refresh.";
            }
        }
    }
}

/**
 * Callback function executed upon successful barcode decoding by the html5-qrcode library.
 * If scanning is active and the decoded text is a new barcode, it updates the status message
 * and initiates fetching of product data by calling `fetchProductData`.
 * @param {string} decodedText - The decoded string from the barcode.
 * @param {object} decodedResult - Detailed information about the decoded result from the library.
 * Assumes `isScanning`, `lastScannedBarcode` (global vars), `statusMessage`, `errorMessageSpan` (DOM elements),
 * and `fetchProductData` (global function from js/api.js or main script) are available.
 */
function qrCodeSuccessCallback(decodedText, decodedResult) {
    if (isScanning && decodedText && decodedText !== lastScannedBarcode) {
        lastScannedBarcode = decodedText; // Prevent re-processing the same barcode immediately
        if (typeof statusMessage !== 'undefined' && statusMessage) {
            statusMessage.textContent = `Barcode detected: ${decodedText}. Fetching data...`;
        }
        if (typeof errorMessageSpan !== 'undefined' && errorMessageSpan) {
            errorMessageSpan.textContent = ''; // Clear previous errors
        }
        fetchProductData(decodedText); // This function needs to be globally available
    } else if (isScanning && decodedText === lastScannedBarcode) {
        // Optionally, provide feedback or just log that it's a duplicate in short succession
        console.log("Already processing barcode:", decodedText);
    }
}

/**
 * Callback function executed when the html5-qrcode library encounters an error during scanning.
 * Currently, it's a placeholder and logs very little to avoid console noise, as "errors"
 * are frequent when no barcode is in view.
 * TODO: Potentially implement more robust user-facing error handling for persistent errors.
 * @param {string} errorMessage - The error message provided by the scanning library.
 */
function qrCodeErrorCallback(errorMessage) {
    // console.warn(`Code scan error = ${errorMessage}`); // Original, can be very noisy
    // Most "errors" are just the library failing to find/decode a QR code in a frame.
    // Only log significant or unexpected errors.
    // Example: if (errorMessage && !errorMessage.toLowerCase().includes("notfoundexception")) {
    // console.warn("Scanner Error:", errorMessage);
    // }
}

/**
 * Initiates the barcode scanning process.
 * It ensures the scanner is initialized (by calling `initializeScanner`),
 * updates the UI to scanning mode (by calling `showScannerUI`),
 * and starts the camera using `html5QrCode.start()`.
 * Handles errors during scanner startup and updates UI accordingly.
 * Assumes `isScanning`, `html5QrCode`, `lastScannedBarcode` (global vars),
 * `initializeScanner` (this file), `showScannerUI` (from js/ui.js),
 * `qrCodeSuccessCallback`, `qrCodeErrorCallback` (this file),
 * and relevant DOM elements (`readerElement`, `scanBarcodeBtn`, `manualEntryBtn`, `stopScanBtn`, `statusMessage`) are available.
 */
function startScanning() {
    if (isScanning) {
        console.log("Scan already in progress.");
        return;
    }

    if (!html5QrCode) {
        initializeScanner();
        if (!html5QrCode) { // If initialization failed
            console.error("Scanner not available after initialization attempt.");
            if (typeof statusMessage !== 'undefined' && statusMessage) {
                statusMessage.textContent = "Scanner is not available. Please refresh or check permissions.";
            }
            return;
        }
    }

    showScannerUI(); // Updates button visibility and UI state

    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0, // Using a square aspect ratio
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    };
    const cameraConfig = { facingMode: "environment" };

    html5QrCode.start(cameraConfig, config, qrCodeSuccessCallback, qrCodeErrorCallback)
        .then(() => {
            isScanning = true;
            lastScannedBarcode = null;
            if (typeof statusMessage !== 'undefined' && statusMessage) {
                statusMessage.textContent = 'Scanning... Point camera at a barcode.';
            }
            console.log("Scanner started successfully.");
        })
        .catch(err => {
            console.error(`Unable to start scanning: ${err}`);
            if (typeof statusMessage !== 'undefined' && statusMessage) {
                statusMessage.textContent = `Error starting scanner: ${err}. Check permissions & HTTPS.`;
            }
            isScanning = false; // Reset scanning state
            // Attempt to reset UI to a non-scanning state, similar to showIdleUI or parts of stopScanning
            if (typeof readerElement !== 'undefined' && readerElement) readerElement.classList.add('inactive');
            if (typeof scanBarcodeBtn !== 'undefined' && scanBarcodeBtn) scanBarcodeBtn.classList.remove('hidden');
            if (typeof manualEntryBtn !== 'undefined' && manualEntryBtn) manualEntryBtn.classList.remove('hidden');
            if (typeof stopScanBtn !== 'undefined' && stopScanBtn) stopScanBtn.classList.add('hidden');
        });
}

/**
 * Stops the barcode scanning process.
 * Updates the `isScanning` state, modifies UI elements (buttons, reader visibility, status message)
 * to reflect that scanning has stopped, and calls `html5QrCode.stop()`
 * to release camera resources. Clears the reader element's content.
 * Assumes `isScanning`, `html5QrCode`, `lastScannedBarcode` (global vars),
 * and relevant DOM elements (`readerElement`, `scanBarcodeBtn`, `manualEntryBtn`, `stopScanBtn`, `statusMessage`) are available.
 */
function stopScanning() {
    const wasScanningLib = html5QrCode && typeof html5QrCode.isScanning === 'boolean' ? html5QrCode.isScanning : (typeof html5QrCode_isScanning === 'boolean' ? html5QrCode_isScanning : false);

    if (!isScanning && !wasScanningLib) {
        console.log("StopScanning called but already stopped or not initialized.");
        // Ensure UI is in a consistent stopped state anyway
        isScanning = false; // Ensure our flag is false
        if (typeof scanBarcodeBtn !== 'undefined' && scanBarcodeBtn) scanBarcodeBtn.classList.remove('hidden');
        if (typeof manualEntryBtn !== 'undefined' && manualEntryBtn) manualEntryBtn.classList.remove('hidden');
        if (typeof stopScanBtn !== 'undefined' && stopScanBtn) stopScanBtn.classList.add('hidden');
        if (typeof readerElement !== 'undefined' && readerElement) {
            readerElement.classList.add('inactive');
            readerElement.innerHTML = ''; // Clear any leftover UI in the reader
        }
        lastScannedBarcode = null;
        return;
    }

    isScanning = false; // Set our application's scanning state to false

    // Update UI buttons and reader visibility
    if (typeof scanBarcodeBtn !== 'undefined' && scanBarcodeBtn) scanBarcodeBtn.classList.remove('hidden');
    if (typeof manualEntryBtn !== 'undefined' && manualEntryBtn) manualEntryBtn.classList.remove('hidden');
    if (typeof stopScanBtn !== 'undefined' && stopScanBtn) stopScanBtn.classList.add('hidden');
    if (typeof readerElement !== 'undefined' && readerElement) readerElement.classList.add('inactive');

    // Update status message if it was actively scanning or starting
    if (typeof statusMessage !== 'undefined' && statusMessage &&
        (statusMessage.textContent.includes('Scanning...') || statusMessage.textContent.includes('Starting scanner...'))) {
        statusMessage.textContent = 'Scanner stopped.';
    }

    if (html5QrCode && typeof html5QrCode.stop === 'function' && wasScanningLib) {
        html5QrCode.stop()
            .then(() => {
                console.log("Scanner stopped successfully via library call.");
            })
            .catch(err => {
                console.error(`Error stopping scanner via library: ${err}`);
            })
            .finally(() => {
                if (typeof readerElement !== 'undefined' && readerElement) {
                    readerElement.innerHTML = ''; // Clear the reader element
                }
                lastScannedBarcode = null;
            });
    } else {
        // If library instance issues or it says it's not scanning, still clean up our side
        if (typeof readerElement !== 'undefined' && readerElement) {
            readerElement.innerHTML = '';
        }
        lastScannedBarcode = null;
        if (wasScanningLib) { // Only log this if the library thought it was scanning but we had issues calling stop
            console.warn("html5QrCode.stop() was not callable or library reported not scanning.");
        }
    }
}
