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
  value: any;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
}

interface BranchRule {
  conditions: BranchCondition[];
  target: string;
  logic: 'and' | 'or';
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

  // Find all elements with branching triggers
  const branchTriggers = queryAllByAttr(SELECTORS.GO_TO, root);
  logVerbose(`Found ${branchTriggers.length} branch triggers`);

  // Find all conditional steps
  const conditionalSteps = queryAllByAttr(SELECTORS.ANSWER, root);
  logVerbose(`Found ${conditionalSteps.length} conditional steps`);

  // Set up event listeners for branching triggers
  setupBranchingListeners(root);

  // Don't update step visibility during initialization - let multi-step handle it
  // updateStepVisibility();

  initialized = true;
  logVerbose('Branching initialization complete');
}

/**
 * Set up event listeners for branching logic
 */
function setupBranchingListeners(root: Document | Element): void {
  // Listen for changes on elements with data-go-to
  const cleanup1 = delegateEvent(
    root,
    'change',
    SELECTORS.GO_TO,
    handleBranchTrigger
  );

  // Listen for input events (for real-time branching)
  const cleanup2 = delegateEvent(
    root,
    'input',
    SELECTORS.GO_TO,
    handleBranchTrigger
  );

  // Listen for click events on radio buttons and checkboxes
  const cleanup3 = delegateEvent(
    root,
    'click',
    SELECTORS.GO_TO,
    handleBranchTrigger
  );

  // COMPREHENSIVE RADIO BUTTON HANDLING for custom styling
  // Handle clicks on various parts of custom radio button structures
  const radioSelectors = [
    // Direct radio elements
    'input[type="radio"][data-go-to]',
    // Labels containing radio buttons
    'label.radio_field',
    'label.w-radio', 
    'label:has(input[type="radio"][data-go-to])',
    // Common custom radio elements
    '.radio_label',
    '.w-form-label',
    '.w-radio-input',
    '.radio_button',
    '.radio-button',
    '.form_checkbox-icon',
    '.w-checkbox-input',
    // Webflow specific
    '.w-form-formradioinput',
    '.radio_button-skip-step',
    // Generic clickable elements that might contain radio buttons
    '[data-go-to]',
    // Spans and divs inside labels
    'label span',
    'label div'
  ];

  // Set up comprehensive click handling
  radioSelectors.forEach(selector => {
    const cleanup = delegateEvent(
      root,
      'click',
      selector,
      handleUniversalRadioClick
    );
    cleanupFunctions.push(cleanup);
  });

  // Also listen for keyboard events (Enter/Space on focused elements)
  const cleanup5 = delegateEvent(
    root,
    'keydown',
    'label.radio_field, label.w-radio, [data-go-to]',
    handleRadioKeydown
  );

  cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup5);
}

/**
 * Universal handler for radio button clicks (handles all custom styling scenarios)
 */
function handleUniversalRadioClick(event: Event, target: Element): void {
  console.log('[FormLib] Universal radio click handler triggered', { 
    target, 
    tagName: target.tagName, 
    className: target.className,
    id: (target as HTMLElement).id
  });
  
  // Try to find the radio input in multiple ways
  let radioInput: HTMLInputElement | null = null;
  
  // Method 1: Direct click on radio input
  if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'radio') {
    const goTo = getAttrValue(target, 'data-go-to');
    if (goTo) {
      radioInput = target as HTMLInputElement;
      console.log('[FormLib] Direct radio input click detected');
    }
  }
  
  // Method 2: Click on element with data-go-to (find associated radio)
  if (!radioInput) {
    const goTo = getAttrValue(target, 'data-go-to');
    if (goTo) {
      // Look for radio input with same data-go-to value
      radioInput = document.querySelector(`input[type="radio"][data-go-to="${goTo}"]`) as HTMLInputElement;
      console.log('[FormLib] Found radio via data-go-to attribute', { goTo, radioInput });
    }
  }
  
  // Method 3: Look within clicked element for radio input
  if (!radioInput) {
    radioInput = target.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
    if (radioInput) {
      console.log('[FormLib] Found radio input inside clicked element');
    }
  }
  
  // Method 4: Look in parent elements (traverse up the DOM)
  if (!radioInput) {
    let currentElement = target.parentElement;
    while (currentElement && !radioInput) {
      radioInput = currentElement.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
      if (radioInput) {
        console.log('[FormLib] Found radio input in parent element', { parent: currentElement });
        break;
      }
      currentElement = currentElement.parentElement;
      // Prevent infinite loop - stop at form or body
      if (currentElement?.tagName === 'FORM' || currentElement?.tagName === 'BODY') {
        break;
      }
    }
  }
  
  // Method 5: Look for closest label and find radio inside it
  if (!radioInput) {
    const parentLabel = target.closest('label');
    if (parentLabel) {
      radioInput = parentLabel.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
      if (radioInput) {
        console.log('[FormLib] Found radio input in closest label');
      }
    }
  }
  
  if (!radioInput) {
    console.log('[FormLib] No radio input with data-go-to found after exhaustive search');
    // Debug: Show what we did find
    const anyRadio = target.querySelector('input[type="radio"]') || 
                     target.closest('label')?.querySelector('input[type="radio"]');
    if (anyRadio) {
      console.log('[FormLib] Found radio without data-go-to:', {
        radio: anyRadio,
        attributes: Array.from(anyRadio.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
      });
    }
    return;
  }
  
  const goToValue = getAttrValue(radioInput, 'data-go-to');
  console.log('[FormLib] Successfully found radio input', {
    radioInput,
    goTo: goToValue,
    name: radioInput.name,
    value: radioInput.value,
    checked: radioInput.checked
  });
  
  // Prevent the event from triggering multiple times
  event.preventDefault();
  event.stopPropagation();
  
  // Check/select the radio button
  radioInput.checked = true;
  
  // Apply active class styling
  applyRadioActiveClass(radioInput);
  
  // Trigger the branching logic
  const syntheticEvent = new Event('change', { bubbles: true });
  Object.defineProperty(syntheticEvent, 'target', { value: radioInput });
  
  console.log('[FormLib] Triggering branch logic for data-go-to:', goToValue);
  handleBranchTrigger(syntheticEvent, radioInput);
}

/**
 * Handle keyboard events on radio button labels
 */
function handleRadioKeydown(event: KeyboardEvent, target: Element): void {
  // Only handle Enter and Space keys
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }
  
  console.log('[FormLib] Radio keyboard event', { key: event.key, target });
  
  // Prevent default behavior and trigger click
  event.preventDefault();
  
  // Create a synthetic click event
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  
  // Trigger the universal click handler
  handleUniversalRadioClick(clickEvent, target);
}

/**
 * Handle branch trigger events
 */
function handleBranchTrigger(event: Event, target: Element): void {
  console.log('[FormLib] handleBranchTrigger called', {
    target,
    tagName: target.tagName,
    type: (target as HTMLInputElement).type,
    isFormInput: isFormInput(target)
  });
  
  if (!isFormInput(target)) {
    console.log('[FormLib] Target is not a form input, ignoring');
    return;
  }

  const goToValue = getAttrValue(target, 'data-go-to');
  const inputValue = getInputValue(target);

  console.log('[FormLib] Branch trigger activated', {
    element: target,
    goTo: goToValue,
    value: inputValue,
    type: (target as HTMLInputElement).type || target.tagName,
    checked: (target as HTMLInputElement).checked,
    name: (target as HTMLInputElement).name,
    allAttributes: Array.from(target.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
  });

  // Store the field value in state
  const fieldName = target.name || getAttrValue(target, 'data-step-field-name');
  if (fieldName) {
    FormState.setField(fieldName, inputValue);
  }

  // Handle different input types
  if (target instanceof HTMLInputElement) {
    if (target.type === 'radio' && target.checked) {
      // For radio buttons, first deactivate all other radio buttons in the same group
      handleRadioGroupSelection(target);
      
      // Apply active class styling
      applyRadioActiveClass(target);
      
      activateBranch(goToValue, target.value);
      // For radio buttons with data-go-to, trigger step_item visibility
      if (goToValue) {
        triggerStepItemVisibility(goToValue);
      }
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

  // Only update step visibility if we have active conditions
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
        if (radioLabel) {
          radioLabel.classList.remove(activeClass);
        }
      }
    });
  }
  
  // Add active class to the selected radio and its label
  selectedRadio.classList.add(activeClass);
  const parentLabel = selectedRadio.closest('label');
  if (parentLabel) {
    parentLabel.classList.add(activeClass);
  }
  
  logVerbose(`Applied active class to radio button: ${selectedRadio.name}`, {
    activeClass,
    radioClasses: selectedRadio.className,
    labelClasses: parentLabel?.className
  });
}

/**
 * Handle radio button group selection - deactivate other options in the same group
 */
function handleRadioGroupSelection(selectedRadio: HTMLInputElement): void {
  if (!selectedRadio.name) return;
  
  logVerbose(`Handling radio group selection for: ${selectedRadio.name}`, {
    selectedValue: selectedRadio.value,
    selectedGoTo: getAttrValue(selectedRadio, 'data-go-to')
  });
  
  // Find all radio buttons in the same group
  const radioGroup = document.querySelectorAll(`input[type="radio"][name="${selectedRadio.name}"]`);
  
  radioGroup.forEach(radio => {
    const htmlRadio = radio as HTMLInputElement;
    const radioGoTo = getAttrValue(htmlRadio, 'data-go-to');
    
    if (htmlRadio !== selectedRadio && radioGoTo) {
      // Deactivate this radio button's branch
      logVerbose(`Deactivating radio option: ${radioGoTo}`);
      deactivateBranch(radioGoTo);
      
      // Hide the corresponding step_item
      if (radioGoTo) {
        hideStepItem(radioGoTo);
      }
    }
  });
}

/**
 * Hide a specific step_item
 */
function hideStepItem(stepItemId: string): void {
  logVerbose(`Hiding step_item: ${stepItemId}`);
  
  // Import hideStepItem functionality from multiStep module
  import('./multiStep.js').then(({ hideStepItem: multiStepHideStepItem }) => {
    if (multiStepHideStepItem) {
      multiStepHideStepItem(stepItemId);
    }
  }).catch(error => {
    // If the function doesn't exist, we'll handle it manually
    logVerbose(`Manual step_item hiding for: ${stepItemId}`);
    const stepItemElements = document.querySelectorAll(`[data-answer="${stepItemId}"]`);
    stepItemElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.display = 'none';
      htmlElement.style.visibility = 'hidden';
      htmlElement.classList.add('hidden-step');
    });
  });
}

/**
 * Trigger step_item visibility based on radio button selection
 */
function triggerStepItemVisibility(stepItemId: string): void {
  logVerbose(`Triggering step_item visibility: ${stepItemId}`);
  
  // Import showStepItem dynamically to avoid circular dependency
  import('./multiStep.js').then(({ showStepItem }) => {
    showStepItem(stepItemId);
  }).catch(error => {
    console.warn('[FormLib] Failed to show step_item:', error);
  });
}

/**
 * Activate a branch path
 */
function activateBranch(target: string | null, value: any): void {
  if (!target) return;

  logVerbose(`Activating branch: ${target}`, { 
    value,
    valueType: typeof value,
    targetString: String(target)
  });

  // Set active condition in state
  FormState.setActiveCondition(target, value);

  // Clear fields from inactive branches
  clearInactiveBranchFields();
  
  // Log current active conditions after setting
  logVerbose('Active conditions after branch activation', {
    activeConditions: FormState.getBranchPath().activeConditions
  });
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
 * Get the next step based on current branching logic
 */
export function getNextStep(currentStep?: string): string | null {
  const activeConditions = FormState.getBranchPath().activeConditions;
  
  logVerbose('Evaluating next step', {
    currentStep,
    activeConditions
  });

  // Find the most relevant active condition
  for (const [target, value] of Object.entries(activeConditions)) {
    if (value !== null && value !== undefined && value !== '') {
      logVerbose(`Next step determined by branch: ${target}`);
      return target;
    }
  }

  // If no active conditions, return null (will fall back to sequential navigation)
  logVerbose('No active branch conditions, using sequential navigation');
  return null;
}

/**
 * Update step visibility based on current branching state
 */
function updateStepVisibility(): void {
  const conditionalSteps = queryAllByAttr(SELECTORS.ANSWER);
  const activeConditions = FormState.getBranchPath().activeConditions;

  logVerbose('Updating step visibility', { activeConditions });

  conditionalSteps.forEach(step => {
    const stepAnswer = getAttrValue(step, 'data-answer');
    const shouldBeVisible = shouldStepBeVisible(stepAnswer, activeConditions);

    // Update FormState
    if (stepAnswer) {
      FormState.setStepInfo(stepAnswer, { visible: shouldBeVisible });
    }

    // Update DOM visibility
    const htmlStep = step as HTMLElement;
    if (shouldBeVisible) {
      htmlStep.style.display = '';
      htmlStep.classList.remove('hidden-step');
      logVerbose(`Step made visible: ${stepAnswer}`);
    } else {
      htmlStep.style.display = 'none';
      htmlStep.classList.add('hidden-step');
      logVerbose(`Step hidden: ${stepAnswer}`);
    }
  });
}

/**
 * Determine if a step should be visible based on active conditions
 */
function shouldStepBeVisible(stepAnswer: string | null, activeConditions: Record<string, any>): boolean {
  if (!stepAnswer) return true;

  // Check if this step matches any active condition
  for (const [target, value] of Object.entries(activeConditions)) {
    if (target === stepAnswer && value !== null && value !== undefined && value !== '') {
      return true;
    }
  }

  return false;
}

/**
 * Clear fields from inactive branches
 */
function clearInactiveBranchFields(): void {
  const allSteps = queryAllByAttr(SELECTORS.STEP);
  const fieldsToKeep: string[] = [];
  const fieldsToClear: string[] = [];

  allSteps.forEach(step => {
    const stepAnswer = getAttrValue(step, 'data-answer');
    const isVisible = stepAnswer ? FormState.isStepVisible(stepAnswer) : true;

    // Get all form inputs in this step
    const inputs = step.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      const fieldName = (input as HTMLInputElement).name || 
                       getAttrValue(input, 'data-step-field-name');
      
      if (fieldName) {
        if (isVisible) {
          fieldsToKeep.push(fieldName);
        } else {
          fieldsToClear.push(fieldName);
        }
      }
    });
  });

  // Clear fields that are not in visible steps
  const uniqueFieldsToClear = fieldsToClear.filter(field => !fieldsToKeep.includes(field));
  if (uniqueFieldsToClear.length > 0) {
    FormState.clearFields(uniqueFieldsToClear);
  }
}

/**
 * Clear fields from a specific branch
 */
function clearBranchFields(branchTarget: string): void {
  const branchStep = queryByAttr(`[data-answer="${branchTarget}"]`);
  if (!branchStep) return;

  const inputs = branchStep.querySelectorAll('input, select, textarea');
  const fieldsToClear: string[] = [];

  inputs.forEach(input => {
    const fieldName = (input as HTMLInputElement).name || 
                     getAttrValue(input, 'data-step-field-name');
    if (fieldName) {
      fieldsToClear.push(fieldName);
    }
  });

  if (fieldsToClear.length > 0) {
    FormState.clearFields(fieldsToClear);
    logVerbose(`Cleared fields from branch ${branchTarget}`, fieldsToClear);
  }
}

/**
 * Evaluate complex branching conditions (for future enhancement)
 */
function evaluateConditions(conditions: BranchCondition[], logic: 'and' | 'or' = 'and'): boolean {
  if (conditions.length === 0) return true;

  const results = conditions.map(condition => {
    const fieldValue = FormState.getField(condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      default:
        return false;
    }
  });

  return logic === 'and' ? results.every(r => r) : results.some(r => r);
}

/**
 * Reset branching state and cleanup
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
export function getBranchingState(): any {
  return {
    initialized,
    activeConditions: FormState.getBranchPath().activeConditions,
    visibleSteps: Object.entries(FormState.getAllSteps())
      .filter(([_, info]) => info.visible)
      .map(([stepId, _]) => stepId)
  };
}

/**
 * Debug function to test radio button detection (can be called from console)
 */
function debugRadioButtons(): void {
  console.log('=== DEBUG: Radio Button Detection ===');
  
  // Find all radio buttons with data-go-to
  const radioButtons = document.querySelectorAll('input[type="radio"][data-go-to]');
  console.log(`Found ${radioButtons.length} radio buttons with data-go-to:`);
  
  radioButtons.forEach((radio, index) => {
    const htmlRadio = radio as HTMLInputElement;
    const goTo = getAttrValue(radio, 'data-go-to');
    const parentLabel = radio.closest('label');
    
    console.log(`Radio ${index}:`, {
      element: radio,
      name: htmlRadio.name,
      value: htmlRadio.value,
      goTo: goTo,
      checked: htmlRadio.checked,
      parentLabel: parentLabel,
      parentLabelClasses: parentLabel?.className,
      style: htmlRadio.style.cssText,
      allAttributes: Array.from(radio.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
    });
  });
  
  // Find all labels that might contain radio buttons
  const radioLabels = document.querySelectorAll('label.radio_field, label.w-radio');
  console.log(`Found ${radioLabels.length} radio labels:`);
  
  radioLabels.forEach((label, index) => {
    const radioInside = label.querySelector('input[type="radio"]');
    const goTo = radioInside ? getAttrValue(radioInside, 'data-go-to') : null;
    
    console.log(`Label ${index}:`, {
      element: label,
      className: label.className,
      radioInside: radioInside,
      goTo: goTo,
      radioName: radioInside ? (radioInside as HTMLInputElement).name : null
    });
  });
  
  console.log('=== END DEBUG ===');
}

/**
 * Test function to manually trigger radio button selection (can be called from console)
 */
function testRadioClick(goToValue: string): void {
  console.log(`=== TESTING: Manual radio click for ${goToValue} ===`);
  
  const radioButton = document.querySelector(`input[type="radio"][data-go-to="${goToValue}"]`) as HTMLInputElement;
  if (!radioButton) {
    console.error(`Radio button with data-go-to="${goToValue}" not found`);
    return;
  }
  
  console.log('Found radio button:', radioButton);
  
  // Manually trigger the selection
  radioButton.checked = true;
  applyRadioActiveClass(radioButton);
  
  // Create and dispatch events
  const changeEvent = new Event('change', { bubbles: true });
  const clickEvent = new Event('click', { bubbles: true });
  
  console.log('Dispatching events...');
  radioButton.dispatchEvent(clickEvent);
  radioButton.dispatchEvent(changeEvent);
  
  // Manually trigger branching logic
  console.log('Manually triggering branch logic...');
  handleBranchTrigger(changeEvent, radioButton);
  
  console.log('=== END TEST ===');
}

// Make debug functions available globally for console access
(window as any).debugRadioButtons = debugRadioButtons;
(window as any).testRadioClick = testRadioClick;

/**
 * Debug function to log current branching state (can be called from console)
 */
function debugBranching(): void {
  const activeConditions = FormState.getBranchPath().activeConditions;
  logVerbose('=== DEBUG: Branching State ===');
  logVerbose('Active Conditions:', activeConditions);
  
  // Find all elements with data-go-to
  const branchTriggers = queryAllByAttr(SELECTORS.GO_TO);
  logVerbose('All Branch Triggers:');
  branchTriggers.forEach((trigger, index) => {
    const goTo = getAttrValue(trigger, 'data-go-to');
    const htmlTrigger = trigger as HTMLElement;
    let value = '';
    let checked = false;
    let elementType = htmlTrigger.tagName;
    
    if (isFormInput(trigger)) {
      const inputValue = getInputValue(trigger);
      value = Array.isArray(inputValue) ? inputValue.join(', ') : inputValue;
      if (trigger instanceof HTMLInputElement) {
        checked = trigger.checked;
        elementType = trigger.type;
      }
    }
    
    logVerbose(`Trigger ${index}:`, {
      element: trigger,
      goTo: goTo,
      value: value,
      checked: checked,
      type: elementType
    });
  });
  
  // Find all steps with data-answer
  const answerSteps = queryAllByAttr(SELECTORS.ANSWER);
  logVerbose('All Answer Steps:');
  answerSteps.forEach((step, index) => {
    const answer = getAttrValue(step, 'data-answer');
    logVerbose(`Answer Step ${index}:`, {
      element: step,
      dataAnswer: answer,
      visible: (step as HTMLElement).style.display !== 'none'
    });
  });
  
  logVerbose('=== END DEBUG ===');
}

// Make debug function available globally
(window as any).debugBranching = debugBranching; 