/**
 * Multi-step form navigation module
 */

import { SELECTORS, DEFAULTS, CSS_CLASSES } from '../config.js';
import { 
  logVerbose, 
  queryAllByAttr, 
  queryByAttr, 
  getAttrValue, 
  delegateEvent,
  showElement,
  hideElement,
  isVisible,
  addClass,
  removeClass
} from './utils.js';
import { FormState } from './formState.js';
import { getNextStep } from './branching.js';

interface StepElement {
  element: HTMLElement;
  id: string;
  index: number;
  type?: string;
  subtype?: string;
  number?: string;
}

let initialized = false;
let cleanupFunctions: (() => void)[] = [];
let steps: StepElement[] = [];
let currentStepIndex = 0;

/**
 * Initialize multi-step functionality
 */
export function initMultiStep(root: Document | Element = document): void {
  if (initialized) {
    logVerbose('MultiStep already initialized, cleaning up first');
    resetMultiStep();
  }

  logVerbose('Initializing multi-step navigation');

  // Find all step elements
  const stepElements = queryAllByAttr(SELECTORS.STEP, root);
  logVerbose(`Found ${stepElements.length} steps`);

  // Build step array
  steps = Array.from(stepElements).map((element, index) => {
    const htmlElement = element as HTMLElement;
    const stepId = getAttrValue(element, 'data-answer') || 
                   getAttrValue(element, 'id') || 
                   `step-${index + 1}`;
    
    const stepInfo: StepElement = {
      element: htmlElement,
      id: stepId,
      index,
      type: getAttrValue(element, 'data-step-type') || undefined,
      subtype: getAttrValue(element, 'data-step-subtype') || undefined,
      number: getAttrValue(element, 'data-step-number') || undefined
    };

    logVerbose(`Registering step ${index}`, {
      stepId,
      dataAnswer: getAttrValue(element, 'data-answer'),
      elementId: getAttrValue(element, 'id'),
      fallbackId: `step-${index + 1}`,
      type: stepInfo.type,
      element: htmlElement
    });

    // Register step in FormState
    FormState.setStepInfo(stepId, {
      type: stepInfo.type,
      subtype: stepInfo.subtype,
      number: stepInfo.number,
      visible: index === 0, // First step is visible by default
      visited: false
    });

    return stepInfo;
  });

  // Hide all steps initially - use more aggressive hiding
  steps.forEach((step, index) => {
    const element = step.element;
    // Multiple ways to hide the element to ensure it stays hidden
    element.style.display = 'none';
    element.style.visibility = 'hidden';
    addClass(element, 'hidden-step');
    removeClass(element, CSS_CLASSES.ACTIVE_STEP);
    
    // Set a data attribute to track intended visibility
    element.setAttribute('data-step-hidden', 'true');
    
    logVerbose(`Forcibly hiding step ${index}:`, {
      stepId: step.id,
      display: element.style.display,
      visibility: element.style.visibility,
      classes: element.className
    });
  });

  // Set up navigation event listeners
  setupNavigationListeners(root);

  // Initialize first step (this will show step 0 and hide others)
  if (steps.length > 0) {
    goToStep(0);
  }

  initialized = true;
  logVerbose('Multi-step initialization complete', { stepCount: steps.length });
}

/**
 * Set up navigation event listeners
 */
function setupNavigationListeners(root: Document | Element): void {
  // Next button clicks
  const cleanup1 = delegateEvent(
    root,
    'click',
    SELECTORS.NEXT_BTN,
    handleNextClick
  );

  // Back button clicks
  const cleanup2 = delegateEvent(
    root,
    'click',
    SELECTORS.BACK_BTN,
    handleBackClick
  );

  // Skip button clicks
  const cleanup3 = delegateEvent(
    root,
    'click',
    SELECTORS.SKIP,
    handleSkipClick
  );

  // Submit button clicks
  const cleanup4 = delegateEvent(
    root,
    'click',
    SELECTORS.SUBMIT,
    handleSubmitClick
  );

  cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4);
}

/**
 * Handle next button click
 */
function handleNextClick(event: Event, target: Element): void {
  event.preventDefault();
  logVerbose('Next button clicked');

  // Validate current step before proceeding
  const currentStep = getCurrentStep();
  if (!currentStep) return;

  // Check if current step has validation requirements
  const isValid = validateCurrentStep();
  if (!isValid) {
    logVerbose('Current step validation failed, staying on current step');
    return;
  }

  // Determine next step (considering branching logic)
  const nextStepId = getNextStep(currentStep.id);
  
  logVerbose('Next step determination', {
    currentStepId: currentStep.id,
    branchNextStepId: nextStepId,
    allStepIds: steps.map(s => ({ id: s.id, index: s.index }))
  });
  
  if (nextStepId) {
    // Branch-determined next step
    const nextStepIndex = findStepIndexById(nextStepId);
    logVerbose('Branch step lookup', {
      targetStepId: nextStepId,
      foundIndex: nextStepIndex,
      foundStep: nextStepIndex !== -1 ? steps[nextStepIndex] : null
    });
    
    if (nextStepIndex !== -1) {
      goToStep(nextStepIndex);
    } else {
      logVerbose(`Branch target step not found: ${nextStepId}`);
    }
  } else {
    // Sequential next step
    goToNextStep();
  }
}

/**
 * Handle back button click
 */
function handleBackClick(event: Event, target: Element): void {
  event.preventDefault();
  logVerbose('Back button clicked');
  
  goToPreviousStep();
}

/**
 * Handle skip button click
 */
function handleSkipClick(event: Event, target: Element): void {
  event.preventDefault();
  
  const skipTarget = getAttrValue(target, 'data-skip');
  logVerbose('Skip button clicked', { skipTarget });

  if (skipTarget) {
    const targetIndex = findStepIndexById(skipTarget);
    if (targetIndex !== -1) {
      // Mark skipped steps
      for (let i = currentStepIndex + 1; i < targetIndex; i++) {
        FormState.addSkippedStep(steps[i].id);
      }
      goToStep(targetIndex);
    } else {
      logVerbose(`Skip target step not found: ${skipTarget}`);
    }
  }
}

/**
 * Handle submit button click
 */
function handleSubmitClick(event: Event, target: Element): void {
  logVerbose('Submit button clicked');

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
 * Go to a specific step by index
 */
export function goToStep(stepIndex: number): void {
  if (stepIndex < 0 || stepIndex >= steps.length) {
    logVerbose(`Invalid step index: ${stepIndex}`);
    return;
  }

  const previousStepIndex = currentStepIndex;
  const newStep = steps[stepIndex];

  logVerbose(`Navigating to step ${stepIndex}`, {
    from: previousStepIndex,
    to: stepIndex,
    stepId: newStep.id
  });

  // Hide current step
  if (steps[currentStepIndex]) {
    hideStep(currentStepIndex);
  }

  // Update current step index
  currentStepIndex = stepIndex;

  // Show new step
  showStep(stepIndex);

  // Update FormState
  FormState.setCurrentStep(newStep.id);

  // Update navigation button states
  updateNavigationButtons();

  logVerbose(`Step navigation complete`, {
    currentStep: newStep.id,
    currentIndex: stepIndex
  });
}

/**
 * Show a specific step
 */
export function showStep(stepIndex: number): void {
  if (stepIndex < 0 || stepIndex >= steps.length) return;

  const step = steps[stepIndex];
  const element = step.element;
  
  // Remove all hiding methods
  element.style.display = '';
  element.style.visibility = '';
  removeClass(element, 'hidden-step');
  addClass(element, CSS_CLASSES.ACTIVE_STEP);
  element.removeAttribute('data-step-hidden');

  // Update FormState
  FormState.setStepInfo(step.id, { visible: true, visited: true });
  
  logVerbose(`Step shown: ${step.id} (index: ${stepIndex})`, {
    display: element.style.display,
    visibility: element.style.visibility,
    classes: element.className
  });
}

/**
 * Hide a specific step
 */
function hideStep(stepIndex: number): void {
  if (stepIndex < 0 || stepIndex >= steps.length) return;

  const step = steps[stepIndex];
  const element = step.element;
  
  // Apply all hiding methods
  element.style.display = 'none';
  element.style.visibility = 'hidden';
  addClass(element, 'hidden-step');
  removeClass(element, CSS_CLASSES.ACTIVE_STEP);
  element.setAttribute('data-step-hidden', 'true');

  // Update FormState (keep visited status)
  FormState.setStepInfo(step.id, { visible: false });
  
  logVerbose(`Step hidden: ${step.id} (index: ${stepIndex})`, {
    display: element.style.display,
    visibility: element.style.visibility,
    classes: element.className
  });
}

/**
 * Go to next step (sequential)
 */
function goToNextStep(): void {
  const nextIndex = currentStepIndex + 1;
  if (nextIndex < steps.length) {
    goToStep(nextIndex);
  } else {
    logVerbose('Already at last step');
  }
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
  const backButtons = queryAllByAttr(SELECTORS.BACK_BTN);
  const nextButtons = queryAllByAttr(SELECTORS.NEXT_BTN);
  const submitButtons = queryAllByAttr(SELECTORS.SUBMIT);

  // Back button state
  backButtons.forEach(btn => {
    const htmlBtn = btn as HTMLButtonElement;
    if (currentStepIndex === 0) {
      htmlBtn.disabled = true;
      addClass(btn, CSS_CLASSES.DISABLED);
    } else {
      htmlBtn.disabled = false;
      removeClass(btn, CSS_CLASSES.DISABLED);
    }
  });

  // Next/Submit button state
  const isLastStep = currentStepIndex === steps.length - 1;
  
  nextButtons.forEach(btn => {
    const htmlBtn = btn as HTMLButtonElement;
    if (isLastStep) {
      htmlBtn.style.display = 'none';
    } else {
      htmlBtn.style.display = '';
      htmlBtn.disabled = false;
      removeClass(btn, CSS_CLASSES.DISABLED);
    }
  });

  submitButtons.forEach(btn => {
    const htmlBtn = btn as HTMLButtonElement;
    if (isLastStep) {
      htmlBtn.style.display = '';
      htmlBtn.disabled = false;
      removeClass(btn, CSS_CLASSES.DISABLED);
    } else {
      htmlBtn.style.display = 'none';
    }
  });

  logVerbose('Navigation buttons updated', {
    currentStepIndex,
    isLastStep,
    backButtonsCount: backButtons.length,
    nextButtonsCount: nextButtons.length,
    submitButtonsCount: submitButtons.length
  });
}

/**
 * Validate current step (placeholder - will be enhanced by validation module)
 */
function validateCurrentStep(): boolean {
  const currentStep = getCurrentStep();
  if (!currentStep) return true;

  // Basic validation - check required fields
  const requiredInputs = currentStep.element.querySelectorAll('[required]');
  
  for (const input of requiredInputs) {
    const htmlInput = input as HTMLInputElement;
    if (!htmlInput.value.trim()) {
      logVerbose(`Required field empty: ${htmlInput.name || 'unnamed'}`);
      return false;
    }
  }

  return true;
}

/**
 * Validate all visible steps (placeholder - will be enhanced by validation module)
 */
function validateAllVisibleSteps(): boolean {
  let isValid = true;

  steps.forEach((step, index) => {
    if (FormState.isStepVisible(step.id)) {
      const requiredInputs = step.element.querySelectorAll('[required]');
      
      for (const input of requiredInputs) {
        const htmlInput = input as HTMLInputElement;
        if (!htmlInput.value.trim()) {
          logVerbose(`Required field empty in step ${step.id}: ${htmlInput.name || 'unnamed'}`);
          isValid = false;
        }
      }
    }
  });

  return isValid;
}

/**
 * Get current step information
 */
export function getCurrentStepInfo(): any {
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
  logVerbose('Resetting multi-step navigation');

  // Clean up event listeners
  cleanupFunctions.forEach(cleanup => cleanup());
  cleanupFunctions = [];

  // Hide all steps
  steps.forEach((step, index) => {
    hideStep(index);
  });

  // Reset state
  steps = [];
  currentStepIndex = 0;
  initialized = false;

  logVerbose('Multi-step reset complete');
}

/**
 * Get multi-step state for debugging
 */
export function getMultiStepState(): any {
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