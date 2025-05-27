// js/ui.js

// DOM Element and Global Variable Dependencies:
// These functions assume certain DOM elements and global variables are defined in the main script.
// DOM Elements: manualEntryFormDiv, resultsArea, readerElement, statusMessage, productInfoDiv,
// errorMessageSpan, entryForm, manualNameInput, productNameSpan, proteinGramsSpan,
// energyKcalSpan, proteinBar, proteinLabel, unitLabels, barcodeResultSpan, offLink, barcodeRow,
// scanBarcodeBtn, manualEntryBtn, stopScanBtn.
// Global Variables: isScanning (let), lastScannedBarcode (let), html5QrCode (let for stopScanning).
// Functions from other modules: stopScanning() (if not part of this file), getProteinInfo(), addToHistory().
// Note: `stopScanning` is closely tied to UI buttons, so it might be better here or in a dedicated scanner module.
// For this exercise, we assume `stopScanning` is available globally if not moved here.

/**
 * @typedef {object} ProteinInfoData
 * @property {string} actualPercentage - Actual protein percentage (e.g., "25.3").
 * @property {string} displayPercentage - Protein percentage for display, capped (e.g., "25.3").
 * @property {string} colorClass - Tailwind CSS class for the item's color coding.
 * @property {string} fadedColorClass - Tailwind CSS class for a faded version of the item's color.
 * @property {string} label - Descriptive label for the protein level (e.g., "Good").
 */

/**
 * @typedef {object} DisplayData
 * @property {string} productName - Name of the product.
 * @property {ProteinInfoData} proteinInfo - Object containing protein percentage info and UI classes.
 * @property {string} proteinGrams - Protein grams (e.g., "10.5" or "N/A").
 * @property {string} energyKcal - Energy in kcal (e.g., "200" or "N/A").
 * @property {string|null} barcode - The barcode of the item, or null.
 * @property {string|null} calculationError - Any error message from calculation, or null.
 * @property {boolean} isManual - True if the entry was manual.
 */

/**
 * Configures the UI for the active scanning mode.
 * Hides manual entry form, shows results area and scanner element.
 * Updates status messages and clears previous error messages.
 * Manages visibility of scan/manual/stop buttons.
 * Assumes relevant DOM elements are globally available.
 */
function showScannerUI() {
    manualEntryFormDiv.classList.add('hidden');
    resultsArea.classList.remove('hidden');
    readerElement.classList.remove('inactive'); // Make scanner box visible
    statusMessage.textContent = 'Starting scanner...';
    productInfoDiv.classList.add('hidden'); // Hide previous product info
    errorMessageSpan.textContent = '';

    scanBarcodeBtn.classList.add('hidden');
    manualEntryBtn.classList.add('hidden');
    stopScanBtn.classList.remove('hidden');
}

/**
 * Configures the UI for manual data entry mode.
 * Stops active scanning session if one exists by calling `stopScanning()`.
 * Shows the manual entry form, hides scanner and results area.
 * Resets the form and focuses on the product name input.
 * Manages visibility of scan/manual/stop buttons.
 * Assumes relevant DOM elements and `stopScanning` function are globally available.
 */
function showManualEntryUI() {
    if (isScanning) { // isScanning should be a global let variable
        stopScanning(); // stopScanning should handle html5QrCode and isScanning state
    }
    manualEntryFormDiv.classList.remove('hidden');
    resultsArea.classList.add('hidden'); // Hide results area while manually inputting
    readerElement.classList.add('inactive'); // Ensure scanner box is hidden
    statusMessage.textContent = 'Enter product details manually.';
    entryForm.reset(); // Clear previous manual inputs
    manualEntryError.classList.add('hidden'); // Hide previous manual entry errors
    manualNameInput.focus(); // Focus on the name input for better UX

    scanBarcodeBtn.classList.remove('hidden');
    manualEntryBtn.classList.remove('hidden');
    stopScanBtn.classList.add('hidden');
}

/**
 * Configures the UI for the initial or idle state.
 * Hides manual entry form and scanner, shows results area with an initial message.
 * Clears previous product info and error messages.
 * Manages visibility of scan/manual/stop buttons.
 * Assumes relevant DOM elements are globally available.
 */
function showIdleUI() {
    manualEntryFormDiv.classList.add('hidden');
    resultsArea.classList.remove('hidden');
    readerElement.classList.add('inactive'); // Keep scanner box hidden
    statusMessage.textContent = 'Click "Scan Barcode" or "Manual Entry".';
    productInfoDiv.classList.add('hidden'); // Hide previous product info
    errorMessageSpan.textContent = '';

    scanBarcodeBtn.classList.remove('hidden');
    manualEntryBtn.classList.remove('hidden');
    stopScanBtn.classList.add('hidden');
}

/**
 * Updates the main results display area (#product-info) with processed data.
 * Populates product name, protein grams, calories, barcode, and the protein percentage bar.
 * Handles visibility of barcode information and error messages.
 * @param {DisplayData} data - The data object to display. Contains productName, proteinInfo,
 * proteinGrams, energyKcal, barcode, calculationError, isManual.
 * Assumes relevant DOM elements and `isScanning` (global var) are globally available.
 */
function updateUICurrentResult(data) {
    productNameSpan.textContent = data.productName || 'N/A';
    // Ensure "N/A" is displayed if values are not just falsy but explicitly "N/A"
    proteinGramsSpan.textContent = data.proteinGrams === 'N/A' ? 'N/A' : (data.proteinGrams || 'N/A');
    energyKcalSpan.textContent = data.energyKcal === 'N/A' ? 'N/A' : (data.energyKcal || 'N/A');

    const pInfo = data.proteinInfo || {};
    proteinBar.style.width = `${pInfo.displayPercentage || 0}%`;
    proteinBar.textContent = `${pInfo.actualPercentage || '0.0'}%`;
    proteinBar.className = 'percentage-bar-fill'; // Reset classes
    proteinBar.classList.add(pInfo.colorClass || 'bg-gray-400'); // Default color
    proteinLabel.textContent = pInfo.label || 'N/A';

    const unitText = data.isManual ? '/ serving' : '/ 100g';
    unitLabels.forEach(label => label.textContent = unitText);

    if (data.barcode) {
        barcodeResultSpan.textContent = data.barcode;
        offLink.href = `https://world.openfoodfacts.org/product/${data.barcode}`;
        offLink.classList.remove('hidden');
        barcodeRow.classList.remove('hidden');
    } else {
        barcodeResultSpan.textContent = '';
        offLink.classList.add('hidden');
        barcodeRow.classList.add('hidden');
    }

    errorMessageSpan.textContent = data.calculationError || '';
    statusMessage.textContent = data.calculationError ? 'Product data processed, calculation incomplete.' : 'Product data processed.';
    // Add "Scan stopped." if it was a scan, and the scan process is no longer active.
    // This check ensures "Scan stopped." isn't appended after manual entry or if scanning is somehow still active.
    if (!data.isManual && !isScanning) {
        statusMessage.textContent += ' Scan stopped.';
    }

    productInfoDiv.classList.remove('hidden');
    resultsArea.classList.remove('hidden'); // Ensure results area is visible
}

/**
 * Resets the UI to its initial idle state by calling `showIdleUI`.
 * This is a convenience function.
 * Assumes `showIdleUI` function is globally available.
 */
function resetUI() {
    showIdleUI();
}

/**
 * Processes product data obtained from a barcode scan, calculates protein percentage,
 * updates the UI with this information, adds valid entries to history, and stops scanning.
 * @param {string} barcode - The scanned barcode.
 * @param {object} product - The product data object from Open Food Facts API.
 *                           Expected to have `nutriments`, `product_name`, `generic_name`.
 * Assumes `getProteinInfo`, `updateUICurrentResult`, `addToHistory`, `stopScanning`
 * functions are globally available.
 */
function updateUIWithScannedData(barcode, product) {
    const nutriments = product.nutriments || {};
    const productName = product.product_name || product.generic_name || 'N/A';
    // Ensure values are numbers, default to NaN if not parseable, for clearer error handling
    const protein100g = parseFloat(nutriments.proteins_100g);
    const energyKcal100g = parseFloat(nutriments['energy-kcal_100g']);

    let percentage = NaN, calculationError = null;
    if (!isNaN(protein100g) && protein100g >= 0 && !isNaN(energyKcal100g) && energyKcal100g > 0) {
        percentage = (protein100g * 4 / energyKcal100g) * 100;
    } else {
         let missing = [];
         if (isNaN(protein100g) || protein100g < 0) missing.push("protein");
         if (isNaN(energyKcal100g) || energyKcal100g <= 0) missing.push("calories");
         calculationError = `Missing/invalid ${missing.join(' & ')} data.`;
    }
    // getProteinInfo should robustly handle NaN percentage
    const proteinInfo = getProteinInfo(percentage);

    const displayData = {
         productName: productName,
         proteinInfo: proteinInfo,
         proteinGrams: (isNaN(protein100g) || protein100g < 0) ? 'N/A' : protein100g.toFixed(1),
         energyKcal: (isNaN(energyKcal100g) || energyKcal100g <= 0) ? 'N/A' : energyKcal100g.toFixed(0),
         barcode: barcode,
         calculationError: calculationError,
         isManual: false
    };

    updateUICurrentResult(displayData);

    // Add to history only if data is substantially valid (label implies calculation success)
    if (!calculationError && proteinInfo.label !== 'N/A') {
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
             errorMessage: displayData.calculationError, // Will be null if no error
             isManual: displayData.isManual
        };
         addToHistory(historyItem);
    } else {
        console.log("Scanned entry with errors or N/A label not added to history:", displayData);
    }
    stopScanning(); // Stop scanning after processing
}

/**
 * Updates the status message in the UI to reflect a scan error.
 * Also resets `lastScannedBarcode` to allow trying the same barcode again.
 * @param {string} barcode - The barcode that resulted in an error (can be null if error before barcode decode).
 * @param {string} errorMsg - The error message to display.
 * Assumes `statusMessage` DOM element and `lastScannedBarcode` (let global var) are available.
 */
function updateUIWithScanError(barcode, errorMsg) {
    // statusMessage might not be defined if error occurs very early. Check for it.
    if (typeof statusMessage !== 'undefined' && statusMessage) {
        statusMessage.textContent = `Scan Error: ${errorMsg}. Trying again...`;
    } else {
        console.error("statusMessage DOM element not found for error:", errorMsg);
    }
    lastScannedBarcode = null; // Reset to allow re-scanning the same barcode
}
