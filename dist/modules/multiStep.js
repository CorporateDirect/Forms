/**
 * Multi-step form navigation module - UPDATED FOR NEW SIMPLIFIED STRUCTURE
 */
import { SELECTORS } from '../config.js';
import { logVerbose, getAttrValue, delegateEvent, showElement, hideElement, isVisible } from './utils.js';
import { formEvents } from './events.js';
let initialized = false;
let cleanupFunctions = [];
let eventCleanupFunctions = [];
let steps = [];
let currentStepIndex = -1;
let currentStepId = '';
let stepHistory = [];
let navigatedSteps = new Set(); // Track which steps have been navigated to
/**
 * Initialize multi-step functionality - UPDATED FOR NEW STRUCTURE
 */
export function initMultiStep(root = document) {
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
        const parentStepElement = stepWrapper.closest('[data-form="step"]');
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
            element: stepWrapper,
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
    // Hide all steps initially
    steps.forEach((step, index) => {
        console.log(`🫥 [MultiStep] Hiding step ${index} (${step.id})`);
        hideElement(step.element);
    });
    // Set up navigation and events
    setupNavigationListeners(root);
    setupEventListeners();
    setupSkipListeners(root);
    // Show first step
    if (steps.length > 0) {
        console.log('🎬 [MultiStep] Showing initial step: 0');
        goToStep(0);
    }
    initialized = true;
    formEvents.registerModule('multiStep');
    console.log('✅ [MultiStep] Updated structure initialization complete');
}
/**
 * Get list of navigated step IDs for validation scoping
 */
export function getNavigatedSteps() {
    return Array.from(navigatedSteps);
}
/**
 * Debug function to diagnose step visibility and registration issues
 */
export function debugStepSystem() {
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
function setupEventListeners() {
    const stepNavigateCleanup = formEvents.on('step:navigate', (data) => {
        const eventData = data;
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
export function goToStepById(stepId) {
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
                const parentStepElement = domElement.closest('[data-form="step"]');
                const newStep = {
                    element: domElement,
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
export function goToStep(stepIndex) {
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
function setupNavigationListeners(root) {
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
function handleLabelClick(event, target) {
    const label = target;
    // Find the radio button within this label or referenced by 'for' attribute
    let radioButton = null;
    // Check for radio button inside the label
    radioButton = label.querySelector('input[type="radio"][data-go-to]');
    // If not found inside, check if label has 'for' attribute pointing to a radio with data-go-to
    if (!radioButton && label.htmlFor) {
        const targetInput = document.getElementById(label.htmlFor);
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
 * Handle direct navigation from any element with data-go-to
 */
function handleDirectNavigation(event, target) {
    // Skip if this is a radio button (handled by handleRadioNavigation)
    if (target instanceof HTMLInputElement && target.type === 'radio') {
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
        goToValue
    });
    goToStepById(goToValue);
}
/**
 * Handle radio button navigation - ENHANCED for immediate branching
 */
function handleRadioNavigation(event, target) {
    const radio = target;
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
function applyRadioActiveClass(selectedRadio) {
    const groupName = selectedRadio.name;
    if (!groupName)
        return;
    const activeClass = getAttrValue(selectedRadio, 'fs-inputactive-class') || 'is-active-inputactive';
    // Remove active class from other radio buttons in the same group
    const radioGroup = document.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
    radioGroup.forEach(radio => {
        const htmlRadio = radio;
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
function setupSkipListeners(root) {
    const cleanup = delegateEvent(root, 'click', SELECTORS.SKIP, handleSkipButtonClick);
    cleanupFunctions.push(cleanup);
    logVerbose('Skip listeners setup complete');
}
/**
 * Handle next button click - ENHANCED for branching logic
 */
function handleNextClick(event) {
    event.preventDefault();
    const currentStep = steps[currentStepIndex];
    if (!currentStep) {
        console.error('❌ [MultiStep] No current step found for next navigation');
        return;
    }
    // Check if current step has a data-go-to attribute (for branching)
    const currentGoTo = getAttrValue(currentStep.element, 'data-go-to');
    if (currentGoTo) {
        console.log('🔀 [MultiStep] Using data-go-to for next navigation:', currentGoTo);
        goToStepById(currentGoTo);
    }
    else {
        // Fall back to linear navigation
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            console.log('➡️ [MultiStep] Using linear navigation to index:', nextIndex);
            goToStep(nextIndex);
        }
        else {
            console.log('🏁 [MultiStep] Reached end of form');
        }
    }
}
/**
 * Handle back button click - ENHANCED for branch-aware navigation
 */
function handleBackClick(event) {
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
    }
    else {
        // Fallback to linear back navigation
        const previousIndex = currentStepIndex - 1;
        if (previousIndex >= 0) {
            console.log('🔙 [MultiStep] Back navigation using linear index:', previousIndex);
            goToStep(previousIndex);
        }
        else {
            console.log('🚫 [MultiStep] Already at first step');
        }
    }
}
/**
 * SIMPLIFIED: Handle form submission
 */
function handleSubmitClick(event) {
    // Let form submit naturally
    logVerbose('Form submission - allowing default behavior');
}
/**
 * SIMPLIFIED: Handle skip button click
 */
function handleSkipButtonClick(event, target) {
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
function updateNavigationButtons() {
    const nextBtn = document.querySelector(SELECTORS.NEXT_BTN);
    const backBtn = document.querySelector(SELECTORS.BACK_BTN);
    const submitBtn = document.querySelector(SELECTORS.SUBMIT_BTN);
    if (!nextBtn || !backBtn || !submitBtn)
        return;
    const isFirstStep = currentStepIndex === 0;
    const isLastStep = currentStepIndex === steps.length - 1;
    // Back button visibility
    backBtn.style.display = isFirstStep ? 'none' : '';
    // Next/Submit button visibility
    if (isLastStep) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = '';
    }
    else {
        nextBtn.style.display = '';
        submitBtn.style.display = 'none';
    }
}
/**
 * SIMPLIFIED: Reset multi-step state and cleanup
 */
function resetMultiStep() {
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
function diagnoseVisibilityIssues(element, stepId) {
    const computedStyle = getComputedStyle(element);
    const parentElements = [];
    // Walk up the DOM tree to find potential conflicting styles
    let currentElement = element;
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
//# sourceMappingURL=multiStep.js.map