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
import { showStepItem as multiStepShowStepItem, hideStepItem as multiStepHideStepItem } from './multiStep.js';

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
  console.log('[FormLib] Setting up branching event listeners on:', root);

  // Listen for changes on elements with data-go-to
  const cleanup1 = delegateEvent(
    root,
    'change',
    SELECTORS.GO_TO,
    handleBranchTrigger
  );
  console.log('[FormLib] Set up CHANGE listener for:', SELECTORS.GO_TO);

  // Listen for input events (for real-time branching)
  const cleanup2 = delegateEvent(
    root,
    'input',
    SELECTORS.GO_TO,
    handleBranchTrigger
  );
  console.log('[FormLib] Set up INPUT listener for:', SELECTORS.GO_TO);

  // Listen for click events on radio buttons and checkboxes
  const cleanup3 = delegateEvent(
    root,
    'click',
    SELECTORS.GO_TO,
    handleBranchTrigger
  );
  console.log('[FormLib] Set up CLICK listener for:', SELECTORS.GO_TO);

  // COMPREHENSIVE RADIO BUTTON HANDLING for custom styling
  // Prioritize the most specific visual radio elements first
  const radioSelectors = [
    // HIGHEST PRIORITY: Visual radio button elements (what users actually click)
    '.radio_button-skip-step',
    '.w-form-formradioinput',
    '.w-radio-input',
    // SECONDARY: Entire radio field wrapper
    '.radio_field',
    'label.radio_field',
    // Webflow radio wrappers
    '.w-radio',
    'label.w-radio',
    // Any element with data-go-to attribute (for direct targeting)
    '[data-go-to]',
    // Direct radio input elements (fallback)
    'input[type="radio"][data-go-to]',
    // Radio components and containers
    '.radio_component',
    '.radio-component',
    '.form_radio',
    '.form-radio',
    // Radio button parts and labels (for nested structures)
    '.radio_label',
    '.w-form-label',
    '.radio_button',
    '.radio-button',
    // Spans and divs inside radio fields
    '.radio_field span',
    '.radio_field div',
    'label.radio_field span',
    'label.radio_field div'
  ];

  console.log('[FormLib] Setting up comprehensive radio button listeners for selectors:', radioSelectors);

  // Set up comprehensive click handling
  radioSelectors.forEach((selector, index) => {
    const elementsFound = root.querySelectorAll(selector);
    console.log(`[FormLib] Selector ${index} "${selector}" found ${elementsFound.length} elements`);
    
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
  console.log('[FormLib] Set up KEYDOWN listener for radio elements');

  // ADD GLOBAL CLICK LISTENER for debugging
  const globalClickCleanup = delegateEvent(
    root,
    'click',
    '*',
    (event: Event, target: Element) => {
      const htmlTarget = target as HTMLElement;
      if (htmlTarget.tagName === 'INPUT' || 
          htmlTarget.className.includes('radio') || 
          htmlTarget.closest('label') ||
          getAttrValue(target, 'data-go-to')) {
        
        // Try to find the radio input in multiple ways
        let dataGoToValue = getAttrValue(target, 'data-go-to');
        let radioInput: HTMLInputElement | null = null;
        
        // Method 1: Direct click on radio input
        if (htmlTarget.tagName === 'INPUT' && (htmlTarget as HTMLInputElement).type === 'radio') {
          radioInput = htmlTarget as HTMLInputElement;
          dataGoToValue = getAttrValue(radioInput, 'data-go-to');
        }
        
        // Method 2: Click on label - find radio input inside
        else if (htmlTarget.tagName === 'LABEL' && !dataGoToValue) {
          radioInput = htmlTarget.querySelector('input[type="radio"]') as HTMLInputElement;
          if (radioInput) {
            dataGoToValue = getAttrValue(radioInput, 'data-go-to');
          }
        }
        
        // Method 3: Click on visual radio elements (.radio_button-skip-step, etc.)
        else if (!dataGoToValue && (htmlTarget.classList.contains('radio_button-skip-step') || 
                                   htmlTarget.classList.contains('w-form-formradioinput') ||
                                   htmlTarget.classList.contains('w-radio-input'))) {
          const parentLabel = htmlTarget.closest('label');
          if (parentLabel) {
            radioInput = parentLabel.querySelector('input[type="radio"]') as HTMLInputElement;
            if (radioInput) {
              dataGoToValue = getAttrValue(radioInput, 'data-go-to');
            }
          }
        }
        
        // Method 4: Click on span or other element inside label - traverse up to find label
        else if (!dataGoToValue) {
          const parentLabel = htmlTarget.closest('label');
          if (parentLabel) {
            radioInput = parentLabel.querySelector('input[type="radio"]') as HTMLInputElement;
            if (radioInput) {
              dataGoToValue = getAttrValue(radioInput, 'data-go-to');
            }
          }
        }
        
        console.log('[FormLib] GLOBAL CLICK detected on potentially relevant element:', {
          target,
          tagName: htmlTarget.tagName,
          className: htmlTarget.className,
          id: htmlTarget.id,
          dataGoTo: dataGoToValue,
          isInput: htmlTarget.tagName === 'INPUT',
          inputType: htmlTarget.tagName === 'INPUT' ? (htmlTarget as HTMLInputElement).type : null,
          closestLabel: htmlTarget.closest('label'),
          closestLabelClasses: htmlTarget.closest('label')?.className,
          radioInput: radioInput,
          radioInputDataGoTo: radioInput ? getAttrValue(radioInput, 'data-go-to') : null,
          radioInputName: radioInput ? radioInput.name : null,
          radioInputValue: radioInput ? radioInput.value : null,
          searchMethod: radioInput ? (
            htmlTarget.tagName === 'INPUT' ? 'Direct input click' :
            htmlTarget.tagName === 'LABEL' ? 'Label click' :
            'Traversed up to label'
          ) : 'Not found',
          event: event
        });
        
        // If we found a radio input with data-go-to, trigger the branching logic
        if (radioInput && dataGoToValue) {
          console.log('[FormLib] Triggering branching logic from global click detection');
          
          // Check the radio button
          radioInput.checked = true;
          
          // Apply active class styling
          applyRadioActiveClass(radioInput);
          
          // Create synthetic change event and trigger branching
          const syntheticEvent = new Event('change', { bubbles: true });
          Object.defineProperty(syntheticEvent, 'target', { value: radioInput });
          
          handleBranchTrigger(syntheticEvent, radioInput);
        }
      }
    }
  );

  cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup5, globalClickCleanup);
  console.log('[FormLib] Total event listeners set up:', cleanupFunctions.length);
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
  
  // Method 2: Click on .radio_field wrapper - find radio input inside
  if (!radioInput && (target as HTMLElement).classList.contains('radio_field')) {
    radioInput = target.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
    if (radioInput) {
      console.log('[FormLib] Found radio input inside .radio_field wrapper');
    }
  }
  
  // Method 2.5: Click on .radio_button-skip-step or similar visual radio elements
  if (!radioInput && ((target as HTMLElement).classList.contains('radio_button-skip-step') || 
                      (target as HTMLElement).classList.contains('w-form-formradioinput') ||
                      (target as HTMLElement).classList.contains('w-radio-input'))) {
    // Look in the parent label for the radio input
    const parentLabel = target.closest('label');
    if (parentLabel) {
      radioInput = parentLabel.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
      if (radioInput) {
        console.log('[FormLib] Found radio input in parent label from visual radio element click');
      }
    }
  }
  
  // Method 3: Click on element with data-go-to (find associated radio)
  if (!radioInput) {
    const goTo = getAttrValue(target, 'data-go-to');
    if (goTo) {
      // Look for radio input with same data-go-to value
      radioInput = document.querySelector(`input[type="radio"][data-go-to="${goTo}"]`) as HTMLInputElement;
      console.log('[FormLib] Found radio via data-go-to attribute', { goTo, radioInput });
    }
  }
  
  // Method 4: Look within clicked element for radio input
  if (!radioInput) {
    radioInput = target.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
    if (radioInput) {
      console.log('[FormLib] Found radio input inside clicked element');
    }
  }
  
  // Method 5: Look in parent elements (traverse up the DOM)
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
  
  // Method 6: Look for closest .radio_field or label and find radio inside it
  if (!radioInput) {
    const parentRadioField = target.closest('.radio_field, label.radio_field, .w-radio, label.w-radio');
    if (parentRadioField) {
      radioInput = parentRadioField.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
      if (radioInput) {
        console.log('[FormLib] Found radio input in closest radio field wrapper');
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
  logVerbose(`Hiding step_item via multiStep: ${stepItemId}`);
  if (typeof multiStepHideStepItem === 'function') {
    multiStepHideStepItem(stepItemId);
  }
}

/**
 * Trigger step_item visibility based on radio button selection
 */
function triggerStepItemVisibility(stepItemId: string): void {
  logVerbose(`Triggering step_item visibility via multiStep: ${stepItemId}`);
  if (typeof multiStepShowStepItem === 'function') {
    multiStepShowStepItem(stepItemId);
  }
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

  /*
   * Iterate through activeConditions in insertion order and return the first
   * branch target that:
   * 1. Has a non-null / non-empty value (i.e. branch is active)
   * 2. Is NOT the current step we are on (prevents immediate loops)
   * 3. Has NOT already been visited according to FormState (prevents back-tracking)
   */
  for (const [target, value] of Object.entries(activeConditions)) {
    const isActive = value !== null && value !== undefined && value !== '';
    const isCurrent = target === currentStep;
    const wasVisited = FormState.wasStepVisited(target);

    logVerbose('Branch candidate', { target, value, isActive, isCurrent, wasVisited });

    if (isActive && !isCurrent && !wasVisited) {
      logVerbose(`Next step determined by branch: ${target}`);
      return target;
    }
  }

  // If every active branch target was already visited (or none active), fall back to sequential navigation
  logVerbose('No suitable active branch target found, using sequential navigation');
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