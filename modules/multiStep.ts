/**
 * Multi-step form navigation module - UPDATED FOR NEW SIMPLIFIED STRUCTURE
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
import { validateStep, validateAllVisibleFields } from './validation.js';
import { showError } from './errors.js';

interface StepElement {
  element: HTMLElement;
  id: string;
  index: number;
  isBranch: boolean;
  parentStepElement?: HTMLElement;
}

let initialized = false;
let cleanupFunctions: (() => void)[] = [];
let eventCleanupFunctions: (() => void)[] = [];
let steps: StepElement[] = [];
let currentStepIndex = -1;
let currentStepId = '';
let stepHistory: string[] = [];
let navigatedSteps: Set<string> = new Set(); // Track which steps have been navigated to

/**
 * Initialize multi-step functionality - UPDATED FOR NEW STRUCTURE
 */
export function initMultiStep(root: Document | Element = document): void {
  if (initialized) {
    logVerbose('MultiStep already initialized, cleaning up first');
    resetMultiStep();
  }

  console.log('🚀 [MultiStep] === UPDATED STRUCTURE INITIALIZATION ===');
  
  // NEW: Find all step_wrapper elements with data-answer attributes
  const stepWrappers = root.querySelectorAll('.step_wrapper[data-answer]');
  
  console.log('📋 [MultiStep] Found step wrappers with data-answer:', {
    count: stepWrappers.length,
    selector: '.step_wrapper[data-answer]'
  });

  if (stepWrappers.length === 0) {
    console.error('❌ [MultiStep] No step wrappers with data-answer found!');
    return;
  }
  
  // NEW: Create steps array from step_wrapper elements
  steps = Array.from(stepWrappers).map((stepWrapper, index) => {
    const dataAnswer = getAttrValue(stepWrapper, 'data-answer');
    const isBranch = getAttrValue(stepWrapper, 'data-branch') === 'true';
    const parentStepElement = stepWrapper.closest('[data-form="step"]') as HTMLElement;
    
    console.log(`✅ [MultiStep] Registered step wrapper ${index}:`, {
      id: dataAnswer,
      isBranch,
      hasParentStep: !!parentStepElement,
      element: {
        tagName: stepWrapper.tagName,
        className: stepWrapper.className
      }
    });

    return {
      element: stepWrapper as HTMLElement,
      id: dataAnswer || `step-${index}`,
      index: index,
      isBranch,
      parentStepElement
    };
  });
  
  console.log('📊 [MultiStep] Step registration complete:', {
    totalSteps: steps.length,
    stepIds: steps.map(s => s.id),
    branchSteps: steps.filter(s => s.isBranch).map(s => s.id),
    regularSteps: steps.filter(s => !s.isBranch).map(s => s.id)
  });
  
  // Hide all steps initially EXCEPT step-0
  steps.forEach((step, index) => {
    if (step.id === 'step-0') {
      console.log(`👁️ [MultiStep] Keeping step-0 visible for progressive disclosure`);
      // Ensure step-0 is visible from the start
      showElement(step.element);
      step.element.classList.add('active-step');
    } else {
      console.log(`🫥 [MultiStep] Hiding step ${index} (${step.id})`);
      hideElement(step.element);
    }
  });

  // Set up navigation and events
  setupNavigationListeners(root);
  setupEventListeners();
  setupSkipListeners(root);

  // Initialize to step 0 for progressive disclosure
  if (steps.length > 0) {
    const step0Index = steps.findIndex(s => s.id === 'step-0');
    if (step0Index !== -1) {
      console.log('🎬 [MultiStep] Progressive disclosure: Setting step-0 as current');
      currentStepIndex = step0Index;
      currentStepId = 'step-0';
      stepHistory = ['step-0'];
      navigatedSteps.add('step-0');
      
      // Ensure step-0 is properly visible
      const step0 = steps[step0Index];
      showElement(step0.element);
      step0.element.classList.add('active-step');
      
      // Update navigation buttons for step-0
      updateNavigationButtons();
      
      // Emit initial step event
      formEvents.emit('step:change', {
        currentStepIndex: step0Index,
        currentStepId: 'step-0',
        navigatedSteps: Array.from(navigatedSteps),
        isBranchStep: step0.isBranch
      });
    } else {
      console.log('🎬 [MultiStep] No step-0 found, showing first step');
      goToStep(0);
    }
  }

  initialized = true;
  formEvents.registerModule('multiStep');
  
  console.log('✅ [MultiStep] Updated structure initialization complete');
}

/**
 * Get list of navigated step IDs for validation scoping
 */
export function getNavigatedSteps(): string[] {
  return Array.from(navigatedSteps);
}

/**
 * Debug function to diagnose step visibility and registration issues
 */
export function debugStepSystem(): void {
  console.log('🔍 [MultiStep] === STEP SYSTEM DEBUG ===');
  
  console.log('📊 Registered Steps:', {
    totalSteps: steps.length,
    currentStepIndex,
    currentStepId,
    navigatedStepsCount: navigatedSteps.size
  });
  
  steps.forEach((step, index) => {
    const isCurrentStep = index === currentStepIndex;
    const isNavigated = navigatedSteps.has(step.id);
    const elementVisible = isVisible(step.element);
    
    console.log(`${isCurrentStep ? '👁️' : '💤'} Step ${index} (${step.id}):`, {
      isBranch: step.isBranch,
      isNavigated,
      isCurrentStep,
      elementVisible,
      elementDisplay: getComputedStyle(step.element).display,
      elementVisibility: getComputedStyle(step.element).visibility,
      hasActiveClass: step.element.classList.contains('active-step'),
      hasHiddenClass: step.element.classList.contains('hidden-step'),
      elementClasses: step.element.className
    });
  });
  
  console.log('📜 Navigation History:', stepHistory);
  console.log('🗂️ Navigated Steps:', Array.from(navigatedSteps));
  
  // Check for common issues
  const domStepWrappers = document.querySelectorAll('.step_wrapper[data-answer]');
  if (domStepWrappers.length !== steps.length) {
    console.warn('⚠️ DOM vs Registered Steps Mismatch:', {
      domCount: domStepWrappers.length,
      registeredCount: steps.length,
      missing: Array.from(domStepWrappers).map(el => getAttrValue(el, 'data-answer')).filter(id => !steps.some(s => s.id === id))
    });
  }
  
  console.log('🔍 [MultiStep] === DEBUG COMPLETE ===');
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
 * Go to step by ID - ENHANCED with better error handling and branch support
 */
export function goToStepById(stepId: string): void {
  console.log('🎯 [MultiStep] NAVIGATION to step ID:', stepId);
  
  if (!initialized) {
    console.error('❌ [MultiStep] Not initialized');
    return;
  }

  // Find step by ID
  const stepIndex = steps.findIndex(step => step.id === stepId);
  
  if (stepIndex === -1) {
    console.error('❌ [MultiStep] Step not found:', {
      searchedFor: stepId,
      availableSteps: steps.map(s => ({ id: s.id, isBranch: s.isBranch })),
      totalSteps: steps.length
    });
    
    // Enhanced debugging: Check if step exists in DOM but wasn't registered
    const domElement = document.querySelector(`[data-answer="${stepId}"]`);
    if (domElement) {
      console.error('🔍 [MultiStep] Step exists in DOM but not registered:', {
        stepId,
        element: {
          tagName: domElement.tagName,
          id: domElement.id,
          className: domElement.className,
          hasStepAttribute: domElement.hasAttribute('data-form'),
          dataForm: getAttrValue(domElement, 'data-form'),
          parentElement: domElement.parentElement?.tagName,
          isStepWrapper: domElement.classList.contains('step_wrapper')
        }
      });
      
      // Try to manually register this step if it's a valid step wrapper
      if (domElement.classList.contains('step_wrapper') && getAttrValue(domElement, 'data-answer')) {
        console.warn('🔧 [MultiStep] Attempting to register missing step:', stepId);
        const isBranch = getAttrValue(domElement, 'data-branch') === 'true';
        const parentStepElement = domElement.closest('[data-form="step"]') as HTMLElement;
        
        const newStep: StepElement = {
          element: domElement as HTMLElement,
          id: stepId,
          index: steps.length,
          isBranch,
          parentStepElement
        };
        
        steps.push(newStep);
        console.log('✅ [MultiStep] Successfully registered missing step:', newStep);
        
        // Now try navigation again
        goToStep(steps.length - 1);
        return;
      }
    }
    return;
  }

  console.log('✅ [MultiStep] Found step, navigating:', {
    stepId,
    stepIndex,
    currentIndex: currentStepIndex,
    isBranch: steps[stepIndex].isBranch
  });
  
  goToStep(stepIndex);
}

/**
 * Go to step by index - UPDATED for new structure and navigation tracking
 */
export function goToStep(stepIndex: number): void {
  console.log('🎯 [MultiStep] GO TO STEP:', {
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
  
  // Hide current step
  if (currentStepIndex !== -1 && currentStepIndex !== stepIndex) {
    const currentStep = steps[currentStepIndex];
    console.log('👋 [MultiStep] Hiding current step:', currentStep.id);
    hideElement(currentStep.element);
    currentStep.element.classList.remove('active-step');
  }

  // Show target step
  console.log('👁️ [MultiStep] Showing target step:', targetStep.id);
  showElement(targetStep.element);
  targetStep.element.classList.add('active-step');
  
  // Track navigated steps for validation scoping
  navigatedSteps.add(targetStep.id);
  
  // Update tracking
  currentStepIndex = stepIndex;
  currentStepId = targetStep.id;
  
  // Update history
  if (stepHistory[stepHistory.length - 1] !== targetStep.id) {
    stepHistory.push(targetStep.id);
  }
  
  // Update navigation buttons
  updateNavigationButtons();

  // Emit event with navigation tracking info
  formEvents.emit('step:change', {
    currentStepIndex: stepIndex,
    currentStepId: targetStep.id,
    navigatedSteps: Array.from(navigatedSteps),
    isBranchStep: targetStep.isBranch
  });

  console.log('✅ [MultiStep] Navigation complete:', {
    stepId: targetStep.id,
    isBranch: targetStep.isBranch,
    isVisible: isVisible(targetStep.element),
    hasActiveClass: targetStep.element.classList.contains('active-step'),
    totalNavigatedSteps: navigatedSteps.size
  });
  
  // Diagnose if still not visible
  if (!isVisible(targetStep.element)) {
    console.error('❌ [MultiStep] Step still not visible after show!');
    diagnoseVisibilityIssues(targetStep.element, targetStep.id);
  }
}

/**
 * Set up navigation event listeners - ENHANCED for comprehensive navigation including Webflow structure
 */
function setupNavigationListeners(root: Document | Element): void {
  const cleanup1 = delegateEvent(root, 'click', SELECTORS.NEXT_BTN, handleNextClick);
  const cleanup2 = delegateEvent(root, 'click', SELECTORS.BACK_BTN, handleBackClick);
  const cleanup3 = delegateEvent(root, 'click', SELECTORS.SUBMIT_BTN, handleSubmitClick);

  // ENHANCED: Handle radio buttons with multiple event types for reliability
  const cleanup4 = delegateEvent(root, 'change', 'input[type="radio"][data-go-to]', handleRadioNavigation);
  const cleanup5 = delegateEvent(root, 'click', 'input[type="radio"][data-go-to]', handleRadioNavigation);
  
  // WEBFLOW COMPATIBILITY: Handle label clicks for hidden radio buttons (Webflow pattern)
  const cleanup6 = delegateEvent(root, 'click', 'label', handleLabelClick);
  
  // ADDED: Handle any direct navigation buttons with data-go-to
  const cleanup7 = delegateEvent(root, 'click', '[data-go-to]', handleDirectNavigation);

  cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4, cleanup5, cleanup6, cleanup7);
  
  logVerbose('Enhanced navigation listeners with Webflow compatibility setup complete');
}

/**
 * Handle label clicks for Webflow-style hidden radio buttons
 */
function handleLabelClick(event: Event, target: Element): void {
  const label = target as HTMLLabelElement;
  
  // Find the radio button within this label or referenced by 'for' attribute
  let radioButton: HTMLInputElement | null = null;
  
  // Check for radio button inside the label
  radioButton = label.querySelector('input[type="radio"][data-go-to]') as HTMLInputElement;
  
  // If not found inside, check if label has 'for' attribute pointing to a radio with data-go-to
  if (!radioButton && label.htmlFor) {
    const targetInput = document.getElementById(label.htmlFor) as HTMLInputElement;
    if (targetInput && targetInput.type === 'radio' && getAttrValue(targetInput, 'data-go-to')) {
      radioButton = targetInput;
    }
  }
  
  if (radioButton) {
    console.log('🏷️ [MultiStep] Label click detected for radio navigation:', {
      labelClicked: true,
      radioId: radioButton.id,
      dataGoTo: getAttrValue(radioButton, 'data-go-to'),
      radioHidden: radioButton.style.opacity === '0' || radioButton.style.position === 'absolute'
    });
    
    // Check the radio button and trigger navigation
    radioButton.checked = true;
    
    // Trigger change event to ensure all listeners are notified
    radioButton.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Handle the navigation directly
    handleRadioNavigation(event, radioButton);
  }
}

/**
 * Handle direct navigation from navigation elements (buttons, links) with data-go-to
 * DOES NOT trigger on step wrapper containers - only on actual navigation elements
 */
function handleDirectNavigation(event: Event, target: Element): void {
  // Skip if this is a radio button (handled by handleRadioNavigation)
  if (target instanceof HTMLInputElement && target.type === 'radio') {
    return;
  }
  
  // CRITICAL FIX: Only allow navigation from specific navigation elements
  // Do NOT trigger navigation from step wrapper containers
  const isStepWrapper = target.classList.contains('step_wrapper') || 
                        target.classList.contains('step-wrapper') ||
                        getAttrValue(target, 'data-answer');
  
  if (isStepWrapper) {
    console.log('🛑 [MultiStep] Ignoring navigation from step wrapper:', {
      stepId: getAttrValue(target, 'data-answer'),
      reason: 'Step wrappers should not trigger direct navigation'
    });
    return;
  }
  
  // Only allow navigation from actual navigation elements
  const isNavigationElement = 
    target.tagName === 'A' ||           // Links
    target.tagName === 'BUTTON' ||     // Buttons
    getAttrValue(target, 'data-form')?.includes('btn') ||  // Elements with data-form="*-btn"
    getAttrValue(target, 'data-skip') ||                   // Skip elements
    target.classList.contains('button') ||                 // Webflow button class
    target.closest('[data-form*="btn"]') ||               // Child of button element
    target.closest('button, a');                         // Child of button/link
  
  if (!isNavigationElement) {
    console.log('🛑 [MultiStep] Ignoring navigation from non-navigation element:', {
      element: target.tagName,
      className: target.className,
      reason: 'Only buttons, links, and navigation elements can trigger navigation'
    });
    return;
  }
  
  const goToValue = getAttrValue(target, 'data-go-to');
  if (!goToValue) {
    return;
  }
  
  event.preventDefault();
  
  console.log('🎯 [MultiStep] Direct navigation triggered:', {
    element: target.tagName,
    className: target.className,
    goToValue,
    isNavigationElement: true
  });
  
  goToStepById(goToValue);
}

/**
 * Handle radio button navigation - ENHANCED for immediate branching
 */
function handleRadioNavigation(event: Event, target: Element): void {
  const radio = target as HTMLInputElement;
  
  console.log('🎯 [MultiStep] Radio button navigation:', {
    radioName: radio.name,
    radioValue: radio.value,
    isChecked: radio.checked,
    dataGoTo: getAttrValue(radio, 'data-go-to'),
    eventType: event.type
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
  
  // ENHANCED: Add a small delay to ensure the radio selection is visually updated
  setTimeout(() => {
    console.log('🚀 [MultiStep] Navigating to step via radio button:', goToValue);
    
    // Store the branch selection for potential back navigation
    const currentStep = steps[currentStepIndex];
    if (currentStep && currentStep.isBranch) {
      console.log('📝 [MultiStep] Storing branch selection:', {
        branchStepId: currentStep.id,
        selectedOption: goToValue,
        radioValue: radio.value
      });
    }
    
    goToStepById(goToValue);
  }, 100); // Small delay to ensure UI updates
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
 * Validate the current step before allowing navigation
 */
function validateCurrentStep(currentStep: StepElement): boolean {
  logVerbose('🔍 [MultiStep] Starting validation for step:', currentStep.id);
  
  // Find all required fields in the current step
  const requiredFields = currentStep.element.querySelectorAll('input[data-required], select[data-required], textarea[data-required]');
  
  if (requiredFields.length === 0) {
    logVerbose('✅ [MultiStep] No required fields in step, validation passed');
    return true; // No required fields, validation passes
  }
  
  logVerbose(`🔍 [MultiStep] Found ${requiredFields.length} required fields to validate`);
  
  let hasErrors = false;
  
  // Validate each required field
  requiredFields.forEach((field, index) => {
    const input = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const fieldName = input.name || input.getAttribute('data-step-field-name') || `field-${index}`;
    const value = input.value?.trim() || '';
    const isEmpty = !value;
    
    if (isEmpty) {
      hasErrors = true;
      
      // Show error for this field
      const errorMessage = getCustomErrorMessage(input) || 'This field is required';
      showError(fieldName, errorMessage);
      
      logVerbose(`❌ [MultiStep] Required field is empty: ${fieldName}`, {
        fieldType: input.type || input.tagName,
        value: value
      });
    } else {
      logVerbose(`✅ [MultiStep] Required field is filled: ${fieldName}`);
    }
  });
  
  if (hasErrors) {
    logVerbose(`🚫 [MultiStep] Validation failed - ${requiredFields.length} required fields with errors`);
    
    // Scroll to first error field
    const firstErrorField = currentStep.element.querySelector('input[data-required], select[data-required], textarea[data-required]') as HTMLElement;
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => firstErrorField.focus(), 300);
    }
    
    return false;
  }
  
  logVerbose('✅ [MultiStep] All required fields validated successfully');
  return true;
}

/**
 * Get custom error message from associated .form_error-message element
 */
function getCustomErrorMessage(input: HTMLElement): string | null {
  // Look in form-field_wrapper
  const wrapper = input.closest('.form-field_wrapper');
  if (wrapper) {
    const errorElement = wrapper.querySelector('.form_error-message');
    if (errorElement && errorElement.textContent) {
      const text = errorElement.textContent.trim();
      // Don't use placeholder text
      if (!text.includes('This is some text inside of a div block')) {
        return text;
      }
    }
  }
  
  // Look in parent element
  const parent = input.parentElement;
  if (parent) {
    const errorElement = parent.querySelector('.form_error-message');
    if (errorElement && errorElement.textContent) {
      const text = errorElement.textContent.trim();
      if (!text.includes('This is some text inside of a div block')) {
        return text;
      }
    }
  }
  
  return null;
}

/**
 * Handle next button click - ENHANCED with validation and branching logic
 */
function handleNextClick(event: Event): void {
  event.preventDefault();
  
  const currentStep = steps[currentStepIndex];
  if (!currentStep) {
    console.error('❌ [MultiStep] No current step found for next navigation');
    return;
  }
  
  // CRITICAL: Validate current step before allowing navigation
  logVerbose('🔍 [MultiStep] Validating current step before navigation:', {
    stepId: currentStep.id,
    stepIndex: currentStepIndex
  });
  
  const isCurrentStepValid = validateCurrentStep(currentStep);
  
  if (!isCurrentStepValid) {
    logVerbose('🚫 [MultiStep] Navigation blocked - validation failed for step:', currentStep.id);
    return; // Prevent navigation if validation fails
  }
  
  logVerbose('✅ [MultiStep] Validation passed, proceeding with navigation');
  
  // Check if current step has a data-go-to attribute (for branching)
  const currentGoTo = getAttrValue(currentStep.element, 'data-go-to');
  
  if (currentGoTo) {
    console.log('🔀 [MultiStep] Using data-go-to for next navigation:', currentGoTo);
    goToStepById(currentGoTo);
  } else {
    // Fall back to linear navigation
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      console.log('➡️ [MultiStep] Using linear navigation to index:', nextIndex);
      goToStep(nextIndex);
    } else {
      console.log('🏁 [MultiStep] Reached end of form');
    }
  }
}

/**
 * Handle back button click - ENHANCED for branch-aware navigation
 */
function handleBackClick(event: Event): void {
  event.preventDefault();
  
  if (stepHistory.length > 1) {
    // Remove current step from history
    stepHistory.pop();
    // Get the previous step ID
    const previousStepId = stepHistory[stepHistory.length - 1];
    
    console.log('🔙 [MultiStep] Back navigation using history:', {
      previousStepId,
      historyLength: stepHistory.length,
      fullHistory: [...stepHistory]
    });
    
    goToStepById(previousStepId);
  } else {
    // Fallback to linear back navigation
    const previousIndex = currentStepIndex - 1;
    if (previousIndex >= 0) {
      console.log('🔙 [MultiStep] Back navigation using linear index:', previousIndex);
      goToStep(previousIndex);
    } else {
      console.log('🚫 [MultiStep] Already at first step');
    }
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
  navigatedSteps.clear(); // Clear navigation tracking
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