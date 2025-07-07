/**
 * Branching logic module for handling conditional form navigation
 */

import { SELECTORS } from '../config.js';
import { 
  logVerbose, 
  queryAllByAttr, 
  queryByAttr, 
  getAttrValue, 
  delegateEvent,
  getInputValue,
  isFormInput
} from './utils.js';
import { FormState } from './formState.js';

interface BranchCondition {
  field: string;
  value: string | number | boolean;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
}

let initialized = false;
let cleanupFunctions: (() => void)[] = [];

/**
 * Initialize branching functionality
 */
export function initBranching(root: Document | Element = document): void {
  if (initialized) {
    logVerbose('Branching already initialized, cleaning up first');
    resetBranching();
  }

  logVerbose('Initializing branching logic');

  // Set up event listeners for branching triggers
  setupBranchingListeners(root);

  initialized = true;
  logVerbose('Branching initialization complete');
}

/**
 * Set up event listeners for branching logic
 */
function setupBranchingListeners(root: Document | Element): void {
  // Main event listener for form inputs with data-go-to
  const cleanup1 = delegateEvent(
    root,
    'change',
    SELECTORS.GO_TO,
    handleBranchTrigger
  );

  // Input events for real-time branching
  const cleanup2 = delegateEvent(
    root,
    'input',
    SELECTORS.GO_TO,
    handleBranchTrigger
  );

  // Click events for radio buttons and checkboxes
  const cleanup3 = delegateEvent(
    root,
    'click',
    SELECTORS.GO_TO,
    handleBranchTrigger
  );

  // Enhanced radio button support for custom styling
  const cleanup4 = delegateEvent(
    root,
    'click',
    'label.radio_field, .w-radio, .radio_button-skip-step, .w-form-formradioinput, .w-radio-input',
    handleRadioLabelClick
  );

  cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4);
}

/**
 * Handle clicks on radio button labels and visual elements
 */
function handleRadioLabelClick(event: Event, target: Element): void {
  // Find the associated radio input
  let radioInput: HTMLInputElement | null = null;
  
  // Method 1: Look for radio input inside the clicked element
  radioInput = target.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
  
  // Method 2: Look in parent label
  if (!radioInput) {
    const parentLabel = target.closest('label');
    if (parentLabel) {
      radioInput = parentLabel.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
    }
  }
  
  // Method 3: Look in sibling elements (for complex layouts)
  if (!radioInput) {
    const container = target.closest('.radio_field, .w-radio, .radio_component');
    if (container) {
      radioInput = container.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
    }
  }
  
  if (radioInput && getAttrValue(radioInput, 'data-go-to')) {
    event.preventDefault();
    event.stopPropagation();
    
    // Select the radio button
    radioInput.checked = true;
    
    // Apply active styling
    applyRadioActiveClass(radioInput);
    
    // Trigger branching logic
    const syntheticEvent = new Event('change', { bubbles: true });
    Object.defineProperty(syntheticEvent, 'target', { value: radioInput });
    handleBranchTrigger(syntheticEvent, radioInput);
  }
}

/**
 * Handle branch trigger events
 */
function handleBranchTrigger(event: Event, target: Element): void {
  if (!isFormInput(target)) {
    return;
  }

  const goToValue = getAttrValue(target, 'data-go-to');
  const inputValue = getInputValue(target);

  logVerbose('Branch trigger activated', {
    element: target,
    goTo: goToValue,
    value: inputValue,
    type: (target as HTMLInputElement).type || target.tagName
  });

  // Store the field value in state
  const fieldName = (target as HTMLInputElement).name || getAttrValue(target, 'data-step-field-name');
  if (fieldName) {
    FormState.setField(fieldName, inputValue);
  }

  // Handle different input types
  if (target instanceof HTMLInputElement) {
    if (target.type === 'radio' && target.checked) {
      if (!goToValue) {
        logVerbose('Radio button has no data-go-to attribute, skipping navigation');
        return;
      }
      
      // Handle radio group selection
      handleRadioGroupSelection(target);
      
      // Apply active class styling
      applyRadioActiveClass(target);
      
      // Activate branch and show step item
      activateBranch(goToValue, target.value);
      triggerStepItemVisibility(goToValue);
      
    } else if (target.type === 'checkbox') {
      if (target.checked) {
        activateBranch(goToValue, target.value);
      } else {
        deactivateBranch(goToValue);
      }
    } else if (target.type !== 'radio' && target.type !== 'checkbox') {
      // Text inputs, selects, etc.
      if (inputValue) {
        activateBranch(goToValue, inputValue);
      } else {
        deactivateBranch(goToValue);
      }
    }
  } else {
    // Select elements and textareas
    if (inputValue) {
      activateBranch(goToValue, inputValue);
    } else {
      deactivateBranch(goToValue);
    }
  }

  // Update step visibility if we have active conditions
  const activeConditions = FormState.getBranchPath().activeConditions;
  const hasActiveConditions = Object.values(activeConditions).some(value => 
    value !== null && value !== undefined && value !== ''
  );
  
  if (hasActiveConditions) {
    updateStepVisibility();
  }
}

/**
 * Apply active class to radio button and remove from others in the same group
 */
function applyRadioActiveClass(selectedRadio: HTMLInputElement): void {
  const activeClass = getAttrValue(selectedRadio, 'fs-inputactive-class') || 'is-active-inputactive';
  
  // Remove active class from other radio buttons in the same group
  if (selectedRadio.name) {
    const radioGroup = document.querySelectorAll(`input[type="radio"][name="${selectedRadio.name}"]`);
    radioGroup.forEach(radio => {
      const htmlRadio = radio as HTMLInputElement;
      const radioLabel = htmlRadio.closest('label');
      if (htmlRadio !== selectedRadio) {
        htmlRadio.classList.remove(activeClass);
        radioLabel?.classList.remove(activeClass);
      }
    });
  }
  
  // Add active class to the selected radio and its label
  selectedRadio.classList.add(activeClass);
  const parentLabel = selectedRadio.closest('label');
  parentLabel?.classList.add(activeClass);
}

/**
 * Handle radio button group selection - deactivate other options in the same group
 */
function handleRadioGroupSelection(selectedRadio: HTMLInputElement): void {
  if (!selectedRadio.name) return;
  
  // Find all radio buttons in the same group
  const radioGroup = document.querySelectorAll(`input[type="radio"][name="${selectedRadio.name}"]`);
  
  radioGroup.forEach(radio => {
    const htmlRadio = radio as HTMLInputElement;
    const radioGoTo = getAttrValue(htmlRadio, 'data-go-to');
    
    if (htmlRadio !== selectedRadio && radioGoTo) {
      // Deactivate this radio button's branch
      deactivateBranch(radioGoTo);
      hideStepItem(radioGoTo);
    }
  });
}

/**
 * Show a step item by updating its visibility in the form state
 */
function showStepItem(stepItemId: string): void {
  FormState.setStepVisibility(stepItemId, true);
  logVerbose(`Set step item visibility to true in FormState: ${stepItemId}`);
}

/**
 * Hide a step item by updating its visibility in the form state
 */
function hideStepItem(stepItemId: string): void {
  FormState.setStepVisibility(stepItemId, false);
  logVerbose(`Set step item visibility to false in FormState: ${stepItemId}`);
}

/**
 * Trigger step_item visibility based on radio button selection
 */
function triggerStepItemVisibility(stepItemId: string): void {
  // Defensive check
  if (!stepItemId) {
    logVerbose('No stepItemId provided to triggerStepItemVisibility');
    return;
  }

  logVerbose(`Triggering visibility for step_item: ${stepItemId}`);

  showStepItem(stepItemId);
}

/**
 * Activate a branch and store its state
 */
function activateBranch(target: string | null, value: string | string[]): void {
  if (!target) return;
  FormState.setActiveCondition(target, value);
}

/**
 * Deactivate a branch path
 */
function deactivateBranch(target: string | null): void {
  if (!target) return;

  logVerbose(`Deactivating branch: ${target}`);

  // Remove active condition from state
  FormState.setActiveCondition(target, null);

  // Clear fields from this branch
  clearBranchFields(target);

  // Update step visibility
  updateStepVisibility();
}

/**
 * Get the next step based on branching logic
 */
export function getNextStep(currentStep?: string): string | null {
  const activeConditions = FormState.getBranchPath().activeConditions;
  
  // This logic can be enhanced to handle complex rules.
  // For now, it returns the first active condition target.
  const nextStep = Object.keys(activeConditions).find(key => activeConditions[key]);
  
  return nextStep || null;
}

/**
 * Update step visibility based on active branching conditions.
 */
function updateStepVisibility(): void {
  const allSteps = queryAllByAttr(SELECTORS.STEP);
  const activeConditions = FormState.getBranchPath().activeConditions;

  allSteps.forEach(step => {
    const stepAnswer = getAttrValue(step, 'data-answer');
    const shouldBeVisible = shouldStepBeVisible(stepAnswer, activeConditions);
    
    // Update FormState
    if (stepAnswer) {
      FormState.setStepVisibility(stepAnswer, shouldBeVisible);
    }
  });
}

/**
 * Check if a step should be visible based on its data-show-if attribute.
 */
function shouldStepBeVisible(stepAnswer: string | null, activeConditions: Record<string, unknown>): boolean {
  if (!stepAnswer) return true; // Steps without data-answer are always visible
  
  // Find the step element
  const stepElement = queryByAttr(`[data-answer="${stepAnswer}"]`);
  if (stepElement) {
    const showIf = getAttrValue(stepElement, 'data-show-if');
    if (showIf) {
      // Check if the step matches the show-if condition
      const conditionMet = evaluateCondition(showIf, activeConditions);
      return conditionMet;
    }
  }
  
  // Default to not visible if it has conditions but none are met
  return false;
}

function evaluateCondition(showIf: string, activeConditions: Record<string, unknown>): boolean {
  // This is a simple implementation. You can extend it to support more complex conditions.
  // For now, it checks if the 'showIf' value exists as a key in activeConditions.
  return activeConditions.hasOwnProperty(showIf);
}

/**
 * Clear fields from inactive branches
 */
function clearInactiveBranchFields(): void {
  // This function can be expanded to clear data from fields
  // that are part of now-inactive branches.
}

/**
 * Clear fields related to a specific branch target.
 */
function clearBranchFields(branchTarget: string): void {
  const fieldsToClear: string[] = [];
  
  // Find all inputs that are part of the branch
  const branchInputs = document.querySelectorAll(`[data-go-to="${branchTarget}"]`);
  
  branchInputs.forEach(input => {
    if (isFormInput(input) && input.name) {
      fieldsToClear.push(input.name);
    }
  });
  
  // Clear from FormState
  if (fieldsToClear.length > 0) {
    FormState.clearFields(fieldsToClear);
  }
}

/**
 * Reset branching module state
 */
export function resetBranching(): void {
  logVerbose('Resetting branching logic');

  // Clean up event listeners
  cleanupFunctions.forEach(cleanup => cleanup());
  cleanupFunctions = [];

  // Clear active conditions
  const activeConditions = FormState.getBranchPath().activeConditions;
  Object.keys(activeConditions).forEach(key => {
    FormState.setActiveCondition(key, null);
  });

  // Reset visibility of all conditional steps
  const conditionalSteps = queryAllByAttr(SELECTORS.ANSWER);
  conditionalSteps.forEach(step => {
    const htmlStep = step as HTMLElement;
    htmlStep.style.display = 'none';
    htmlStep.classList.add('hidden-step');
  });

  initialized = false;
  logVerbose('Branching reset complete');
}

/**
 * Get current branching state for debugging
 */
export function getBranchingState(): Record<string, unknown> {
  return {
    initialized,
    activeConditions: FormState.getBranchPath().activeConditions,
    branchPath: FormState.getBranchPath()
  };
} 