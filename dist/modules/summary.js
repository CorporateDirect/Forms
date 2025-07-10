/**
 * Summary module for collecting and displaying form field values
 */
import { SELECTORS, DEFAULTS } from '../config.js';
import { logVerbose, queryAllByAttr, getAttrValue } from './utils.js';
import { FormState } from './formState.js';
import { formEvents } from './events.js';
let initialized = false;
let eventCleanupFunctions = [];
let summaryFields = [];
/**
 * Initialize summary functionality
 */
export function initSummary(root = document) {
    if (initialized) {
        logVerbose('Summary already initialized, cleaning up first');
        resetSummary();
    }
    logVerbose('Initializing summary functionality');
    // Find all summary display elements
    const summaryElements = queryAllByAttr(SELECTORS.SUMMARY_FIELD, root);
    logVerbose(`Found ${summaryElements.length} summary fields`);
    // Set up summary field configurations
    setupSummaryFields(summaryElements);
    // Set up event listeners for field changes via centralized coordinator
    setupSummaryEventListeners();
    // Initial summary update
    updateAllSummaries();
    initialized = true;
    logVerbose('Summary initialization complete');
}
/**
 * Set up summary field configurations
 */
function setupSummaryFields(summaryElements) {
    summaryElements.forEach(element => {
        const summaryFieldAttr = getAttrValue(element, 'data-summary-field');
        if (!summaryFieldAttr)
            return;
        // Parse field names (pipe-separated)
        const fieldNames = summaryFieldAttr.split('|').map(name => name.trim());
        // Get join type
        const joinAttr = getAttrValue(element, 'data-join');
        const joinType = joinAttr && joinAttr in DEFAULTS.JOIN_SEPARATOR ? joinAttr : 'space';
        // Get categorization attributes
        const type = getAttrValue(element, 'data-summary-type') || undefined;
        const subtype = getAttrValue(element, 'data-summary-subtype') || undefined;
        const number = getAttrValue(element, 'data-summary-number') || undefined;
        const summaryField = {
            element: element,
            fieldNames,
            joinType,
            type,
            subtype,
            number
        };
        summaryFields.push(summaryField);
        logVerbose('Summary field configured', {
            fieldNames,
            joinType,
            type,
            subtype,
            number
        });
    });
}
/**
 * Set up event listeners for field changes via centralized coordinator
 */
function setupSummaryEventListeners() {
    // Listen to centralized field events instead of direct DOM events
    const cleanup1 = formEvents.on('field:change', handleFieldChangeEvent);
    const cleanup2 = formEvents.on('field:input', handleFieldChangeEvent);
    eventCleanupFunctions.push(cleanup1, cleanup2);
    logVerbose('Summary module subscribed to centralized field events');
}
/**
 * Handle field change events from centralized coordinator
 */
function handleFieldChangeEvent(data) {
    const { fieldName, value, eventType } = data;
    logVerbose(`Summary received field ${eventType}: ${fieldName}`, { value });
    // Note: FormState already updated by centralized coordinator
    // Update summaries that include this field
    updateSummariesForField(fieldName);
}
/**
 * Update summaries that include a specific field
 */
function updateSummariesForField(fieldName) {
    summaryFields.forEach(summaryField => {
        if (summaryField.fieldNames.includes(fieldName)) {
            updateSummaryField(summaryField);
        }
    });
}
/**
 * Update all summary fields
 */
export function updateSummary() {
    logVerbose('Updating all summaries');
    updateAllSummaries();
}
/**
 * Update all summary fields (internal)
 */
function updateAllSummaries() {
    summaryFields.forEach(summaryField => {
        updateSummaryField(summaryField);
    });
}
/**
 * Update a specific summary field
 */
function updateSummaryField(summaryField) {
    const values = [];
    // Collect values for all field names
    summaryField.fieldNames.forEach(fieldName => {
        const value = FormState.getField(fieldName);
        if (value !== null && value !== undefined && value !== '') {
            // Handle different value types
            if (Array.isArray(value)) {
                values.push(...value.filter(v => v !== ''));
            }
            else {
                values.push(String(value));
            }
        }
    });
    // Join values according to join type
    const joinedValue = joinValues(values, summaryField.joinType);
    // Update the summary element
    updateSummaryElement(summaryField.element, joinedValue);
    logVerbose(`Summary field updated`, {
        fieldNames: summaryField.fieldNames,
        values,
        joinType: summaryField.joinType,
        result: joinedValue
    });
}
/**
 * Join values according to join type
 */
function joinValues(values, joinType) {
    if (values.length === 0)
        return '';
    const separator = DEFAULTS.JOIN_SEPARATOR[joinType];
    return values.join(separator);
}
/**
 * Update summary element content
 */
function updateSummaryElement(element, value) {
    // Update text content
    element.textContent = value;
    // Add/remove empty class for styling
    if (value === '') {
        element.classList.add('summary-empty');
        element.classList.remove('summary-filled');
    }
    else {
        element.classList.remove('summary-empty');
        element.classList.add('summary-filled');
    }
}
/**
 * Get summary by type/subtype/number
 */
export function getSummaryByCategory(type, subtype, number) {
    const matchingSummaries = [];
    summaryFields.forEach(summaryField => {
        const matches = ((!type || summaryField.type === type) &&
            (!subtype || summaryField.subtype === subtype) &&
            (!number || summaryField.number === number));
        if (matches) {
            const currentValue = summaryField.element.textContent || '';
            if (currentValue) {
                matchingSummaries.push(currentValue);
            }
        }
    });
    logVerbose('Retrieved summaries by category', {
        type,
        subtype,
        number,
        results: matchingSummaries
    });
    return matchingSummaries;
}
/**
 * Clear summary for specific fields
 */
export function clearSummary(fieldNames) {
    if (fieldNames) {
        logVerbose('Clearing specific summary fields', fieldNames);
        // Clear specific fields from FormState
        FormState.clearFields(fieldNames);
        // Update affected summaries
        fieldNames.forEach(fieldName => {
            updateSummariesForField(fieldName);
        });
    }
    else {
        logVerbose('Clearing all summaries');
        // Clear all field values from FormState
        FormState.clear();
        // Update all summaries
        updateAllSummaries();
    }
}
/**
 * Get all summary values as an object
 */
export function getAllSummaryValues() {
    const summaryValues = {};
    summaryFields.forEach(summaryField => {
        const values = [];
        summaryField.fieldNames.forEach(fieldName => {
            const value = FormState.getField(fieldName);
            if (value !== null && value !== undefined && value !== '') {
                values.push(String(value));
            }
        });
        const joinedValue = joinValues(values, summaryField.joinType);
        const elementId = summaryField.element.id || `summary-${summaryField.fieldNames.join('-')}`;
        summaryValues[elementId] = joinedValue;
    });
    return summaryValues;
}
/**
 * Force refresh all summaries from current FormState
 */
export function refreshSummaries() {
    logVerbose('Refreshing all summaries from FormState');
    updateAllSummaries();
}
/**
 * Add custom summary field programmatically
 */
export function addCustomSummary(element, fieldNames, joinType = 'space', type, subtype, number) {
    const summaryField = {
        element,
        fieldNames,
        joinType,
        type,
        subtype,
        number
    };
    summaryFields.push(summaryField);
    updateSummaryField(summaryField);
    logVerbose('Custom summary field added', {
        fieldNames,
        joinType,
        type,
        subtype,
        number
    });
}
/**
 * Get current summary state for debugging
 */
export function getSummaryState() {
    const state = {};
    summaryFields.forEach((summaryField, index) => {
        const key = summaryField.type && summaryField.subtype && summaryField.number
            ? `${summaryField.type}-${summaryField.subtype}-${summaryField.number}`
            : `summary-${index}`;
        state[key] = {
            hasContent: (summaryField.element.textContent || '').trim().length > 0
        };
    });
    return state;
}
/**
 * Reset summary functionality
 */
function resetSummary() {
    logVerbose('Resetting summary functionality');
    // Clean up event listeners
    eventCleanupFunctions.forEach(cleanup => cleanup());
    eventCleanupFunctions = [];
    // Clear all summary fields
    summaryFields.forEach(summaryField => {
        updateSummaryElement(summaryField.element, '');
    });
    // Reset summary fields array
    summaryFields = [];
    initialized = false;
    logVerbose('Summary reset complete');
}
//# sourceMappingURL=summary.js.map