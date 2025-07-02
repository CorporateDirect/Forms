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

  // SPECIAL HANDLING: Listen for clicks on radio button labels (Webflow custom styling)
  // This handles cases where radio inputs have opacity:0 and are positioned behind labels
  const cleanup4 = delegateEvent(
    root,
    'click',
    'label.radio_field, label.w-radio',
    handleRadioLabelClick
  );

  cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4);
}

/**
 * Handle clicks on radio button labels (for Webflow custom styling)
 */
function handleRadioLabelClick(event: Event, target: Element): void {
  console.log('[FormLib] Radio label clicked', { target, tagName: target.tagName, className: target.className });
  
  // Find the associated radio input within this label
  const radioInput = target.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
  
  if (!radioInput) {
    console.log('[FormLib] No radio input with data-go-to found in clicked label');
    // Also check for radio inputs without data-go-to for debugging
    const anyRadioInput = target.querySelector('input[type="radio"]') as HTMLInputElement;
    if (anyRadioInput) {
      console.log('[FormLib] Found radio input without data-go-to', {
        radioInput: anyRadioInput,
        goTo: getAttrValue(anyRadioInput, 'data-go-to'),
        name: anyRadioInput.name,
        value: anyRadioInput.value,
        allAttributes: Array.from(anyRadioInput.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
      });
    }
    return;
  }
  
  const goToValue = getAttrValue(radioInput, 'data-go-to');
  console.log('[FormLib] Found radio input in label', {
    radioInput,
    goTo: goToValue,
    name: radioInput.name,
    value: radioInput.value,
    allAttributes: Array.from(radioInput.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
  });
  
  // Check/select the radio button
  radioInput.checked = true;
  
  // Trigger the branching logic for this radio input
  const syntheticEvent = new Event('change', { bubbles: true });
  Object.defineProperty(syntheticEvent, 'target', { value: radioInput });
  
  console.log('[FormLib] Triggering branch logic for data-go-to:', goToValue);
  handleBranchTrigger(syntheticEvent, radioInput);
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