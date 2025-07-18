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
import { formEvents } from './events.js';

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

  console.log('🌿 [Branching] === INITIALIZATION START ===');
  console.log('🔍 [Branching] Root element:', {
    isDocument: root === document,
    elementType: root.constructor.name
  });

  logVerbose('Initializing branching logic');

  // Check if multiStep will be initialized to handle branch events
  const multistepForms = root.querySelectorAll(SELECTORS.MULTISTEP);
  const stepElements = root.querySelectorAll(SELECTORS.STEP);
  
  console.log('📋 [Branching] Form detection:', {
    multistepForms: multistepForms.length,
    stepElements: stepElements.length,
    multistepSelector: SELECTORS.MULTISTEP,
    stepSelector: SELECTORS.STEP
  });
  
  if (multistepForms.length === 0 && stepElements.length === 0) {
    console.warn('⚠️ [Branching] Warning: Branching initialized but no multi-step forms found. Branch events may not be handled.');
    logVerbose('Warning: Branching initialized but no multi-step forms found. Branch events may not be handled.');
  }

  // Find all elements with data-go-to attributes
  const goToElements = root.querySelectorAll(SELECTORS.GO_TO);
  console.log('🎯 [Branching] data-go-to elements found:', {
    count: goToElements.length,
    selector: SELECTORS.GO_TO,
    elements: Array.from(goToElements).map((el, i) => ({
      index: i,
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      dataGoTo: el.getAttribute('data-go-to'),
      name: (el as HTMLInputElement).name,
      type: (el as HTMLInputElement).type || el.tagName,
      value: (el as HTMLInputElement).value
    }))
  });

  // Find all elements with data-answer attributes
  const answerElements = root.querySelectorAll(SELECTORS.ANSWER);
  console.log('🎯 [Branching] data-answer elements found:', {
    count: answerElements.length,
    selector: SELECTORS.ANSWER,
    elements: Array.from(answerElements).map((el, i) => ({
      index: i,
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      dataAnswer: el.getAttribute('data-answer'),
      isStep: el.hasAttribute('data-form') && el.getAttribute('data-form') === 'step'
    }))
  });

  // Set up event listeners for branching triggers
  setupBranchingListeners(root);

  initialized = true;
  console.log('✅ [Branching] Initialization complete');
  logVerbose('Branching initialization complete');
  
  // Register this module as initialized
  formEvents.registerModule('branching');
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
 * Evaluate condition string against active conditions
 */
function evaluateCondition(condition: string, activeConditions: Record<string, unknown>): boolean {
  if (!condition || typeof condition !== 'string') {
    logVerbose('Invalid condition provided', { condition });
    return false;
  }

  try {
    // Simple condition evaluation - can be enhanced for complex logic
    // For now, just check if the condition key exists in activeConditions
    const trimmedCondition = condition.trim();
    
    // Handle multiple conditions separated by commas (OR logic)
    if (trimmedCondition.includes(',')) {
      const conditions = trimmedCondition.split(',').map(c => c.trim());
      return conditions.some(cond => !!activeConditions[cond]);
    }
    
    // Handle multiple conditions separated by ampersand (AND logic)
    if (trimmedCondition.includes('&')) {
      const conditions = trimmedCondition.split('&').map(c => c.trim());
      return conditions.every(cond => !!activeConditions[cond]);
    }
    
    // Single condition
    return !!activeConditions[trimmedCondition];
  } catch (error) {
    logVerbose('Error evaluating condition', { condition, error });
    return false;
  }
}

/**
 * Validate data-go-to attribute value
 */
function validateGoToValue(goToValue: string | null): boolean {
  if (!goToValue) return false;
  
  // Check for valid step ID format (alphanumeric, hyphens, underscores)
  const validStepIdPattern = /^[a-zA-Z0-9_-]+$/;
  
  if (!validStepIdPattern.test(goToValue)) {
    logVerbose('Invalid data-go-to value format', { goToValue });
    return false;
  }
  
  return true;
}

/**
 * Handle branch trigger events
 */
function handleBranchTrigger(event: Event, target: Element): void {
  console.log('🌿 [Branch] Trigger event detected', {
    eventType: event.type,
    element: target,
    tagName: target.tagName,
    className: target.className,
    id: target.id
  });

  if (!initialized) {
    console.error('❌ [Branch] Module not initialized, ignoring branch trigger', {
      target: target,
      initialized: initialized,
      eventType: event.type
    });
    return;
  }

  if (!isFormInput(target)) {
    console.log('ℹ️ [Branch] Element is not a form input, ignoring', {
      tagName: target.tagName,
      isInput: target instanceof HTMLInputElement,
      isSelect: target instanceof HTMLSelectElement,
      isTextarea: target instanceof HTMLTextAreaElement
    });
    return;
  }

  const goToValue = getAttrValue(target, 'data-go-to');
  const fieldName = (target as HTMLInputElement).name || getAttrValue(target, 'data-step-field-name');
  const inputValue = getInputValue(target);
  const inputType = (target as HTMLInputElement).type || target.tagName;
  
  console.log('📋 [Branch] Data attributes analysis:', {
    'data-go-to': goToValue,
    'data-step-field-name': getAttrValue(target, 'data-step-field-name'),
    'name': (target as HTMLInputElement).name,
    'type': inputType,
    'value': inputValue,
    'checked': (target as HTMLInputElement).checked,
    allAttributes: Array.from(target.attributes).map(attr => ({ 
      name: attr.name, 
      value: attr.value 
    }))
  });
  
  // Validate go-to value before proceeding
  if (goToValue && !validateGoToValue(goToValue)) {
    console.error('❌ [Branch] Invalid data-go-to value format', { 
      goToValue,
      validFormat: 'alphanumeric, hyphens, underscores only',
      pattern: '/^[a-zA-Z0-9_-]+$/'
    });
    return;
  }

  // FOR NEW LINEAR STRUCTURE: All radio buttons use simple step navigation
  if (target instanceof HTMLInputElement && target.type === 'radio') {
    console.log('🔄 [Branch] Radio button detected - using SIMPLE STEP NAVIGATION ONLY:', {
      goToValue,
      radioName: target.name,
      radioValue: target.value,
      isChecked: target.checked
    });
    
    if (target.checked && goToValue) {
      // Apply radio button styling
      applyRadioActiveClass(target);
      
      // Use ONLY direct step navigation - NO complex branching logic
      console.log('🎯 [Branch] Emitting step:navigate for radio button (NO BRANCHING LOGIC):', { targetStepId: goToValue });
      formEvents.emit('step:navigate', { targetStepId: goToValue, reason: 'radio_button_simple_navigation' });
    }
    
    // COMPLETELY skip all complex branching logic for radio buttons
    return;
  }

  // FOR OTHER INPUT TYPES: Also use simple navigation to avoid conflicts
  console.log('🎯 [Branch] Non-radio input with data-go-to - using simple navigation:', {
    element: target,
    goTo: goToValue,
    value: inputValue,
    type: inputType,
    fieldName: fieldName,
    hasGoTo: !!goToValue,
    hasValue: !!inputValue
  });

  // Handle other input types with simple navigation only
  if (goToValue && inputValue) {
    console.log('✅ [Branch] Input has value, navigating to target step:', { goToValue, inputValue });
    formEvents.emit('step:navigate', { targetStepId: goToValue, reason: 'input_navigation' });
  }
}

/**
 * Apply active class to radio button and remove from others in the same group
 */
function applyRadioActiveClass(selectedRadio: HTMLInputElement): void {
  const groupName = selectedRadio.name;
  if (!groupName) return;

  const activeClass = getAttrValue(selectedRadio, 'fs-inputactive-class') || 'is-active-inputactive';
  
  // Remove active class from other radio buttons in the same group
  const radioGroup = document.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
  radioGroup.forEach(radio => {
    const htmlRadio = radio as HTMLInputElement;
    const radioLabel = htmlRadio.closest('label');
    if (htmlRadio !== selectedRadio) {
      htmlRadio.classList.remove(activeClass);
      radioLabel?.classList.remove(activeClass);
    }
  });
  
  // Add active class to the selected radio and its label
  selectedRadio.classList.add(activeClass);
  const parentLabel = selectedRadio.closest('label');
  parentLabel?.classList.add(activeClass);
}

/**
 * DEPRECATED: Complex branching functions below are disabled for new linear structure
 * These functions caused all steps to be hidden when radio buttons were clicked
 */

/**
 * Handle radio group state for branching - DISABLED
 */
function handleRadioGroupSelection(selectedRadio: HTMLInputElement): void {
  // DISABLED: This function was causing conflicts with simple step navigation
  console.log('🚫 [Branch] handleRadioGroupSelection DISABLED for new linear structure');
}

/**
 * Activate a branch target - SIMPLIFIED to just emit navigation
 */
function activateBranch(target: string | null): void {
  if (!target) return;
  
  console.log('🌿 [Branch] activateBranch called but SIMPLIFIED for linear structure:', { target });
  
  // SIMPLIFIED: Just emit navigation event, no complex visibility logic
  formEvents.emit('step:navigate', { targetStepId: target, reason: 'simplified_branch_activation' });
}

/**
 * Deactivate a branch target - DISABLED
 */
function deactivateBranch(target: string | null): void {
  // DISABLED: No deactivation needed for linear structure
  console.log('🚫 [Branch] deactivateBranch DISABLED for new linear structure:', { target });
}

/**
 * Update visibility of all conditional steps - COMPLETELY DISABLED
 * This function was hiding all steps and causing the main issue
 */
function updateStepVisibility(): void {
  console.log('🚫 [Branch] updateStepVisibility COMPLETELY DISABLED - was causing all steps to be hidden');
  
  // COMPLETELY DISABLED: This function was the root cause of all steps being hidden
  // The new linear structure doesn't need complex conditional visibility logic
  // Each step is a separate main step that uses normal step navigation
  
  // OLD CODE REMOVED - it was hiding all steps and only showing ones with active conditions
  // which doesn't work with the new linear structure where each branch is a separate step
}

// Note: Field required state management now handled by multiStep.ts to avoid conflicts

/**
 * Clear fields within a deactivated branch
 */
function clearBranchFields(branchTarget: string): void {
  const fieldsToClear: string[] = [];
  const branchContainer = queryByAttr(`[data-answer="${branchTarget}"]`);

  if (branchContainer) {
    const fields = queryAllByAttr('[data-step-field-name]', branchContainer);
    fields.forEach(field => {
      const fieldName = getAttrValue(field, 'data-step-field-name');
      if (fieldName) {
        fieldsToClear.push(fieldName);
      }
    });
  }

  if (fieldsToClear.length > 0) {
    FormState.clearFields(fieldsToClear);
  }
}

/**
 * Get next step based on current form state and branching logic
 * @param currentStepId - Current step ID
 * @returns Next step ID or null if no branching applies
 */
export function getNextStep(currentStepId: string): string | null {
  if (!initialized) {
    logVerbose('Branching module not initialized, cannot determine next step');
    return null;
  }

  logVerbose('Evaluating next step for branching logic', { currentStepId });

  // Find all data-go-to elements in current step that are active/selected
  const currentStepElement = document.querySelector(`[data-answer="${currentStepId}"]`);
  if (!currentStepElement) {
    logVerbose('Current step element not found', { currentStepId });
    return null;
  }

  const goToElements = currentStepElement.querySelectorAll(SELECTORS.GO_TO);
  
  for (const element of goToElements) {
    const input = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const goToValue = getAttrValue(input, 'data-go-to');
    
    if (!goToValue) continue;

    // Check if this element determines the next step
    if (input.type === 'radio' && (input as HTMLInputElement).checked) {
      logVerbose('Found active radio determining next step', {
        goToValue,
        inputName: input.name,
        inputValue: input.value
      });
      return goToValue;
    } else if (input.type === 'checkbox' && (input as HTMLInputElement).checked) {
      logVerbose('Found active checkbox determining next step', {
        goToValue,
        inputName: input.name,
        inputValue: input.value
      });
      return goToValue;
    } else if (input.type !== 'radio' && input.type !== 'checkbox' && input.value.trim()) {
      logVerbose('Found input with value determining next step', {
        goToValue,
        inputType: input.type,
        inputValue: input.value
      });
      return goToValue;
    }
  }

  logVerbose('No branching logic applies, returning null for sequential navigation');
  return null;
}

/**
 * Reset branching module state
 */
export function resetBranching(): void {
  if (!initialized) {
    logVerbose('Branching module not initialized, nothing to reset');
    return;
  }
  
  logVerbose('Resetting branching module');

  // Unregister this module
  formEvents.unregisterModule('branching');
  
  cleanupFunctions.forEach(fn => fn());
  cleanupFunctions = [];
  
  // Clear relevant parts of FormState
  // Active conditions removed (was part of advanced skip logic)
  
  initialized = false;
  logVerbose('Branching module reset');
}

/**
 * Get current branching state
 */
export function getBranchingState(): Record<string, unknown> {
  return {
    initialized,
    // activeConditions removed (was part of advanced skip logic)
  };
} 