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

  cleanupFunctions.push(cleanup1, cleanup2, cleanup3);
}

/**
 * Handle branch trigger events
 */
function handleBranchTrigger(event: Event, target: Element): void {
  if (!isFormInput(target)) return;

  const goToValue = getAttrValue(target, 'data-go-to');
  const inputValue = getInputValue(target);

  logVerbose('Branch trigger activated', {
    element: target,
    goTo: goToValue,
    value: inputValue,
    type: target.type || target.tagName
  });

  // Store the field value in state
  const fieldName = target.name || getAttrValue(target, 'data-step-field-name');
  if (fieldName) {
    FormState.setField(fieldName, inputValue);
  }

  // Handle different input types
  if (target instanceof HTMLInputElement) {
    if (target.type === 'radio' && target.checked) {
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