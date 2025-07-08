/**
 * Multi-step form navigation module
 */

import { SELECTORS } from '../config.js';
import { 
  logVerbose, 
  queryAllByAttr, 
  getAttrValue, 
  delegateEvent,
  showElement,
  hideElement,
  isVisible,
  removeClass
} from './utils.js';
import { FormState } from './formState.js';
import { initSkip, evaluateSkipConditions, resetSkip, setNavigationFunctions } from './skip.js';
import { setStepItemFunctions } from './branching.js';

interface StepElement {
  element: HTMLElement;
  id: string;
  index: number;
  type?: string;
  subtype?: string;
  number?: string;
  isStepItem?: boolean;
  parentStepIndex?: number;
}

let initialized = false;
let cleanupFunctions: (() => void)[] = [];
let steps: StepElement[] = [];
let stepItems: StepElement[] = [];
let currentStepIndex = -1; // Initialize to -1 to indicate no current step
let currentStepItemId: string | null = null;

/**
 * Initialize multi-step functionality
 */
export function initMultiStep(root: Document | Element = document): void {
  if (initialized) {
    logVerbose('MultiStep already initialized, cleaning up first');
    resetMultiStep();
  }

  logVerbose('Initializing multi-step navigation with step/step_item architecture');

  // Find all parent step elements
  const stepElements = queryAllByAttr(SELECTORS.STEP, root);
  
  steps = Array.from(stepElements).map((stepElement, index) => {
    logVerbose(`Processing step ${index}`, {
      element: stepElement,
      tagName: stepElement.tagName,
      id: stepElement.id,
      className: stepElement.className
    });

    // Look for data-answer on the step element itself first
    let dataAnswer = getAttrValue(stepElement, 'data-answer');
    
    // If not found, look for data-answer on step_wrapper child elements
    if (!dataAnswer) {
      const stepWrapper = stepElement.querySelector('.step_wrapper[data-answer]');
      if (stepWrapper) {
        dataAnswer = getAttrValue(stepWrapper, 'data-answer');
        logVerbose(`Found data-answer on step_wrapper child: ${dataAnswer}`);
      }
    }
    
    // If still not found, generate a default ID
    if (!dataAnswer) {
      dataAnswer = `step-${index}`;
      logVerbose(`Generated default step ID: ${dataAnswer}`);
    }

    const stepInfo: StepElement = {
      element: stepElement as HTMLElement,
      id: dataAnswer,
      index: index,
      type: getAttrValue(stepElement, 'data-step-type') || undefined,
      subtype: getAttrValue(stepElement, 'data-step-subtype') || undefined,
      number: getAttrValue(stepElement, 'data-step-number') || undefined,
      isStepItem: false
    };

    // Register step in FormState
    FormState.setStepInfo(dataAnswer, {
      type: stepInfo.type,
      subtype: stepInfo.subtype,
      number: stepInfo.number,
      visible: false, // All steps start hidden, goToStep(0) will show the first one
      visited: false
    });

    return stepInfo;
  });

  // Find all step_item elements within parent steps
  stepItems = [];
  steps.forEach((parentStep, parentIndex) => {
    // Look for step_item elements within this parent step
    const stepItemElements = parentStep.element.querySelectorAll('.step_item[data-answer], .step-item[data-answer]');
    
    logVerbose(`Found ${stepItemElements.length} step_items in parent step ${parentIndex} (${parentStep.id})`);
    
    stepItemElements.forEach((stepItemElement) => {
      const htmlElement = stepItemElement as HTMLElement;
      const dataAnswer = getAttrValue(stepItemElement, 'data-answer');
      
      if (!dataAnswer) {
        logVerbose(`Step item in parent step ${parentIndex} missing required data-answer attribute`);
        return;
      }
      
      const stepItemInfo: StepElement = {
        element: htmlElement,
        id: dataAnswer,
        index: stepItems.length, // Global step_item index
        type: getAttrValue(stepItemElement, 'data-step-type') || undefined,
        subtype: getAttrValue(stepItemElement, 'data-step-subtype') || undefined,
        number: getAttrValue(stepItemElement, 'data-step-number') || undefined,
        isStepItem: true,
        parentStepIndex: parentIndex
      };

      // Register step_item in FormState
      FormState.setStepInfo(dataAnswer, {
        type: stepItemInfo.type,
        subtype: stepItemInfo.subtype,
        number: stepItemInfo.number,
        visible: false, // Step items are hidden by default
        visited: false
      });

      stepItems.push(stepItemInfo);
      
      logVerbose(`Registered step_item: ${dataAnswer}`, {
        parentStepIndex: parentIndex,
        parentStepId: parentStep.id,
        stepItemIndex: stepItemInfo.index
      });
    });
  });

  // Hide all steps and step_items initially
  logVerbose('Starting to hide all steps initially', { totalSteps: steps.length, totalStepItems: stepItems.length });
  
  steps.forEach((step, index) => {
    logVerbose(`Hiding step ${index} (${step.id})`, {
      element: step.element,
      tagName: step.element.tagName,
      id: step.element.id,
      className: step.element.className,
      beforeHide: {
        display: step.element.style.display,
        visibility: step.element.style.visibility,
        computedDisplay: getComputedStyle(step.element).display,
        isVisible: isVisible(step.element)
      }
    });
    
    hideElement(step.element);
    
    logVerbose(`Step ${index} hidden`, {
      afterHide: {
        display: step.element.style.display,
        visibility: step.element.style.visibility,
        computedDisplay: getComputedStyle(step.element).display,
        isVisible: isVisible(step.element)
      }
    });
  });

  stepItems.forEach((stepItem, index) => {
    logVerbose(`Hiding stepItem ${index} (${stepItem.id})`);
    hideElement(stepItem.element);
  });
  
  logVerbose('Finished hiding all steps and step items');

  // Set up navigation event listeners
  setupNavigationListeners(root);

  // Initialize enhanced skip functionality
  initSkip(root);
  
  // Set navigation functions for skip module integration
  setNavigationFunctions(goToStepById, goToNextStep);
  
  // Set step item functions for branching module integration
  setStepItemFunctions(showStepItem, hideStepItem);

  // Initialize first step
  if (steps.length > 0) {
    logVerbose('=== INITIALIZING FIRST STEP ===');
    logVerbose('About to call goToStep(0)', {
      totalSteps: steps.length,
      currentStepIndex: currentStepIndex,
      firstStepId: steps[0].id,
      firstStepElement: {
        tagName: steps[0].element.tagName,
        id: steps[0].element.id,
        className: steps[0].element.className,
        display: steps[0].element.style.display,
        visibility: steps[0].element.style.visibility,
        computedDisplay: getComputedStyle(steps[0].element).display,
        isVisible: isVisible(steps[0].element)
      }
    });
    
    goToStep(0);
    
    logVerbose('=== FIRST STEP INITIALIZATION COMPLETE ===');
    logVerbose('After goToStep(0) call', {
      currentStepIndex: currentStepIndex,
      firstStepElement: {
        tagName: steps[0].element.tagName,
        id: steps[0].element.id,
        className: steps[0].element.className,
        display: steps[0].element.style.display,
        visibility: steps[0].element.style.visibility,
        computedDisplay: getComputedStyle(steps[0].element).display,
        isVisible: isVisible(steps[0].element)
      },
      formStateCurrentStep: FormState.getCurrentStep(),
      formStateFirstStepVisible: FormState.isStepVisible(steps[0].id)
    });
  }

  initialized = true;
  logVerbose('Multi-step initialization complete', { 
    parentStepCount: steps.length, 
    stepItemCount: stepItems.length 
  });
  
  // Debug: Log final step mapping for troubleshooting
  logVerbose('Final step mapping created', {
    parentSteps: steps.map(s => ({ index: s.index, id: s.id, dataAnswer: getAttrValue(s.element, 'data-answer') })),
    stepItems: stepItems.map(s => ({ index: s.index, id: s.id, parentIndex: s.parentStepIndex, dataAnswer: getAttrValue(s.element, 'data-answer') }))
  });
}

/**
 * Update required fields based on step_item subtype
 */
function updateRequiredFields(stepItemElement: HTMLElement, enable: boolean = true): void {
  const subtype = getAttrValue(stepItemElement, 'data-step-subtype');
  if (!subtype) return;
  
  logVerbose(`${enable ? 'Enabling' : 'Disabling'} required fields for subtype: ${subtype}`);
  
  // Find all fields with data-require-for-subtypes attribute in this step_item
  const conditionalFields = stepItemElement.querySelectorAll('[data-require-for-subtypes]');
  
  conditionalFields.forEach(field => {
    const requiredForSubtypes = field.getAttribute('data-require-for-subtypes');
    const htmlField = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    
    if (requiredForSubtypes && requiredForSubtypes.split(',').map(s => s.trim()).includes(subtype)) {
      if (enable) {
        htmlField.required = true;
        htmlField.disabled = false;
      } else {
        htmlField.required = false;
        htmlField.disabled = true;
        htmlField.value = '';
      }
    }
  });
}

/**
 * Show a specific step_item within its parent step
 */
export function showStepItem(stepItemId: string): void {
  logVerbose(`Attempting to show step_item: ${stepItemId}`);
  
  // Find step item by exact ID match
  const stepItem = stepItems.find(item => item.id === stepItemId);
  if (!stepItem) {
    // Try to find by data-answer attribute as fallback
    const stepItemByAnswer = stepItems.find(item => getAttrValue(item.element, 'data-answer') === stepItemId);
    if (stepItemByAnswer) {
      logVerbose(`Found step_item by data-answer: ${stepItemId}`);
      return showStepItem(stepItemByAnswer.id);
    }
    
    logVerbose(`Step item not found: ${stepItemId}`);
    return;
  }
  
  const parentStep = steps[stepItem.parentStepIndex!];
  if (!parentStep) {
    logVerbose(`Parent step not found for step_item: ${stepItemId}`);
    return;
  }

  logVerbose(`Showing step_item ${stepItemId} in parent step ${stepItem.parentStepIndex}`);

  // Hide all step_items in the parent step first
  const allStepItemsInParent = stepItems.filter(item => item.parentStepIndex === stepItem.parentStepIndex);
  
  allStepItemsInParent.forEach(item => {
    hideElement(item.element);
    updateRequiredFields(item.element, false);
    FormState.setStepVisibility(item.id, false);
  });

  // Show the target step_item
  showElement(stepItem.element);
  
  // Ensure parent containers are also visible
  let parentElement = stepItem.element.parentElement;
  while (parentElement && !parentElement.classList.contains('multi-form_step')) {
    if (parentElement.classList.contains('step_wrapper')) {
      parentElement.style.display = '';
      parentElement.style.visibility = '';
      removeClass(parentElement, 'hidden-step');
      removeClass(parentElement, 'hidden-step-item');
    }
    parentElement = parentElement.parentElement;
  }
  
  updateRequiredFields(stepItem.element, true);
  FormState.setStepVisibility(stepItemId, true);
  FormState.setStepInfo(stepItemId, { visited: true });
  
  currentStepItemId = stepItemId;
  
  logVerbose(`Successfully showed step_item: ${stepItemId}`);
}

/**
 * Hide a specific step_item
 */
export function hideStepItem(stepItemId: string): void {
  const stepItem = stepItems.find(item => item.id === stepItemId);
  if (!stepItem) {
    return;
  }

  hideElement(stepItem.element);
  updateRequiredFields(stepItem.element, false);
  FormState.setStepVisibility(stepItemId, false);
  
  if (currentStepItemId === stepItemId) {
    currentStepItemId = null;
  }
}

/**
 * Set up navigation event listeners
 */
function setupNavigationListeners(root: Document | Element): void {
  // Use event delegation for navigation buttons
  const cleanup1 = delegateEvent(root, 'click', SELECTORS.NEXT_BTN, handleNextClick);
  const cleanup2 = delegateEvent(root, 'click', SELECTORS.BACK_BTN, handleBackClick);
  const cleanup3 = delegateEvent(root, 'click', SELECTORS.SUBMIT_BTN, handleSubmitClick);

  cleanupFunctions.push(cleanup1, cleanup2, cleanup3);
  
  logVerbose('Navigation listeners setup complete (skip handling delegated to skip module)');
}

/**
 * Handle next button click
 * Validates the current step and moves to the next one.
 */
function handleNextClick(event: Event): void {
  event.preventDefault();
  goToNextStep();
}

/**
 * Handle back button click
 */
function handleBackClick(event: Event): void {
  event.preventDefault();
  goToPreviousStep();
}

/**
 * Handle form submission
 * This handler is mostly for single-step forms or the final step.
 */
function handleSubmitClick(event: Event): void {
  // Find the form
  const form = (event.target as Element).closest('form');
  if (!form) {
    logVerbose('Form not found, preventing submission');
    return;
  }

  // Validate all visible steps before submission
  const isFormValid = validateAllVisibleSteps();
  if (!isFormValid) {
    event.preventDefault();
    logVerbose('Form validation failed, preventing submission');
    return;
  }

  logVerbose('Form validation passed, allowing submission');
}

/**
 * Go to a step by ID (works for both parent steps and step_items)
 */
export function goToStepById(stepId: string): void {
  logVerbose('=== GO TO STEP BY ID FUNCTION START ===');
  logVerbose(`Navigating to step: ${stepId}`);
  
  // Debug: Log all available step IDs for comparison
  const allStepIds = steps.map(s => s.id);
  const allStepItemIds = stepItems.map(s => s.id);
  logVerbose('Available steps for navigation', {
    searchingFor: stepId,
    parentStepIds: allStepIds,
    stepItemIds: allStepItemIds,
    totalParentSteps: steps.length,
    totalStepItems: stepItems.length
  });
  
  // First check if it's a step_item
  const stepItem = stepItems.find(item => item.id === stepId);
  if (stepItem) {
    logVerbose(`✓ FOUND STEP_ITEM: ${stepId}`, {
      parentStepIndex: stepItem.parentStepIndex,
      stepItemIndex: stepItem.index,
      stepItemElement: {
        tagName: stepItem.element.tagName,
        id: stepItem.element.id,
        className: stepItem.element.className,
        dataAnswer: getAttrValue(stepItem.element, 'data-answer')
      }
    });
    
    // Navigate to the parent step first
    if (stepItem.parentStepIndex !== undefined) {
      logVerbose(`Navigating to parent step first: index ${stepItem.parentStepIndex}`);
      goToStep(stepItem.parentStepIndex);
      
      // Then show the specific step_item
      logVerbose(`Now showing specific step_item: ${stepId}`);
      showStepItem(stepId);
    }
    
    logVerbose('=== GO TO STEP BY ID FUNCTION END (STEP_ITEM) ===');
    return;
  } else {
    logVerbose(`Step ID ${stepId} not found in step_items`);
  }
  
  // Then check if it's a parent step
  const parentStepIndex = findStepIndexById(stepId);
  logVerbose(`findStepIndexById result for ${stepId}`, {
    foundIndex: parentStepIndex,
    isValidIndex: parentStepIndex !== -1
  });
  
  if (parentStepIndex !== -1) {
    logVerbose(`✓ FOUND PARENT STEP: ${stepId} at index ${parentStepIndex}`, {
      stepElement: {
        tagName: steps[parentStepIndex].element.tagName,
        id: steps[parentStepIndex].element.id,
        className: steps[parentStepIndex].element.className,
        dataAnswer: getAttrValue(steps[parentStepIndex].element, 'data-answer')
      }
    });
    
    currentStepItemId = null; // Clear step item tracking
    logVerbose(`Calling goToStep with index: ${parentStepIndex}`);
    goToStep(parentStepIndex);
    
    logVerbose('=== GO TO STEP BY ID FUNCTION END (PARENT_STEP) ===');
    return;
  }
  
  logVerbose(`❌ STEP NOT FOUND: ${stepId}`, {
    searchedIn: 'both parent steps and step_items',
    availableParentSteps: allStepIds,
    availableStepItems: allStepItemIds,
    suggestion: 'Check if the data-answer attribute exists on the target element'
  });
  
  logVerbose('=== GO TO STEP BY ID FUNCTION END (NOT_FOUND) ===');
}

/**
 * Validate a step element (works for both parent steps and step_items)
 */
function validateStepElement(element: HTMLElement): boolean {
  const inputs = element.querySelectorAll('input[required], select[required], textarea[required]');
  
  for (const input of inputs) {
    const htmlInput = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    
    // Skip validation for hidden elements
    if (!isVisible(htmlInput)) continue;
    
    // Check if the input has a value
    if (!htmlInput.value || htmlInput.value.trim() === '') {
      logVerbose('Validation failed: empty required field', {
        element: htmlInput,
        name: htmlInput.name,
        id: htmlInput.id
      });
      
      // Focus the invalid field
      htmlInput.focus();
      return false;
    }
    
    // Additional validation for email inputs
    if (htmlInput.type === 'email' && htmlInput.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(htmlInput.value)) {
        logVerbose('Validation failed: invalid email format');
        htmlInput.focus();
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Go to a specific step by index
 */
export function goToStep(stepIndex: number): void {
  logVerbose(`Attempting to go to step index: ${stepIndex}`, {
    currentIndex: currentStepIndex,
    totalSteps: steps.length,
    requestedIndex: stepIndex
  });

  if (stepIndex < 0 || stepIndex >= steps.length) {
    logVerbose(`Invalid step index: ${stepIndex}`, {
      min: 0,
      max: steps.length - 1,
      totalSteps: steps.length
    });
    return;
  }

  // Hide current step if there is one
  if (currentStepIndex !== -1 && currentStepIndex < steps.length) {
    const currentStep = steps[currentStepIndex];
    logVerbose(`Hiding current step: ${currentStepIndex} (${currentStep.id})`);
    hideStep(currentStepIndex);
  }

  // Show the new step
  const targetStep = steps[stepIndex];
  logVerbose(`Showing target step: ${stepIndex} (${targetStep.id})`, {
    stepElement: targetStep.element,
    stepType: targetStep.type,
    stepSubtype: targetStep.subtype
  });
  
  showStep(stepIndex);
  
  // Update current step index
  currentStepIndex = stepIndex;

  // Update form state with current step
  FormState.setCurrentStep(targetStep.id);
  
  // Update visibility of navigation buttons
  updateNavigationButtons();

  // Debug: Verify step is actually visible
  const isStepVisible = isVisible(targetStep.element);
  const stepDisplay = getComputedStyle(targetStep.element).display;
  const stepVisibility = getComputedStyle(targetStep.element).visibility;
  
  logVerbose(`Step navigation complete`, {
    newCurrentIndex: currentStepIndex,
    stepId: targetStep.id,
    elementVisible: isStepVisible,
    elementDisplay: stepDisplay,
    elementVisibility: stepVisibility,
    elementHasContent: targetStep.element.children.length > 0
  });
}

/**
 * Show a step by its index
 */
export function showStep(stepIndex: number): void {
  if (stepIndex < 0 || stepIndex >= steps.length) {
    logVerbose(`Cannot show step - invalid index: ${stepIndex}`);
    return;
  }
  
  const step = steps[stepIndex];
  logVerbose(`Showing step ${stepIndex} (${step.id})`, {
    elementBefore: {
      display: getComputedStyle(step.element).display,
      visibility: getComputedStyle(step.element).visibility,
      isVisible: isVisible(step.element)
    }
  });
  
  showElement(step.element);
  FormState.setStepVisibility(step.id, true);
  
  // Also show any visible step_items within this step
  const stepItemsInThisStep = stepItems.filter(item => item.parentStepIndex === stepIndex);
  logVerbose(`Step ${stepIndex} contains ${stepItemsInThisStep.length} step items`);
  
  stepItems.forEach(item => {
    if (item.parentStepIndex === stepIndex && FormState.isStepVisible(item.id)) {
      logVerbose(`Showing step item: ${item.id} within step ${stepIndex}`);
      showElement(item.element);
    }
  });
  
  // Debug: Check final state
  const elementAfter = {
    display: getComputedStyle(step.element).display,
    visibility: getComputedStyle(step.element).visibility,
    isVisible: isVisible(step.element),
    hasChildren: step.element.children.length,
    innerHTML: step.element.innerHTML.length > 0
  };
  
  logVerbose(`Step ${stepIndex} show complete`, {
    stepId: step.id,
    elementAfter,
    stepItemCount: stepItemsInThisStep.length
  });
}

/**
 * Hide a step by its index
 */
function hideStep(stepIndex: number): void {
  if (stepIndex < 0 || stepIndex >= steps.length) {
    return;
  }
  
  const step = steps[stepIndex];
  hideElement(step.element);
  FormState.setStepVisibility(step.id, false);
  
  // Also hide all step_items within this step
  stepItems.forEach(item => {
    if (item.parentStepIndex === stepIndex) {
      hideElement(item.element);
    }
  });

  logVerbose(`Hiding step ${stepIndex} (${step.id})`);
}

/**
 * Go to next step (sequential) - restored original logic with skip integration
 */
function goToNextStep(): void {
  logVerbose('=== GO TO NEXT STEP FUNCTION START ===');
  
  const currentStep = getCurrentStep();
  if (!currentStep) {
    logVerbose('No current step found');
    return;
  }

  logVerbose('Current step info', {
    stepId: currentStep.id,
    stepIndex: currentStepIndex,
    stepElement: {
      tagName: currentStep.element.tagName,
      id: currentStep.element.id,
      className: currentStep.element.className
    }
  });

  // Only evaluate skip conditions, don't add validation barriers
  logVerbose('Evaluating skip conditions...');
  evaluateSkipConditions();

  // Use original simple next step logic
  const nextIndex = currentStepIndex + 1;
  logVerbose('Sequential navigation logic', {
    currentIndex: currentStepIndex,
    nextIndex,
    totalSteps: steps.length,
    hasNextStep: nextIndex < steps.length
  });

  if (nextIndex < steps.length) {
    logVerbose(`Going to next sequential step: index ${nextIndex}`);
    goToStep(nextIndex);
  } else {
    logVerbose('Already at last step');
  }
  
  logVerbose('=== GO TO NEXT STEP FUNCTION END ===');
}

/**
 * Go to previous step
 */
function goToPreviousStep(): void {
  // Try to get previous step from FormState (handles branching)
  const previousStepId = FormState.goToPreviousStep();
  
  if (previousStepId) {
    const previousIndex = findStepIndexById(previousStepId);
    if (previousIndex !== -1) {
      goToStep(previousIndex);
      return;
    }
  }

  // Fallback to sequential previous step
  const previousIndex = currentStepIndex - 1;
  if (previousIndex >= 0) {
    goToStep(previousIndex);
  } else {
    logVerbose('Already at first step');
  }
}

/**
 * Find step index by step ID
 */
function findStepIndexById(stepId: string): number {
  return steps.findIndex(step => step.id === stepId);
}

/**
 * Get current step
 */
function getCurrentStep(): StepElement | null {
  return steps[currentStepIndex] || null;
}

/**
 * Update navigation button states
 */
function updateNavigationButtons(): void {
  const nextBtn = document.querySelector(SELECTORS.NEXT_BTN);
  const backBtn = document.querySelector(SELECTORS.BACK_BTN);
  const submitBtn = document.querySelector(SELECTORS.SUBMIT_BTN);

  if (!nextBtn || !backBtn || !submitBtn) return;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Back button visibility
  (backBtn as HTMLElement).style.display = isFirstStep ? 'none' : '';

  // Next/Submit button visibility
  if (isLastStep) {
    (nextBtn as HTMLElement).style.display = 'none';
    (submitBtn as HTMLElement).style.display = '';
  } else {
    (nextBtn as HTMLElement).style.display = '';
    (submitBtn as HTMLElement).style.display = 'none';
  }
}

/**
 * Validate all visible steps
 */
function validateAllVisibleSteps(): boolean {
  for (const step of steps) {
    if (FormState.isStepVisible(step.id)) {
      if (!validateStepElement(step.element)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Get current step information
 */
export function getCurrentStepInfo(): Record<string, unknown> {
  const currentStep = getCurrentStep();
  return {
    step: currentStep,
    index: currentStepIndex,
    totalSteps: steps.length,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1
  };
}

/**
 * Reset multi-step state and cleanup
 */
function resetMultiStep(): void {
  // Clear all event listeners
  cleanupFunctions.forEach(cleanup => cleanup());
  cleanupFunctions = [];

  // Reset skip functionality
  resetSkip();

  // Reset state variables
  steps = [];
  stepItems = [];
  currentStepIndex = -1; // Reset to -1
  currentStepItemId = null;
  initialized = false;
  
  logVerbose('Multi-step module reset');
}

/**
 * Get multi-step state for debugging
 */
export function getMultiStepState(): Record<string, unknown> {
  return {
    initialized,
    currentStepIndex,
    totalSteps: steps.length,
    steps: steps.map(step => ({
      id: step.id,
      index: step.index,
      visible: isVisible(step.element),
      type: step.type,
      subtype: step.subtype,
      number: step.number
    }))
  };
} 