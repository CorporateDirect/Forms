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
  isFormInput,
  showElement,
  hideElement
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

  logVerbose('Initializing branching logic');

  // Check if multiStep will be initialized to handle branch events
  const multistepForms = root.querySelectorAll(SELECTORS.MULTISTEP);
  const stepElements = root.querySelectorAll(SELECTORS.STEP);
  
  if (multistepForms.length === 0 && stepElements.length === 0) {
    logVerbose('Warning: Branching initialized but no multi-step forms found. Branch events may not be handled.');
  }

  // Set up event listeners for branching triggers
  setupBranchingListeners(root);

  initialized = true;
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

  console.log('🎯 [Branch] Processing branch trigger:', {
    element: target,
    goTo: goToValue,
    value: inputValue,
    type: inputType,
    fieldName: fieldName,
    hasGoTo: !!goToValue,
    hasValue: !!inputValue
  });

  // Store the field value in state
  if (fieldName) {
    FormState.setField(fieldName, inputValue);
    console.log('💾 [Branch] Field value stored in FormState:', {
      fieldName,
      value: inputValue,
      previousValue: FormState.getField(fieldName)
    });
  } else {
    console.warn('⚠️ [Branch] No field name found, cannot store value in FormState', {
      element: target,
      name: (target as HTMLInputElement).name,
      dataStepFieldName: getAttrValue(target, 'data-step-field-name')
    });
  }

  // Handle different input types with detailed logging
  try {
    if (target instanceof HTMLInputElement) {
      if (target.type === 'radio' && target.checked) {
        console.log('📻 [Branch] Processing radio button selection:', {
          name: target.name,
          value: target.value,
          checked: target.checked,
          goTo: goToValue
        });
        
        if (!goToValue) {
          console.warn('⚠️ [Branch] Radio button has no data-go-to attribute, skipping navigation', {
            element: target,
            name: target.name,
            value: target.value
          });
          return;
        }
        
        // Verify target step exists
        const targetElement = document.querySelector(`[data-answer="${goToValue}"]`);
        if (!targetElement) {
          const allAnswerElements = document.querySelectorAll('[data-answer]');
          const allAnswerValues = Array.from(allAnswerElements).map(el => getAttrValue(el, 'data-answer'));
          
          console.error('❌ [Branch] Target step not found in DOM!', {
            searchedFor: goToValue,
            availableSteps: allAnswerValues,
            suggestion: `Check if element with data-answer="${goToValue}" exists`,
            possibleMatches: allAnswerValues.filter(val => val && val.includes(goToValue))
          });
        }
        
        // Handle radio group selection
        handleRadioGroupSelection(target);
        
        // Apply active class styling
        applyRadioActiveClass(target);
        
        // Activate branch and emit event
        activateBranch(goToValue);
        
        console.log('🚀 [Branch] Emitting branch:change event:', {
          targetStepId: goToValue,
          triggerValue: target.value,
          triggerType: 'radio'
        });
        
        formEvents.emit('branch:change', { targetStepId: goToValue });
        
      } else if (target.type === 'checkbox') {
        console.log('☑️ [Branch] Processing checkbox:', {
          name: target.name,
          value: target.value,
          checked: target.checked,
          goTo: goToValue
        });
        
        if (goToValue) {
          if (target.checked) {
            console.log('✅ [Branch] Checkbox checked, activating branch:', { goToValue });
            activateBranch(goToValue);
          } else {
            console.log('❌ [Branch] Checkbox unchecked, deactivating branch:', { goToValue });
            deactivateBranch(goToValue);
          }
        }
      } else if (target.type !== 'radio' && target.type !== 'checkbox') {
        console.log('📝 [Branch] Processing text input/other:', {
          type: target.type,
          name: target.name,
          value: inputValue,
          goTo: goToValue
        });
        
        // Text inputs, selects, etc.
        if (goToValue) {
          if (inputValue) {
            console.log('✅ [Branch] Input has value, activating branch:', { goToValue, inputValue });
            activateBranch(goToValue);
          } else {
            console.log('❌ [Branch] Input is empty, deactivating branch:', { goToValue });
            deactivateBranch(goToValue);
          }
        }
      }
    } else {
      console.log('📋 [Branch] Processing select/textarea:', {
        tagName: target.tagName,
        value: inputValue,
        goTo: goToValue
      });
      
      // Select elements and textareas
      if (goToValue) {
        if (inputValue) {
          console.log('✅ [Branch] Element has value, activating branch:', { goToValue, inputValue });
          activateBranch(goToValue);
        } else {
          console.log('❌ [Branch] Element is empty, deactivating branch:', { goToValue });
          deactivateBranch(goToValue);
        }
      }
    }
  } catch (error) {
    console.error('💥 [Branch] Error handling branch trigger:', {
      error: error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      element: target,
      goToValue,
      inputValue,
      fieldName
    });
  }

  // Update step visibility if we have active conditions
  // Active conditions removed (was part of advanced skip logic)
  const activeConditions = {};
  if (Object.keys(activeConditions).length > 0) {
    console.log('🔄 [Branch] Updating step visibility based on active conditions:', {
      activeConditions,
      conditionCount: Object.keys(activeConditions).length
    });
    updateStepVisibility();
  } else {
    console.log('ℹ️ [Branch] No active conditions, skipping step visibility update');
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
 * Handle radio group state for branching
 */
function handleRadioGroupSelection(selectedRadio: HTMLInputElement): void {
  const groupName = selectedRadio.name;
  if (!groupName) return;

  const allRadiosInGroup = document.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
  allRadiosInGroup.forEach(radio => {
    const r = radio as HTMLInputElement;
    if (r !== selectedRadio) {
      const goToValue = getAttrValue(r, 'data-go-to');
      if (goToValue) {
        deactivateBranch(goToValue);
      }
    }
  });
}

/**
 * Activate a branch target
 */
function activateBranch(target: string | null): void {
  if (!target) return;
  // Active condition tracking removed (was part of advanced skip logic)
}

/**
 * Deactivate a branch target
 */
function deactivateBranch(target: string | null): void {
  if (!target) return;
  // Active condition tracking removed (was part of advanced skip logic)
  clearBranchFields(target);
}

/**
 * Update visibility of all conditional steps based on active branches
 */
function updateStepVisibility(): void {
  const allConditionalSteps = queryAllByAttr('[data-show-if]');
  // Active conditions removed (was part of advanced skip logic)
  const activeConditions = {};

  allConditionalSteps.forEach(step => {
    const condition = getAttrValue(step, 'data-show-if');
    const stepId = getAttrValue(step, 'data-answer');
    
    if (condition && stepId) {
      if (evaluateCondition(condition, activeConditions)) {
        showElement(step as HTMLElement);
        FormState.setStepVisibility(stepId, true);
        enableRequiredFields(step as HTMLElement);
      } else {
        hideElement(step as HTMLElement);
        FormState.setStepVisibility(stepId, false);
        disableRequiredFields(step as HTMLElement);
      }
    }
  });
}

/**
 * Enable required fields that were originally required
 */
function enableRequiredFields(stepElement: HTMLElement): void {
  const fields = stepElement.querySelectorAll('input, select, textarea');
  fields.forEach(field => {
    const input = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const originalRequired = input.getAttribute('data-original-required');
    if (originalRequired === 'true') {
      (input as HTMLInputElement).required = true;
    }
  });
}

/**
 * Disable required fields when step is hidden
 */
function disableRequiredFields(stepElement: HTMLElement): void {
  const fields = stepElement.querySelectorAll('input[required], select[required], textarea[required]');
  fields.forEach(field => {
    const input = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    input.setAttribute('data-original-required', 'true');
    (input as HTMLInputElement).required = false;
  });
}

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