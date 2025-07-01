/**
 * Summary module for collecting and displaying form field values
 */

import { SELECTORS, DEFAULTS, JoinType } from '../config.js';
import { 
  logVerbose, 
  queryAllByAttr, 
  getAttrValue, 
  delegateEvent,
  getInputValue,
  isFormInput
} from './utils.js';
import { FormState } from './formState.js';

interface SummaryField {
  element: HTMLElement;
  fieldNames: string[];
  joinType: JoinType;
  type?: string;
  subtype?: string;
  number?: string;
}

let initialized = false;
let cleanupFunctions: (() => void)[] = [];
let summaryFields: SummaryField[] = [];

/**
 * Initialize summary functionality
 */
export function initSummary(root: Document | Element = document): void {
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

  // Set up event listeners for field changes
  setupSummaryListeners(root);

  // Initial summary update
  updateAllSummaries();

  initialized = true;
  logVerbose('Summary initialization complete');
}

/**
 * Set up summary field configurations
 */
function setupSummaryFields(summaryElements: NodeListOf<Element>): void {
  summaryElements.forEach(element => {
    const summaryFieldAttr = getAttrValue(element, 'data-summary-field');
    if (!summaryFieldAttr) return;

    // Parse field names (pipe-separated)
    const fieldNames = summaryFieldAttr.split('|').map(name => name.trim());
    
    // Get join type
    const joinAttr = getAttrValue(element, 'data-join') as JoinType;
    const joinType: JoinType = joinAttr && joinAttr in DEFAULTS.JOIN_SEPARATOR ? joinAttr : 'space';

    // Get categorization attributes
    const type = getAttrValue(element, 'data-summary-type') || undefined;
    const subtype = getAttrValue(element, 'data-summary-subtype') || undefined;
    const number = getAttrValue(element, 'data-summary-number') || undefined;

    const summaryField: SummaryField = {
      element: element as HTMLElement,
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
 * Set up event listeners for field changes
 */
function setupSummaryListeners(root: Document | Element): void {
  // Listen for input changes on fields with data-step-field-name
  const cleanup1 = delegateEvent(
    root,
    'input',
    SELECTORS.STEP_FIELD_NAME,
    handleFieldChange
  );

  // Listen for change events
  const cleanup2 = delegateEvent(
    root,
    'change',
    SELECTORS.STEP_FIELD_NAME,
    handleFieldChange
  );

  // Listen for blur events
  const cleanup3 = delegateEvent(
    root,
    'blur',
    SELECTORS.STEP_FIELD_NAME,
    handleFieldChange
  );

  cleanupFunctions.push(cleanup1, cleanup2, cleanup3);
}

/**
 * Handle field change events
 */
function handleFieldChange(event: Event, target: Element): void {
  if (!isFormInput(target)) return;

  const fieldName = getAttrValue(target, 'data-step-field-name');
  if (!fieldName) return;

  const value = getInputValue(target as HTMLInputElement);
  
  logVerbose(`Summary field changed: ${fieldName}`, { value });

  // Update FormState
  FormState.setField(fieldName, value);

  // Update summaries that include this field
  updateSummariesForField(fieldName);
}

/**
 * Update summaries that include a specific field
 */
function updateSummariesForField(fieldName: string): void {
  summaryFields.forEach(summaryField => {
    if (summaryField.fieldNames.includes(fieldName)) {
      updateSummaryField(summaryField);
    }
  });
}

/**
 * Update all summary fields
 */
export function updateSummary(): void {
  logVerbose('Updating all summaries');
  updateAllSummaries();
}

/**
 * Update all summary fields (internal)
 */
function updateAllSummaries(): void {
  summaryFields.forEach(summaryField => {
    updateSummaryField(summaryField);
  });
}

/**
 * Update a specific summary field
 */
function updateSummaryField(summaryField: SummaryField): void {
  const values: string[] = [];

  // Collect values for all field names
  summaryField.fieldNames.forEach(fieldName => {
    const value = FormState.getField(fieldName);
    if (value !== null && value !== undefined && value !== '') {
      // Handle different value types
      if (Array.isArray(value)) {
        values.push(...value.filter(v => v !== ''));
      } else {
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
function joinValues(values: string[], joinType: JoinType): string {
  if (values.length === 0) return '';

  const separator = DEFAULTS.JOIN_SEPARATOR[joinType];
  return values.join(separator);
}

/**
 * Update summary element content
 */
function updateSummaryElement(element: HTMLElement, value: string): void {
  // Update text content
  element.textContent = value;

  // Add/remove empty class for styling
  if (value === '') {
    element.classList.add('summary-empty');
    element.classList.remove('summary-filled');
  } else {
    element.classList.remove('summary-empty');
    element.classList.add('summary-filled');
  }
}

/**
 * Get summary by type/subtype/number
 */
export function getSummaryByCategory(type?: string, subtype?: string, number?: string): string[] {
  const matchingSummaries: string[] = [];

  summaryFields.forEach(summaryField => {
    const matches = (
      (!type || summaryField.type === type) &&
      (!subtype || summaryField.subtype === subtype) &&
      (!number || summaryField.number === number)
    );

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
export function clearSummary(fieldNames?: string[]): void {
  if (fieldNames) {
    logVerbose('Clearing specific summary fields', fieldNames);
    
    // Clear specific fields from FormState
    FormState.clearFields(fieldNames);
    
    // Update affected summaries
    fieldNames.forEach(fieldName => {
      updateSummariesForField(fieldName);
    });
  } else {
    logVerbose('Clearing all summaries');
    
    // Clear all field values from FormState
    FormState.clear();
    
    // Update all summaries
    updateAllSummaries();
  }
}

/**
 * Get all current summary values
 */
export function getAllSummaryValues(): Record<string, any> {
  const summaryValues: Record<string, any> = {};

  summaryFields.forEach((summaryField, index) => {
    const key = summaryField.type && summaryField.subtype && summaryField.number
      ? `${summaryField.type}-${summaryField.subtype}-${summaryField.number}`
      : `summary-${index}`;
    
    summaryValues[key] = {
      fieldNames: summaryField.fieldNames,
      value: summaryField.element.textContent || '',
      joinType: summaryField.joinType,
      type: summaryField.type,
      subtype: summaryField.subtype,
      number: summaryField.number
    };
  });

  return summaryValues;
}

/**
 * Force refresh all summaries from current FormState
 */
export function refreshSummaries(): void {
  logVerbose('Refreshing all summaries from FormState');
  updateAllSummaries();
}

/**
 * Add custom summary field programmatically
 */
export function addCustomSummary(
  element: HTMLElement,
  fieldNames: string[],
  joinType: JoinType = 'space',
  type?: string,
  subtype?: string,
  number?: string
): void {
  const summaryField: SummaryField = {
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
 * Get summary state for debugging
 */
export function getSummaryState(): any {
  return {
    initialized,
    totalSummaryFields: summaryFields.length,
    summaryFields: summaryFields.map(field => ({
      fieldNames: field.fieldNames,
      joinType: field.joinType,
      type: field.type,
      subtype: field.subtype,
      number: field.number,
      currentValue: field.element.textContent || ''
    })),
    formStateData: FormState.getAll()
  };
}

/**
 * Reset summary functionality
 */
function resetSummary(): void {
  logVerbose('Resetting summary functionality');

  // Clean up event listeners
  cleanupFunctions.forEach(cleanup => cleanup());
  cleanupFunctions = [];

  // Clear all summary fields
  summaryFields.forEach(summaryField => {
    updateSummaryElement(summaryField.element, '');
  });

  // Reset summary fields array
  summaryFields = [];

  initialized = false;
  logVerbose('Summary reset complete');
} 