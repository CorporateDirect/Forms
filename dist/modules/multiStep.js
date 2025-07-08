/**
 * Multi-step form navigation module
 */
import { SELECTORS } from '../config.js';
import { logVerbose, queryAllByAttr, getAttrValue, delegateEvent, showElement, hideElement, isVisible, removeClass } from './utils.js';
import { FormState } from './formState.js';
import { initSkip, skipStep, resetSkip } from './skip.js';
import { formEvents } from './events.js';
let initialized = false;
let cleanupFunctions = [];
let eventCleanupFunctions = [];
let steps = [];
let stepItems = [];
let currentStepIndex = -1; // Initialize to -1 to indicate no current step
let currentStepItemId = null;
/**
 * Initialize multi-step functionality
 */
export function initMultiStep(root = document) {
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
        // Look for data-answer on step_wrapper child element (primary step identifier)
        const stepWrapper = stepElement.querySelector('.step_wrapper[data-answer]');
        let dataAnswer = null;
        if (stepWrapper) {
            dataAnswer = getAttrValue(stepWrapper, 'data-answer');
            if (dataAnswer) {
                logVerbose(`Found data-answer on step_wrapper: ${dataAnswer}`);
            }
        }
        else {
            // Fallback: look for data-answer on the step element itself
            dataAnswer = getAttrValue(stepElement, 'data-answer');
            if (dataAnswer) {
                logVerbose(`Found data-answer on step element: ${dataAnswer}`);
            }
        }
        // Console log the expected step format for debugging
        console.log(`Expected Step: "step-${index}" | Found: "${dataAnswer || 'MISSING'}"`);
        // Error if no data-answer found
        if (!dataAnswer) {
            const expectedValue = `step-${index}`;
            const errorMsg = `STEP INITIALIZATION ERROR: Step ${index} is missing required data-answer attribute`;
            console.error(errorMsg, {
                stepElement: stepElement,
                stepIndex: index,
                tagName: stepElement.tagName,
                id: stepElement.id,
                className: stepElement.className,
                hasStepWrapper: !!stepWrapper,
                expectedDataAnswer: expectedValue,
                solution: `Add data-answer="${expectedValue}" to step_wrapper or step element`,
                example: stepWrapper
                    ? `<div class="step_wrapper" data-answer="${expectedValue}">`
                    : `<div data-form="step" data-answer="${expectedValue}">`
            });
            // Skip this step - don't add it to the steps array
            return null;
        }
        const stepInfo = {
            element: stepElement,
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
    }).filter(step => step !== null); // Filter out steps that were skipped
    // Fix step indices after filtering
    steps.forEach((step, index) => {
        step.index = index;
    });
    // Find all step_item elements within parent steps (for branching scenarios)
    stepItems = [];
    steps.forEach((parentStep, parentIndex) => {
        // Look for step_item elements within this parent step (branching options)
        const stepItemElements = parentStep.element.querySelectorAll('.step_item[data-answer], .step-item[data-answer]');
        if (stepItemElements.length > 0) {
            logVerbose(`Found ${stepItemElements.length} branching step_items in step ${parentIndex} (${parentStep.id})`);
            stepItemElements.forEach((stepItemElement) => {
                const htmlElement = stepItemElement;
                const dataAnswer = getAttrValue(stepItemElement, 'data-answer');
                if (!dataAnswer) {
                    // Try to determine expected value based on context
                    const stepType = getAttrValue(stepItemElement, 'data-step-type') || 'unknown';
                    const stepSubtype = getAttrValue(stepItemElement, 'data-step-subtype') || 'unknown';
                    const stepNumber = getAttrValue(stepItemElement, 'data-step-number') || '1';
                    let expectedValue = `${stepSubtype}-${stepNumber}`;
                    if (stepType === 'member') {
                        expectedValue = `${stepSubtype}-${stepNumber}`;
                    }
                    else if (stepType === 'manager') {
                        expectedValue = `manager-${stepSubtype}-${stepNumber}`;
                    }
                    const errorMsg = `STEP_ITEM INITIALIZATION ERROR: Step item in step ${parentIndex} (${parentStep.id}) is missing required data-answer attribute`;
                    console.error(errorMsg, {
                        stepItemElement: stepItemElement,
                        parentStepIndex: parentIndex,
                        parentStepId: parentStep.id,
                        tagName: stepItemElement.tagName,
                        id: stepItemElement.id,
                        className: stepItemElement.className,
                        stepType: stepType,
                        stepSubtype: stepSubtype,
                        stepNumber: stepNumber,
                        expectedDataAnswer: expectedValue,
                        solution: `Add data-answer="${expectedValue}" to step_item element`,
                        example: `<div class="step_item" data-answer="${expectedValue}">`
                    });
                    return; // Skip this step_item
                }
                const stepItemInfo = {
                    element: htmlElement,
                    id: dataAnswer,
                    index: stepItems.length, // Global step_item index
                    type: getAttrValue(stepItemElement, 'data-step-type') || undefined,
                    subtype: getAttrValue(stepItemElement, 'data-step-subtype') || undefined,
                    number: getAttrValue(stepItemElement, 'data-step-number') || undefined,
                    isStepItem: true,
                    parentStepIndex: parentIndex
                };
                // Register step_item in FormState as a branching option
                FormState.setStepInfo(dataAnswer, {
                    type: stepItemInfo.type,
                    subtype: stepItemInfo.subtype,
                    number: stepItemInfo.number,
                    visible: false, // Step items are hidden by default until selected
                    visited: false
                });
                stepItems.push(stepItemInfo);
                logVerbose(`Registered branching step_item: ${dataAnswer}`, {
                    parentStepIndex: parentIndex,
                    parentStepId: parentStep.id,
                    stepItemIndex: stepItemInfo.index,
                    purpose: 'branching option within step'
                });
            });
        }
        else {
            logVerbose(`No branching step_items found in step ${parentIndex} (${parentStep.id}) - simple step`);
        }
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
    // Listen for navigation events from other modules BEFORE initializing skip
    // This ensures we're ready to handle skip:request events immediately
    setupEventListeners();
    // Initialize enhanced skip functionality
    initSkip(root);
    // Show initial step
    if (steps.length > 0) {
        // Start at step 0 unless there's a specific start step defined
        const multistepElement = root.querySelector(SELECTORS.MULTISTEP);
        const startStepAttr = multistepElement ? getAttrValue(multistepElement, 'data-start-step') : null;
        const startStepId = startStepAttr || steps[0].id;
        const startIndex = findStepIndexById(startStepId);
        goToStep(startIndex !== -1 ? startIndex : 0);
    }
    else {
        logVerbose('No steps found to initialize');
    }
    initialized = true;
    logVerbose('Multi-step initialization complete');
    // Register this module as initialized
    formEvents.registerModule('multiStep');
}
/**
 * Set up event listeners for module communication
 */
function setupEventListeners() {
    const branchChangeCleanup = formEvents.on('branch:change', ({ targetStepId }) => {
        logVerbose(`Received branch:change event, navigating to: ${targetStepId}`);
        goToStepById(targetStepId);
    });
    const skipRequestCleanup = formEvents.on('skip:request', ({ targetStepId }) => {
        logVerbose(`Received skip:request event`, { targetStepId });
        const currentStepId = FormState.getCurrentStep();
        if (currentStepId) {
            skipStep(currentStepId, 'User skipped', true, targetStepId || undefined);
        }
        if (targetStepId) {
            goToStepById(targetStepId);
        }
        else {
            goToNextStep();
        }
    });
    // Store cleanup functions for proper cleanup
    eventCleanupFunctions.push(branchChangeCleanup, skipRequestCleanup);
}
/**
 * Update required fields based on step_item subtype
 */
function updateRequiredFields(stepItemElement, enable = true) {
    const subtype = getAttrValue(stepItemElement, 'data-step-subtype');
    if (!subtype)
        return;
    logVerbose(`${enable ? 'Enabling' : 'Disabling'} required fields for subtype: ${subtype}`);
    // Find all fields with data-require-for-subtypes attribute in this step_item
    const conditionalFields = stepItemElement.querySelectorAll('[data-require-for-subtypes]');
    conditionalFields.forEach(field => {
        const requiredForSubtypes = field.getAttribute('data-require-for-subtypes');
        const htmlField = field;
        if (requiredForSubtypes && requiredForSubtypes.split(',').map(s => s.trim()).includes(subtype)) {
            if (enable) {
                htmlField.required = true;
                htmlField.disabled = false;
            }
            else {
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
export function showStepItem(stepItemId) {
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
    const parentStep = steps[stepItem.parentStepIndex];
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
export function hideStepItem(stepItemId) {
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
function setupNavigationListeners(root) {
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
function handleNextClick(event) {
    console.log('🔍 NEXT BUTTON CLICK HANDLER TRIGGERED');
    console.log('Event target:', event.target);
    console.log('Event currentTarget:', event.currentTarget);
    // Check if this is actually a skip button being clicked
    const target = event.target;
    const skipAttribute = target.getAttribute('data-skip');
    if (skipAttribute) {
        console.log('❌ CONFLICT DETECTED: Skip button triggered next button handler!', {
            skipAttribute,
            targetElement: target,
            targetTagName: target.tagName,
            targetClassName: target.className
        });
        // Don't prevent default here - let the skip handler deal with it
        return;
    }
    console.log('✅ Legitimate next button click - proceeding with navigation');
    event.preventDefault();
    goToNextStep();
}
/**
 * Handle back button click
 */
function handleBackClick(event) {
    event.preventDefault();
    goToPreviousStep();
}
/**
 * Handle form submission
 * This handler is mostly for single-step forms or the final step.
 */
function handleSubmitClick(event) {
    // Find the form
    const form = event.target.closest('form');
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
 * Go to a step by ID (handles both regular steps and branching step_items)
 */
export function goToStepById(stepId) {
    if (!initialized) {
        logVerbose('Multi-step module not initialized, ignoring goToStepById call');
        return;
    }
    logVerbose('=== GO TO STEP BY ID FUNCTION START ===');
    logVerbose(`Navigating to step: ${stepId}`);
    // Debug: Log all available step IDs for comparison
    const allStepIds = steps.map(s => s.id);
    const allStepItemIds = stepItems.map(s => s.id);
    logVerbose('Available steps for navigation', {
        searchingFor: stepId,
        parentStepIds: allStepIds,
        branchingStepItemIds: allStepItemIds,
        totalParentSteps: steps.length,
        totalBranchingItems: stepItems.length
    });
    // First check if it's a branching step_item
    const stepItem = stepItems.find(item => item.id === stepId);
    if (stepItem) {
        logVerbose(`✓ FOUND BRANCHING STEP_ITEM: ${stepId}`, {
            parentStepIndex: stepItem.parentStepIndex,
            stepItemIndex: stepItem.index,
            stepItemElement: {
                tagName: stepItem.element.tagName,
                id: stepItem.element.id,
                className: stepItem.element.className,
                dataAnswer: getAttrValue(stepItem.element, 'data-answer')
            }
        });
        // Navigate to the parent step first (if not already there)
        if (stepItem.parentStepIndex !== undefined) {
            const parentStep = steps[stepItem.parentStepIndex];
            logVerbose(`Navigating to parent step: ${parentStep.id} (index ${stepItem.parentStepIndex})`);
            goToStep(stepItem.parentStepIndex);
            // Then show the specific branching option
            logVerbose(`Now showing branching option: ${stepId}`);
            showStepItem(stepId);
        }
        logVerbose('=== GO TO STEP BY ID FUNCTION END (BRANCHING_ITEM) ===');
        return;
    }
    else {
        logVerbose(`Step ID ${stepId} not found in branching step_items`);
    }
    // Then check if it's a regular step
    const parentStepIndex = findStepIndexById(stepId);
    logVerbose(`findStepIndexById result for ${stepId}`, {
        foundIndex: parentStepIndex,
        isValidIndex: parentStepIndex !== -1
    });
    if (parentStepIndex !== -1) {
        logVerbose(`✓ FOUND REGULAR STEP: ${stepId} at index ${parentStepIndex}`, {
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
        logVerbose('=== GO TO STEP BY ID FUNCTION END (REGULAR_STEP) ===');
        return;
    }
    logVerbose(`❌ STEP NOT FOUND: ${stepId}`, {
        searchedIn: 'both regular steps and branching step_items',
        availableRegularSteps: allStepIds,
        availableBranchingItems: allStepItemIds,
        suggestion: 'Check if the data-answer attribute exists on the target element'
    });
    logVerbose('=== GO TO STEP BY ID FUNCTION END (NOT_FOUND) ===');
}
/**
 * Validate a step element (works for both parent steps and step_items)
 */
function validateStepElement(element) {
    const inputs = element.querySelectorAll('input[required], select[required], textarea[required]');
    for (const input of inputs) {
        const htmlInput = input;
        // Skip validation for hidden elements
        if (!isVisible(htmlInput))
            continue;
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
export function goToStep(stepIndex) {
    if (!initialized) {
        logVerbose('Multi-step module not initialized, ignoring goToStep call');
        return;
    }
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
export function showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length) {
        logVerbose(`Invalid step index: ${stepIndex}`);
        return;
    }
    const step = steps[stepIndex];
    if (!step) {
        logVerbose(`Step not found at index: ${stepIndex}`);
        return;
    }
    // Hide all other steps
    steps.forEach((s, i) => {
        if (i !== stepIndex) {
            hideStep(i);
        }
    });
    showElement(step.element);
    step.element.classList.add('active-step');
    currentStepIndex = stepIndex;
    FormState.setCurrentStep(step.id);
    updateNavigationButtons();
    // Emit step change event
    formEvents.emit('step:change', {
        currentStepIndex: stepIndex,
        currentStepId: step.id,
    });
    logVerbose(`Showing step ${stepIndex}: ${step.id}`);
}
/**
 * Hide a step by its index
 */
function hideStep(stepIndex) {
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
function goToNextStep() {
    if (!initialized) {
        logVerbose('Multi-step module not initialized, ignoring goToNextStep call');
        return;
    }
    logVerbose('=== GO TO NEXT STEP FUNCTION START ===');
    // Add stack trace to see what called this function
    console.log('🔍 GO TO NEXT STEP CALLED');
    console.trace('Call stack for goToNextStep:');
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
    // The evaluateSkipConditions function is now part of the skip module,
    // so we just call it directly.
    // The setNavigationFunctions call is removed as per the new_code.
    // Use original simple next step logic
    const nextIndex = currentStepIndex + 1;
    console.log(`🔍 ATTEMPTING TO NAVIGATE TO NEXT STEP - Current: ${currentStepIndex}, Next: ${nextIndex}`);
    logVerbose('Sequential navigation logic', {
        currentIndex: currentStepIndex,
        nextIndex,
        totalSteps: steps.length,
        hasNextStep: nextIndex < steps.length
    });
    if (nextIndex < steps.length) {
        logVerbose(`Going to next sequential step: index ${nextIndex}`);
        goToStep(nextIndex);
    }
    else {
        logVerbose('Already at last step');
    }
    logVerbose('=== GO TO NEXT STEP FUNCTION END ===');
}
/**
 * Go to previous step
 */
function goToPreviousStep() {
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
    }
    else {
        logVerbose('Already at first step');
    }
}
/**
 * Find step index by step ID
 */
function findStepIndexById(stepId) {
    return steps.findIndex(step => step.id === stepId);
}
/**
 * Get current step
 */
function getCurrentStep() {
    return steps[currentStepIndex] || null;
}
/**
 * Update navigation button states
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
 * Validate all visible steps
 */
function validateAllVisibleSteps() {
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
export function getCurrentStepInfo() {
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
    stepItems = [];
    currentStepIndex = -1;
    currentStepItemId = null;
    initialized = false;
    // Reset other modules that depend on multi-step
    resetSkip();
    // Clean up event listeners
    eventCleanupFunctions.forEach(fn => fn());
    eventCleanupFunctions = [];
    logVerbose('Multi-step module reset');
}
/**
 * Get multi-step state for debugging
 */
export function getMultiStepState() {
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
//# sourceMappingURL=multiStep.js.map