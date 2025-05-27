// js/utils.js

/**
 * Determines UI styling and labels based on a protein percentage.
 *
 * @param {number} percentage - The protein percentage value.
 * @returns {object} An object containing:
 *  - {string} actualPercentage: The protein percentage, fixed to one decimal place.
 *  - {string} displayPercentage: The percentage to display (capped at 100%), fixed to one decimal place.
 *  - {string} colorClass: Tailwind CSS class for the main color.
 *  - {string} fadedColorClass: Tailwind CSS class for a faded version of the color.
 *  - {string} label: A descriptive label for the percentage (e.g., 'Low', 'Good', 'Amazing!').
 */
function getProteinInfo(percentage) {
    let colorClass = 'bg-gray-400', fadedColorClass = 'bg-fade-gray-400', label = 'N/A';
    let displayPercentage = 0, actualPercentage = 0;

    if (isNaN(percentage) || percentage < 0) {
         displayPercentage = 0; actualPercentage = 0;
         // Keep default label 'N/A' and colors for invalid inputs
    } else {
        actualPercentage = percentage;
        displayPercentage = Math.min(actualPercentage, 100); // Cap display at 100%
         if (actualPercentage === 0) { label = 'Zero'; colorClass = 'bg-gray-500'; fadedColorClass = 'bg-fade-gray-500'; }
         else if (actualPercentage < 15) { label = 'Low'; colorClass = 'bg-red-500'; fadedColorClass = 'bg-fade-red-500'; }
         else if (actualPercentage < 30) { label = 'Okay'; colorClass = 'bg-yellow-500'; fadedColorClass = 'bg-fade-yellow-500'; }
         else if (actualPercentage < 50) { label = 'Good'; colorClass = 'bg-blue-500'; fadedColorClass = 'bg-fade-blue-500'; }
         else if (actualPercentage < 70) { label = 'Great'; colorClass = 'bg-green-500'; fadedColorClass = 'bg-fade-green-500'; }
         else if (actualPercentage <= 100) { label = 'Amazing!'; colorClass = 'bg-purple-600'; fadedColorClass = 'bg-fade-purple-600'; }
         else { label = 'Unreal'; colorClass = 'bg-gray-700'; fadedColorClass = 'bg-fade-gray-700'; } // Percentages > 100%
    }
    return {
        actualPercentage: actualPercentage.toFixed(1),
        displayPercentage: displayPercentage.toFixed(1),
        colorClass,
        fadedColorClass,
        label
    };
}
