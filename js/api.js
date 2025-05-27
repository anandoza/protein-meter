// js/api.js

// --- Dependencies and Global Variables ---
// This function assumes certain global variables and functions are defined in the main script or other modules:
// Global Variables:
// - isScanning: (let) Boolean flag indicating if scanning is currently active. Used to prevent UI updates if scanning stopped mid-fetch.
// Functions from other modules:
// - updateUIWithScannedData(barcode, product): (from js/ui.js) Called on successful data fetch and processing.
// - updateUIWithScanError(barcode, errorMsg): (from js/ui.js) Called when API fetch or data processing fails.

/**
 * Fetches product data for a given barcode from the Open Food Facts API.
 * It constructs the API URL, makes an asynchronous request, and processes the response.
 * If successful and the product is found, it calls `updateUIWithScannedData`.
 * If any error occurs (network, HTTP error, product not found, or scan stopped mid-fetch),
 * it calls `updateUIWithScanError` or logs a message if the scan was stopped.
 *
 * @async
 * @param {string} barcode - The barcode of the product to fetch.
 * Assumes `isScanning` (global var), `updateUIWithScannedData` and `updateUIWithScanError` (global functions from js/ui.js) are available.
 */
async function fetchProductData(barcode) {
    // Record if scanning was active when the fetch operation started.
    // This helps prevent UI updates if the user cancels scanning while the request is in flight.
    const wasScanningWhenFetchStarted = isScanning; // isScanning should be a global let variable
    const apiUrl = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,generic_name,nutriments`;

    try {
        const response = await fetch(apiUrl);

        // If scanning was stopped while fetch was in progress, abort further processing.
        if (!isScanning && wasScanningWhenFetchStarted) {
            console.log("Scan stopped during fetch operation. Aborting UI update for barcode:", barcode);
            return; // Exit without updating UI
        }

        if (!response.ok) {
            // Handles HTTP errors like 404 (Not Found), 500 (Server Error), etc.
            throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // If scanning was stopped while parsing JSON, abort further processing.
        if (!isScanning && wasScanningWhenFetchStarted) {
            console.log("Scan stopped during JSON parsing. Aborting UI update for barcode:", barcode);
            return; // Exit without updating UI
        }

        if (data.status === 1 && data.product) {
            // Product found and data is available.
            // updateUIWithScannedData should be globally available from js/ui.js
            updateUIWithScannedData(barcode, data.product);
        } else {
            // Product not found or other API-specific issue (e.g., data.status === 0).
            throw new Error(data.status_verbose || 'Product not found or API error.');
        }
    } catch (error) {
        console.error("Error fetching/processing product data for barcode:", barcode, error);

        // If scanning was stopped during error handling, abort further processing.
        if (!isScanning && wasScanningWhenFetchStarted) {
            console.log("Scan stopped during error handling. Aborting UI update for barcode:", barcode);
            return; // Exit without updating UI
        }
        // Call UI update function to display the error.
        // updateUIWithScanError should be globally available from js/ui.js
        updateUIWithScanError(barcode, error.message);
    }
}
