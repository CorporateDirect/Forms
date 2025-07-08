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
    const cleanup3 = delegateEvent(root, 'click', SELECTORS.SKIP_BTN, handleSkipClick);
    const cleanup4 = delegateEvent(root, 'click', SELECTORS.SUBMIT_BTN, handleSubmitClick);
    // Also listen for generic skip selector as fallback
    const cleanup5 = delegateEvent(root, 'click', SELECTORS.SKIP, handleSkipClick);
    cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4, cleanup5);
    // Debug: Log what skip buttons we found
    const skipBtns = root.querySelectorAll(SELECTORS.SKIP_BTN);
    const skipElements = root.querySelectorAll(SELECTORS.SKIP);
    logVerbose('Skip button setup complete', {
        skipBtnCount: skipBtns.length,
        skipElementCount: skipElements.length,
        skipBtnSelector: SELECTORS.SKIP_BTN,
        skipSelector: SELECTORS.SKIP
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
 * Direct skip approach that doesn't interfere with normal validation
 */
function handleSkipClick(event) {
    event.preventDefault();
    logVerbose('Skip button clicked!', {
        target: event.target,
        currentTarget: event.currentTarget,
        currentStepIndex,
        totalSteps: steps.length
    });
    const currentStepId = FormState.getCurrentStep();
    if (!currentStepId) {
        logVerbose('No current step found for skip operation');
        return;
    }
    logVerbose('Processing skip for step', {
        stepId: currentStepId,
        stepIndex: currentStepIndex
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
    // Use simple next step logic (bypass validation)
    const nextIndex = currentStepIndex + 1;
    logVerbose('Attempting to navigate to next step', {
        currentIndex: currentStepIndex,
        nextIndex: nextIndex,
        totalSteps: steps.length
    });
    if (nextIndex < steps.length) {
        goToStep(nextIndex);
        logVerbose('Successfully navigated to next step', { newIndex: nextIndex });
    }
    else {
        logVerbose('Cannot skip - already at last step');
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
    // First check if it's a step_item
    const stepItem = stepItems.find(item => item.id === stepId);
    if (stepItem) {
        // Navigate to the parent step first
        if (stepItem.parentStepIndex !== undefined) {
            goToStep(stepItem.parentStepIndex);
            // Then show the specific step_item
            showStepItem(stepId);
        }
        return;
    }
    // Then check if it's a parent step
    const parentStepIndex = findStepIndexById(stepId);
    if (parentStepIndex !== -1) {
        currentStepItemId = null; // Clear step item tracking
        goToStep(parentStepIndex);
        return;
    }
    logVerbose(`Step not found: ${stepId}`);
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
    logVerbose(`Attempting to go to step index: ${stepIndex}`);
    if (stepIndex < 0 || stepIndex >= steps.length) {
        logVerbose(`Invalid step index: ${stepIndex}`);
        return;
    }
    // Hide current step if there is one
    if (currentStepIndex !== -1 && currentStepIndex < steps.length) {
        hideStep(currentStepIndex);
    }
    // Show the new step
    showStep(stepIndex);
    // Update current step index
    currentStepIndex = stepIndex;
    // Update form state with current step
    const newStep = steps[stepIndex];
    FormState.setCurrentStep(newStep.id);
    // Update visibility of navigation buttons
    updateNavigationButtons();
}
/**
 * Show a step by its index
 */
export function showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length) {
        return;
    }
    const step = steps[stepIndex];
    showElement(step.element);
    FormState.setStepVisibility(step.id, true);
    // Also show any visible step_items within this step
    stepItems.forEach(item => {
        if (item.parentStepIndex === stepIndex && FormState.isStepVisible(item.id)) {
            showElement(item.element);
        }
    });
    logVerbose(`Showing step ${stepIndex} (${step.id})`);
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