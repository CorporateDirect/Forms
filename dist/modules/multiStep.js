/**
 * Multi-step form navigation module
 */
import { SELECTORS } from '../config.js';
import { logVerbose, queryAllByAttr, getAttrValue, delegateEvent, showElement, hideElement, isVisible, removeClass } from './utils.js';
import { FormState } from './formState.js';
import { getNextStep } from './branching.js';
import { initSkip, evaluateSkipConditions, resetSkip } from './skip.js';
let initialized = false;
let cleanupFunctions = [];
let steps = [];
let stepItems = [];
let currentStepIndex = 0;
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
    logVerbose(`Found ${stepElements.length} parent steps`);
    // Build parent steps array
    steps = Array.from(stepElements).map((element, index) => {
        const htmlElement = element;
        const dataAnswer = getAttrValue(element, 'data-answer');
        // For parent steps, data-answer is optional (they may contain step_items)
        const stepId = dataAnswer || `step-${index}`;
        // Debug: Log step ID assignment
        logVerbose(`Assigning step ID for index ${index}`, {
            dataAnswer: dataAnswer,
            assignedStepId: stepId,
            element: htmlElement.tagName + (htmlElement.id ? `#${htmlElement.id}` : '') + (htmlElement.className ? `.${htmlElement.className.split(' ').join('.')}` : '')
        });
        const stepInfo = {
            element: htmlElement,
            id: stepId,
            index,
            type: getAttrValue(element, 'data-step-type') || undefined,
            subtype: getAttrValue(element, 'data-step-subtype') || undefined,
            number: getAttrValue(element, 'data-step-number') || undefined,
            isStepItem: false
        };
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
    // Find all step_item elements within parent steps
    stepItems = [];
    steps.forEach((parentStep, parentIndex) => {
        const stepItemElements = parentStep.element.querySelectorAll('.step_item, .step-item');
        stepItemElements.forEach((stepItemElement) => {
            const htmlElement = stepItemElement;
            const dataAnswer = getAttrValue(stepItemElement, 'data-answer');
            if (!dataAnswer) {
                logVerbose(`Step item ${parentIndex} in parent step ${parentIndex} missing required data-answer attribute`);
                return;
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
            // Register step_item in FormState
            FormState.setStepInfo(dataAnswer, {
                type: stepItemInfo.type,
                subtype: stepItemInfo.subtype,
                number: stepItemInfo.number,
                visible: false, // Step items are hidden by default
                visited: false
            });
            stepItems.push(stepItemInfo);
        });
    });
    // Hide all steps and step_items initially
    steps.forEach((step, index) => {
        hideElement(step.element);
    });
    stepItems.forEach((stepItem, index) => {
        hideElement(stepItem.element);
    });
    // Set up navigation event listeners
    setupNavigationListeners(root);
    // Initialize enhanced skip functionality
    initSkip(root);
    // Initialize first step
    if (steps.length > 0) {
        goToStep(0);
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
    // Primary skip listener - for data-skip attribute (Webflow standard)
    const cleanup3 = delegateEvent(root, 'click', SELECTORS.SKIP, handleSkipClick);
    // Secondary skip listener - for data-form="skip-btn" (fallback)
    const cleanup4 = delegateEvent(root, 'click', SELECTORS.SKIP_BTN, handleSkipClick);
    const cleanup5 = delegateEvent(root, 'click', SELECTORS.SUBMIT_BTN, handleSubmitClick);
    cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4, cleanup5);
    // Debug: Log what skip buttons we found
    const skipElements = root.querySelectorAll(SELECTORS.SKIP);
    const skipBtns = root.querySelectorAll(SELECTORS.SKIP_BTN);
    logVerbose('Skip button setup complete', {
        dataSkipCount: skipElements.length,
        dataFormSkipBtnCount: skipBtns.length,
        primarySelector: SELECTORS.SKIP,
        fallbackSelector: SELECTORS.SKIP_BTN
    });
}
/**
 * Handle next button click
 * Validates the current step and moves to the next one.
 */
function handleNextClick(event) {
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
 * Handle skip button click
 * Enhanced to handle skip targets using the same logic as data-go-to
 */
function handleSkipClick(event) {
    event.preventDefault();
    const skipButton = event.target;
    logVerbose('Skip button clicked!', {
        target: event.target,
        currentTarget: event.currentTarget,
        currentStepIndex,
        totalSteps: steps.length
    });
    // Debug: Log the skip button element details
    logVerbose('Skip button element analysis', {
        tagName: skipButton.tagName,
        id: skipButton.id,
        className: skipButton.className,
        outerHTML: skipButton.outerHTML,
        attributes: Array.from(skipButton.attributes).map(attr => ({ name: attr.name, value: attr.value }))
    });
    const currentStepId = FormState.getCurrentStep();
    if (!currentStepId) {
        logVerbose('No current step found for skip operation');
        return;
    }
    // Check for skip target in data attributes (same priority as branching)
    const skipTo = getAttrValue(skipButton, 'data-skip-to');
    const skipValue = getAttrValue(skipButton, 'data-skip');
    // Debug: Log the raw attribute values
    logVerbose('Raw attribute value extraction', {
        'data-skip-to': {
            rawValue: skipTo,
            type: typeof skipTo,
            isNull: skipTo === null,
            isEmpty: skipTo === '',
            actualValue: skipTo
        },
        'data-skip': {
            rawValue: skipValue,
            type: typeof skipValue,
            isNull: skipValue === null,
            isEmpty: skipValue === '',
            actualValue: skipValue
        }
    });
    // Debug: Try alternative attribute extraction methods
    const skipToAlt = skipButton.getAttribute('data-skip-to');
    const skipValueAlt = skipButton.getAttribute('data-skip');
    logVerbose('Alternative attribute extraction', {
        'data-skip-to-alt': {
            value: skipToAlt,
            type: typeof skipToAlt,
            isNull: skipToAlt === null
        },
        'data-skip-alt': {
            value: skipValueAlt,
            type: typeof skipValueAlt,
            isNull: skipValueAlt === null
        }
    });
    logVerbose('Processing skip for step', {
        stepId: currentStepId,
        stepIndex: currentStepIndex,
        skipTo: skipTo,
        skipValue: skipValue,
        skipToType: typeof skipTo,
        skipValueType: typeof skipValue
    });
    // Clear fields in current step (original behavior)
    const stepElement = getCurrentStep()?.element;
    let fieldsCleared = 0;
    if (stepElement) {
        const fields = Array.from(stepElement.querySelectorAll('input, select, textarea'));
        fields.forEach(field => {
            if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
                field.checked = false;
            }
            else {
                field.value = '';
            }
            if (field.name) {
                FormState.setField(field.name, null);
                fieldsCleared++;
            }
        });
    }
    logVerbose('Fields cleared during skip', { fieldsCleared });
    // Add to skip tracking (enhanced functionality)
    FormState.addSkippedStep(currentStepId, 'User skipped step', true);
    // Determine target step (same logic as data-go-to)
    let targetStepId = null;
    // Priority 1: data-skip-to attribute
    if (skipTo) {
        targetStepId = skipTo;
        logVerbose('Using data-skip-to target', { targetStepId });
    }
    // Priority 2: data-skip value (if it's not just "true" or empty)
    else if (skipValue && skipValue !== 'true' && skipValue !== '') {
        targetStepId = skipValue;
        logVerbose('Using data-skip value as target', { targetStepId });
    }
    // Priority 3: Default to next sequential step
    else {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            targetStepId = steps[nextIndex].id;
            logVerbose('Using default next step', {
                nextIndex,
                targetStepId,
                reason: 'No valid skip target found',
                skipToValue: skipTo,
                skipValueValue: skipValue
            });
        }
    }
    // Navigate to target using the same method as branching (goToStepById)
    if (targetStepId) {
        logVerbose('Navigating to target step using goToStepById', {
            targetStepId,
            navigationMethod: skipTo ? 'data-skip-to' : skipValue ? 'data-skip-value' : 'sequential'
        });
        // Use the same navigation method as branching logic
        goToStepById(targetStepId);
        logVerbose('Skip navigation complete', {
            targetStepId,
            newCurrentIndex: currentStepIndex
        });
    }
    else {
        logVerbose('Cannot skip - no valid target found');
    }
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
 * Go to a step by ID (works for both parent steps and step_items)
 */
export function goToStepById(stepId) {
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
        logVerbose(`Found step_item: ${stepId}`, {
            parentStepIndex: stepItem.parentStepIndex,
            stepItemIndex: stepItem.index
        });
        // Navigate to the parent step first
        if (stepItem.parentStepIndex !== undefined) {
            goToStep(stepItem.parentStepIndex);
            // Then show the specific step_item
            showStepItem(stepId);
        }
        return;
    }
    else {
        logVerbose(`Step ID ${stepId} not found in step_items`);
    }
    // Then check if it's a parent step
    const parentStepIndex = findStepIndexById(stepId);
    logVerbose(`findStepIndexById result for ${stepId}`, {
        foundIndex: parentStepIndex,
        isValidIndex: parentStepIndex !== -1
    });
    if (parentStepIndex !== -1) {
        logVerbose(`Found parent step: ${stepId} at index ${parentStepIndex}`);
        currentStepItemId = null; // Clear step item tracking
        goToStep(parentStepIndex);
        return;
    }
    logVerbose(`Step not found: ${stepId}`, {
        searchedIn: 'both parent steps and step_items',
        availableParentSteps: allStepIds,
        availableStepItems: allStepItemIds
    });
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
function goToNextStep(skipValidation = false) {
    const currentStep = getCurrentStep();
    if (!currentStep) {
        logVerbose('No current step found');
        return;
    }
    // Only evaluate skip conditions, don't add validation barriers
    evaluateSkipConditions();
    // Use original simple next step logic
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
        goToStep(nextIndex);
    }
    else {
        logVerbose('Already at last step');
    }
}
/**
 * Find next available step (not skipped)
 */
function findNextAvailableStep() {
    let nextIndex = currentStepIndex + 1;
    // Check for branching logic first
    const branchingNext = findNextBranchingStep();
    if (branchingNext !== -1) {
        nextIndex = branchingNext;
    }
    // Skip over any skipped steps
    while (nextIndex < steps.length) {
        const stepId = steps[nextIndex].id;
        if (!FormState.isStepSkipped(stepId)) {
            return nextIndex;
        }
        nextIndex++;
    }
    return -1; // No available next step
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
    // Clear all event listeners
    cleanupFunctions.forEach(cleanup => cleanup());
    cleanupFunctions = [];
    // Reset skip functionality
    resetSkip();
    // Reset state variables
    steps = [];
    stepItems = [];
    currentStepIndex = 0;
    currentStepItemId = null;
    initialized = false;
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
function findNextStepInSequence() {
    return currentStepIndex + 1;
}
/**
 * Find the next step based on branching logic
 */
function findNextBranchingStep() {
    const nextStep = getNextStep(steps[currentStepIndex]?.id);
    return nextStep ? findStepIndexById(nextStep) : -1;
}
//# sourceMappingURL=multiStep.js.map