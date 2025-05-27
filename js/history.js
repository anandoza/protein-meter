// js/history.js

// --- Constants and Global Variables (used by history functions) ---
// These are expected to be defined in the main script (e.g., index.html <script>)
// and accessible globally where these functions are called.
// const HISTORY_STORAGE_KEY = 'proteinMeterHistory';
// let scanHistory = [];
// let isDeletingHistoryMode = false;
//
// DOM elements these functions interact with:
// const historyList = document.getElementById('history-list');
// const noHistoryMessage = document.getElementById('no-history-message');
// const manageHistoryBtn = document.getElementById('manage-history-btn');
// const clearAllBtn = document.getElementById('clear-all-btn');

/**
 * @typedef {object} HistoryItem
 * @property {string|null} barcode - The barcode of the scanned item, or null for manual entries.
 * @property {string} productName - Name of the product or "Manual Entry".
 * @property {string} proteinActualPercentage - Actual protein percentage (e.g., "25.3").
 * @property {string} proteinDisplayPercentage - Protein percentage for display, capped (e.g., "25.3").
 * @property {string} proteinLabel - Descriptive label for the protein level (e.g., "Good").
 * @property {string} colorClass - Tailwind CSS class for the item's color coding.
 * @property {string} fadedColorClass - Tailwind CSS class for a faded version of the item's color.
 * @property {string} proteinGrams - Protein grams (e.g., "10.5").
 * @property {string} energyKcal - Energy in kcal (e.g., "200").
 * @property {string} timestamp - ISO string of when the item was added.
 * @property {string|null} errorMessage - Any error message associated with the item, or null.
 * @property {boolean} isManual - True if the entry was manual, false otherwise.
 */

/**
 * Loads scan history from localStorage into the global `scanHistory` array
 * and then calls `renderHistory` to update the UI.
 * Assumes `HISTORY_STORAGE_KEY`, `scanHistory` (let), and `renderHistory` are globally available.
 */
function loadHistory() {
    const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    scanHistory = storedHistory ? JSON.parse(storedHistory) : [];
    renderHistory();
}

/**
 * Saves the current `scanHistory` array to localStorage.
 * Updates the enabled state of the 'Manage History' button and the
 * visibility of the 'No history yet.' message based on whether the history is empty.
 * Assumes `HISTORY_STORAGE_KEY`, `scanHistory`, `manageHistoryBtn`, and `noHistoryMessage` are globally available.
 */
function saveHistory() {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(scanHistory));
    manageHistoryBtn.disabled = scanHistory.length === 0;
    noHistoryMessage.style.display = scanHistory.length === 0 ? 'block' : 'none';
}

/**
 * Adds a new item to the `scanHistory` array.
 * Prevents adding an exact duplicate of the most recent entry.
 * After adding, it saves the history and re-renders the history list.
 * Assumes `scanHistory`, `saveHistory`, and `renderHistory` are globally available.
 * @param {HistoryItem} item - The history item object to add.
 */
function addToHistory(item) {
    if (scanHistory.length > 0) {
        const mostRecentEntry = scanHistory[0];
        // Basic check for exact consecutive duplicates
        if (item.barcode === mostRecentEntry.barcode &&
            item.productName === mostRecentEntry.productName &&
            item.proteinGrams === mostRecentEntry.proteinGrams &&
            item.energyKcal === mostRecentEntry.energyKcal &&
            item.isManual === mostRecentEntry.isManual &&
            item.proteinActualPercentage === mostRecentEntry.proteinActualPercentage
            ) {
            console.log("Duplicate consecutive entry prevented:", item);
            return;
        }
    }
    scanHistory.unshift(item); // Add new item to the beginning of the array
    saveHistory();
    renderHistory();
}

/**
 * Deletes a history item from the `scanHistory` array based on its timestamp.
 * After deletion, it saves the history and re-renders the history list.
 * Assumes `scanHistory`, `saveHistory`, and `renderHistory` are globally available.
 * @param {string} itemTimestamp - The ISO timestamp string of the item to delete.
 */
function deleteHistoryItem(itemTimestamp) {
    scanHistory = scanHistory.filter(item => item.timestamp !== itemTimestamp);
    saveHistory();
    renderHistory();
}

/**
 * Toggles the 'deleting history' mode.
 * Updates the text of the 'Manage History' button ('Manage History' vs 'Done').
 * Shows/hides the 'Clear All' button based on the mode and if history is present.
 * Re-renders the history list to show/hide delete buttons on items.
 * Assumes `isDeletingHistoryMode` (let), `manageHistoryBtn`, `clearAllBtn`, `scanHistory`, and `renderHistory` are globally available.
 */
function toggleDeleteMode() {
    isDeletingHistoryMode = !isDeletingHistoryMode;
    manageHistoryBtn.textContent = isDeletingHistoryMode ? 'Done' : 'Manage History';
    if (isDeletingHistoryMode && scanHistory.length > 0) {
        clearAllBtn.classList.remove('hidden');
    } else {
        clearAllBtn.classList.add('hidden');
    }
    renderHistory(); // Re-render to show/hide delete icons
}

/**
 * Prompts the user for confirmation before clearing all items from `scanHistory`.
 * If confirmed, it clears the array, saves the history, and re-renders the list.
 * Assumes `scanHistory`, `saveHistory`, `renderHistory`, `isDeletingHistoryMode` and `toggleDeleteMode` are globally available.
 */
function clearAllHistory() {
    if (confirm("Are you sure you want to clear the entire history?")) {
        scanHistory = [];
        saveHistory();
        renderHistory();
        // If we were in delete mode, toggle it off as there's nothing to manage.
        if (isDeletingHistoryMode) {
            toggleDeleteMode(); // This will handle button states and re-render if needed
        }
    }
}

/**
 * Re-renders the entire history list in the DOM.
 * It clears the current list, then for each item in `scanHistory`,
 * creates a history card and appends it. Manages the visibility of the
 * "no history" message and the "Clear All" button.
 * Assumes `historyList`, `noHistoryMessage`, `manageHistoryBtn`, `clearAllBtn`, `scanHistory`,
 * `isDeletingHistoryMode`, `createHistoryCard`, and `toggleDeleteMode` (indirectly, if history becomes empty)
 * are globally available.
 */
function renderHistory() {
    historyList.innerHTML = ''; // Clear existing items

    if (scanHistory.length === 0) {
        historyList.appendChild(noHistoryMessage); // Assumes noHistoryMessage is a DOM element
        noHistoryMessage.style.display = 'block';
        manageHistoryBtn.disabled = true;
        clearAllBtn.classList.add('hidden');
        // If deleting mode is active and history becomes empty, ensure it's turned off.
        if (isDeletingHistoryMode) {
            // Directly update mode and button text to avoid re-render loop if toggleDeleteMode calls renderHistory.
            isDeletingHistoryMode = false;
            manageHistoryBtn.textContent = 'Manage History';
            // No need to call renderHistory() again from here if this is the end of its execution path.
        }
        return;
    }

    noHistoryMessage.style.display = 'none';
    manageHistoryBtn.disabled = false;

    if (isDeletingHistoryMode && scanHistory.length > 0) { // Check length again for safety
        clearAllBtn.classList.remove('hidden');
    } else {
        clearAllBtn.classList.add('hidden');
    }

    scanHistory.forEach(item => {
        const historyCardElement = createHistoryCard(item); // Renamed to avoid conflict
        historyList.appendChild(historyCardElement);
    });
}

/**
 * Creates and returns a DOM element representing a single history item card.
 * The card includes a summary view and an expandable detailed view.
 * If `isDeletingHistoryMode` is true, a delete button is added to the card.
 * Assumes `isDeletingHistoryMode` and `deleteHistoryItem` are globally available.
 * @param {HistoryItem} item - The history item data to build the card from.
 * @returns {HTMLElement} The created div element for the history card.
 */
function createHistoryCard(item) {
    const card = document.createElement('div');
    // Ensure item.fadedColorClass is defined or provide a default.
    card.className = `history-card ${item.fadedColorClass || 'bg-fade-gray-400'}`;
    if (isDeletingHistoryMode) {
       card.classList.add('deleting-mode');
    }

    const summaryWrapper = document.createElement('div');
    summaryWrapper.className = 'history-summary-wrapper';

    const summary = document.createElement('div');
    summary.className = 'history-summary';

    const productNameSummary = document.createElement('span');
    productNameSummary.className = 'font-medium text-sm truncate product-name-summary pr-2';
    productNameSummary.textContent = item.productName || (item.isManual ? 'Manual Entry' : 'N/A');

    const proteinSummary = document.createElement('span');
    proteinSummary.className = 'text-xs font-semibold whitespace-nowrap';
    proteinSummary.textContent = `${item.proteinActualPercentage || '0.0'}% ${item.proteinLabel || ''}`;

    summary.appendChild(productNameSummary);
    summary.appendChild(proteinSummary);

    summary.onclick = () => {
       if (!isDeletingHistoryMode) {
           card.classList.toggle('expanded');
       }
    };
    summaryWrapper.appendChild(summary);

    const details = document.createElement('div');
    details.className = 'history-details text-xs space-y-1';
    const unitLabel = item.isManual ? '/ serving' : '/ 100g';

    const detailsProductName = document.createElement('p');
    detailsProductName.className = 'history-item-name-details';
    detailsProductName.textContent = item.productName || (item.isManual ? 'Manual Entry' : 'N/A');
    details.appendChild(detailsProductName);

    const proteinBarHTML = `
        <div class="flex items-center space-x-2">
            <strong class="font-medium text-gray-700 w-20 inline-block shrink-0">Protein %:</strong>
            <div class="percentage-bar-container flex-grow" style="height: 16px;">
                <div class="percentage-bar-fill ${item.colorClass || 'bg-gray-400'}" style="width: ${item.proteinDisplayPercentage || '0'}%; line-height: 16px; font-size: 0.65rem;">${item.proteinActualPercentage || '0.0'}%</div>
            </div>
            <span class="font-medium text-gray-600 w-14 text-right shrink-0">${item.proteinLabel || ''}</span>
        </div>`;
    details.insertAdjacentHTML('beforeend', proteinBarHTML);

    if (item.barcode) {
        const barcodeP = document.createElement('p');
        barcodeP.innerHTML = `<strong class="font-medium text-gray-700 w-20 inline-block">Barcode:</strong><span class="text-gray-600 mr-1">${item.barcode}</span><a href="https://world.openfoodfacts.org/product/${item.barcode}" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 hover:underline">[View]</a>`;
        details.appendChild(barcodeP);
    }

    const proteinP = document.createElement('p');
    proteinP.innerHTML = `<strong class="font-medium text-gray-700 w-20 inline-block">Protein:</strong> <span class="text-gray-600">${item.proteinGrams || 'N/A'} ${unitLabel}</span>`;
    details.appendChild(proteinP);

    const caloriesP = document.createElement('p');
    caloriesP.innerHTML = `<strong class="font-medium text-gray-700 w-20 inline-block">Calories:</strong> <span class="text-gray-600">${item.energyKcal || 'N/A'} kcal ${unitLabel}</span>`;
    details.appendChild(caloriesP);

    if (item.errorMessage) {
        const errorP = document.createElement('p');
        errorP.className = 'text-red-600';
        errorP.innerHTML = `<strong class="font-medium text-gray-700 w-20 inline-block">Note:</strong> ${item.errorMessage}`; // Safe if errorMessage is plain text
        details.appendChild(errorP);
    }

    summaryWrapper.appendChild(details);
    card.appendChild(summaryWrapper);

    if (isDeletingHistoryMode) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-history-item-btn';
        deleteBtn.innerHTML = `
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <circle cx="12" cy="12" r="10"></circle>
               <line x1="15" y1="9" x2="9" y2="15"></line>
               <line x1="9" y1="9" x2="15" y2="15"></line>
           </svg>`;
        deleteBtn.setAttribute('aria-label', 'Delete item');
        deleteBtn.onclick = (event) => {
           event.stopPropagation();
           deleteHistoryItem(item.timestamp);
        };
        card.appendChild(deleteBtn);
    }
    return card;
}
