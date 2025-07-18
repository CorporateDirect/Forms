/**
 * Multi-step form navigation module - SIMPLIFIED FOR LINEAR STRUCTURE
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
import { formEvents } from './events.js';

interface StepElement {
  element: HTMLElement;
  id: string;
  index: number;
}

let initialized = false;
let cleanupFunctions: (() => void)[] = [];
let eventCleanupFunctions: (() => void)[] = [];
let steps: StepElement[] = [];
let currentStepIndex = -1;
let currentStepId = '';
let stepHistory: string[] = [];

/**
 * Initialize multi-step functionality - SIMPLIFIED FOR LINEAR STRUCTURE
 */
export function initMultiStep(root: Document | Element = document): void {
  if (initialized) {
    logVerbose('MultiStep already initialized, cleaning up first');
    resetMultiStep();
  }

  console.log('🚀 [MultiStep] === LINEAR STRUCTURE INITIALIZATION ===');
  
  // SIMPLIFIED: Only find main steps, ignore step_items completely
  const stepElements = queryAllByAttr(SELECTORS.STEP, root);
  
  console.log('📋 [MultiStep] Found main steps:', {
    count: stepElements.length,
    selector: SELECTORS.STEP
  });

  if (stepElements.length === 0) {
    console.error('❌ [MultiStep] No main steps found!');
    return;
  }
  
  // SIMPLIFIED: Create steps array with only essential data
  steps = Array.from(stepElements).map((stepElement, index) => {
    // Look for data-answer on step_wrapper or step element
    const stepWrapper = stepElement.querySelector('.step_wrapper[data-answer]');
    let dataAnswer = stepWrapper ? getAttrValue(stepWrapper, 'data-answer') : getAttrValue(stepElement, 'data-answer');
    
    // Auto-generate if missing
    if (!dataAnswer) {
      dataAnswer = `step-${index}`;
      console.warn(`⚠️ [MultiStep] Auto-generated ID for step ${index}: ${dataAnswer}`);
    }
    
    console.log(`✅ [MultiStep] Registered main step ${index}: ${dataAnswer}`);

    return {
      element: stepElement as HTMLElement,
      id: dataAnswer,
      index: index
    };
  });
  
  console.log('📊 [MultiStep] Step registration complete:', {
    totalSteps: steps.length,
    stepIds: steps.map(s => s.id)
  });
  
  // SIMPLIFIED: Hide all steps initially
  steps.forEach((step, index) => {
    console.log(`🫥 [MultiStep] Hiding step ${index} (${step.id})`);
    hideElement(step.element);
  });

  // Set up navigation and events
  setupNavigationListeners(root);
  setupEventListeners();
  setupSkipListeners(root);

  // SIMPLIFIED: Show first step
  if (steps.length > 0) {
    console.log('🎬 [MultiStep] Showing initial step: 0');
    goToStep(0);
  }

  initialized = true;
  formEvents.registerModule('multiStep');
  
  console.log('✅ [MultiStep] Linear initialization complete');
}

/**
 * SIMPLIFIED: Event listeners for linear navigation only
 */
function setupEventListeners(): void {
  const stepNavigateCleanup = formEvents.on('step:navigate', (data: unknown) => {
    const eventData = data as { targetStepId?: string; reason?: string };
    console.log('🎯 [MultiStep] Navigation event received:', { 
      targetStepId: eventData.targetStepId, 
      reason: eventData.reason 
    });
    
    if (eventData.targetStepId) {
      goToStepById(eventData.targetStepId);
    }
  });

  eventCleanupFunctions.push(stepNavigateCleanup);
}

/**
 * SIMPLIFIED: Go to step by ID - linear navigation only
 */
export function goToStepById(stepId: string): void {
  console.log('🎯 [MultiStep] LINEAR NAVIGATION to:', stepId);
  
  if (!initialized) {
    console.error('❌ [MultiStep] Not initialized');
    return;
  }

  // SIMPLIFIED: Find step by ID
  const stepIndex = steps.findIndex(step => step.id === stepId);
  
  if (stepIndex === -1) {
    console.error('❌ [MultiStep] Step not found:', {
      searchedFor: stepId,
      availableSteps: steps.map(s => s.id),
      totalSteps: steps.length
    });
    
    // Debug: Check if step exists in DOM but wasn't registered
    const domElement = document.querySelector(`[data-answer="${stepId}"]`);
    if (domElement) {
      console.error('🔍 [MultiStep] Step exists in DOM but not registered:', {
        stepId,
        element: {
          tagName: domElement.tagName,
          id: domElement.id,
          className: domElement.className,
          hasStepAttribute: domElement.hasAttribute('data-form'),
          dataForm: getAttrValue(domElement, 'data-form')
        }
      });
    }
    return;
  }

  console.log('✅ [MultiStep] Found step, navigating:', {
    stepId,
    stepIndex,
    currentIndex: currentStepIndex
  });
  
  goToStep(stepIndex);
}

/**
 * SIMPLIFIED: Go to step by index - clean and simple
 */
export function goToStep(stepIndex: number): void {
  console.log('🎯 [MultiStep] LINEAR GO TO STEP:', {
    targetIndex: stepIndex,
    currentIndex: currentStepIndex,
    totalSteps: steps.length
  });

  if (!initialized || stepIndex < 0 || stepIndex >= steps.length) {
    console.error('❌ [MultiStep] Invalid navigation:', {
      initialized,
      stepIndex,
      totalSteps: steps.length
    });
    return;
  }

  const targetStep = steps[stepIndex];
  
  // SIMPLIFIED: Hide current step
  if (currentStepIndex !== -1 && currentStepIndex !== stepIndex) {
    const currentStep = steps[currentStepIndex];
    console.log('👋 [MultiStep] Hiding current step:', currentStep.id);
    hideElement(currentStep.element);
    currentStep.element.classList.remove('active-step');
  }

  // SIMPLIFIED: Show target step
  console.log('👁️ [MultiStep] Showing target step:', targetStep.id);
  showElement(targetStep.element);
  targetStep.element.classList.add('active-step');
  
  // Update tracking
  currentStepIndex = stepIndex;
  currentStepId = targetStep.id;
  
  // Update history
  if (stepHistory[stepHistory.length - 1] !== targetStep.id) {
    stepHistory.push(targetStep.id);
  }
  
  // Update navigation buttons
  updateNavigationButtons();

  // Emit event
  formEvents.emit('step:change', {
    currentStepIndex: stepIndex,
    currentStepId: targetStep.id,
  });

  console.log('✅ [MultiStep] Navigation complete:', {
    stepId: targetStep.id,
    isVisible: isVisible(targetStep.element),
    hasActiveClass: targetStep.element.classList.contains('active-step')
  });
  
  // Diagnose if still not visible
  if (!isVisible(targetStep.element)) {
    console.error('❌ [MultiStep] Step still not visible after show!');
    diagnoseVisibilityIssues(targetStep.element, targetStep.id);
  }
}

/**
 * SIMPLIFIED: Set up navigation event listeners - minimal implementation
 */
function setupNavigationListeners(root: Document | Element): void {
  const cleanup1 = delegateEvent(root, 'click', SELECTORS.NEXT_BTN, handleNextClick);
  const cleanup2 = delegateEvent(root, 'click', SELECTORS.BACK_BTN, handleBackClick);
  const cleanup3 = delegateEvent(root, 'click', SELECTORS.SUBMIT_BTN, handleSubmitClick);

  // ADDED: Handle radio buttons with data-go-to attributes directly
  const cleanup4 = delegateEvent(root, 'change', 'input[type="radio"][data-go-to]', handleRadioNavigation);
  const cleanup5 = delegateEvent(root, 'click', 'input[type="radio"][data-go-to]', handleRadioNavigation);

  cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4, cleanup5);
  
  logVerbose('Navigation listeners setup complete');
}

/**
 * ADDED: Handle radio button navigation directly (replaces branching module)
 */
function handleRadioNavigation(event: Event, target: Element): void {
  const radio = target as HTMLInputElement;
  
  console.log('🎯 [MultiStep] Radio button navigation:', {
    radioName: radio.name,
    radioValue: radio.value,
    isChecked: radio.checked,
    dataGoTo: getAttrValue(radio, 'data-go-to')
  });
  
  if (!radio.checked) {
    return; // Only handle checked radio buttons
  }
  
  const goToValue = getAttrValue(radio, 'data-go-to');
  
  if (!goToValue) {
    console.warn('⚠️ [MultiStep] Radio button missing data-go-to attribute');
    return;
  }
  
  // Apply active styling to radio button
  applyRadioActiveClass(radio);
  
  // Navigate directly to target step
  console.log('🚀 [MultiStep] Navigating to step via radio button:', goToValue);
  goToStepById(goToValue);
}

/**
 * ADDED: Apply active class to radio button (moved from branching module)
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
 * SIMPLIFIED: Set up skip functionality 
 */
function setupSkipListeners(root: Document | Element): void {
  const cleanup = delegateEvent(root, 'click', SELECTORS.SKIP, handleSkipButtonClick);
  cleanupFunctions.push(cleanup);
  logVerbose('Skip listeners setup complete');
}

/**
 * SIMPLIFIED: Handle next button click
 */
function handleNextClick(event: Event): void {
  event.preventDefault();
  const nextIndex = currentStepIndex + 1;
  if (nextIndex < steps.length) {
    goToStep(nextIndex);
  }
}

/**
 * SIMPLIFIED: Handle back button click
 */
function handleBackClick(event: Event): void {
  event.preventDefault();
  const previousIndex = currentStepIndex - 1;
  if (previousIndex >= 0) {
    goToStep(previousIndex);
  }
}

/**
 * SIMPLIFIED: Handle form submission
 */
function handleSubmitClick(event: Event): void {
  // Let form submit naturally
  logVerbose('Form submission - allowing default behavior');
}

/**
 * SIMPLIFIED: Handle skip button click
 */
function handleSkipButtonClick(event: Event, target: Element): void {
  event.preventDefault();
  
  const dataSkip = getAttrValue(target, 'data-skip');
  
  if (!dataSkip || dataSkip === 'true' || dataSkip === '') {
    return;
  }
  
  goToStepById(dataSkip);
}

/**
 * SIMPLIFIED: Update navigation button states
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
 * SIMPLIFIED: Reset multi-step state and cleanup
 */
function resetMultiStep(): void {
  if (!initialized) {
    logVerbose('Multi-step module not initialized, nothing to reset');
    return;
  }

  logVerbose('Resetting multi-step module');

  // Unregister this module
  formEvents.unregisterModule('multiStep');

  cleanupFunctions.forEach(fn => fn());
  cleanupFunctions = [];
  steps = [];
  currentStepIndex = -1;
  currentStepId = '';
  stepHistory = [];
  initialized = false;

  // Clean up event listeners
  eventCleanupFunctions.forEach(fn => fn());
  eventCleanupFunctions = [];

  logVerbose('Multi-step module reset');
}

/**
 * SIMPLIFIED: Diagnostic function to check for CSS conflicts that might prevent visibility
 */
function diagnoseVisibilityIssues(element: HTMLElement, stepId: string): void {
  const computedStyle = getComputedStyle(element);
  const parentElements: HTMLElement[] = [];
  
  // Walk up the DOM tree to find potential conflicting styles
  let currentElement: HTMLElement | null = element;
  while (currentElement && currentElement !== document.body) {
    parentElements.push(currentElement);
    currentElement = currentElement.parentElement;
  }
  
  console.log(`🔍 [MultiStep] Diagnosing visibility issues for step ${stepId}:`, {
    targetElement: {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      computedDisplay: computedStyle.display,
      computedVisibility: computedStyle.visibility,
      computedOpacity: computedStyle.opacity,
      inlineDisplay: element.style.display,
      inlineVisibility: element.style.visibility,
      inlineOpacity: element.style.opacity,
      hasHiddenClass: element.classList.contains('hidden-step'),
      isVisible: isVisible(element)
    },
    parentChain: parentElements.map(el => ({
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      computedDisplay: getComputedStyle(el).display,
      computedVisibility: getComputedStyle(el).visibility,
      computedOpacity: getComputedStyle(el).opacity,
      hasHiddenClass: el.classList.contains('hidden-step')
    })),
    possibleConflicts: {
      hasDisplayNone: computedStyle.display === 'none',
      hasVisibilityHidden: computedStyle.visibility === 'hidden',
      hasZeroOpacity: computedStyle.opacity === '0',
      hasHiddenClass: element.classList.contains('hidden-step'),
      parentWithDisplayNone: parentElements.some(el => getComputedStyle(el).display === 'none'),
      parentWithVisibilityHidden: parentElements.some(el => getComputedStyle(el).visibility === 'hidden')
    }
  });
} 