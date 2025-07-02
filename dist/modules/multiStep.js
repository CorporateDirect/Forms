/**
 * Multi-step form navigation module
 */
import { SELECTORS, CSS_CLASSES } from '../config.js';
import { logVerbose, queryAllByAttr, getAttrValue, delegateEvent, isVisible, addClass, removeClass } from './utils.js';
import { FormState } from './formState.js';
import { getNextStep } from './branching.js';
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
        logVerbose(`Registering parent step ${index}`, {
            stepId,
            dataAnswer,
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
    // Find all step_item elements within parent steps (handle both .step_item and .step-item)
    stepItems = [];
    steps.forEach((parentStep, parentIndex) => {
        const stepItemElements = parentStep.element.querySelectorAll('.step_item, .step-item');
        console.log(`[FormLib] Found ${stepItemElements.length} step_items in parent step ${parentIndex} (${parentStep.id})`);
        stepItemElements.forEach((stepItemElement, itemIndex) => {
            const htmlElement = stepItemElement;
            const dataAnswer = getAttrValue(stepItemElement, 'data-answer');
            const dataGoTo = getAttrValue(stepItemElement, 'data-go-to');
            console.log(`[FormLib] Processing step_item ${itemIndex}:`, {
                dataAnswer,
                dataGoTo,
                parentStepId: parentStep.id,
                parentStepIndex: parentIndex,
                element: htmlElement,
                allAttributes: Array.from(htmlElement.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
            });
            if (!dataAnswer) {
                console.warn(`[FormLib] Step item ${itemIndex} in parent step ${parentIndex} missing required data-answer attribute`);
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
            console.log(`[FormLib] Registered step_item:`, {
                stepId: dataAnswer,
                parentStepIndex: parentIndex,
                globalIndex: stepItems.length,
                type: stepItemInfo.type,
                element: htmlElement
            });
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
        hideStepCompletely(step.element, `parent step ${index}`);
    });
    stepItems.forEach((stepItem, index) => {
        hideStepCompletely(stepItem.element, `step_item ${index} (${stepItem.id})`);
    });
    // Set up navigation event listeners
    setupNavigationListeners(root);
    // Initialize first step (this will show step 0 and hide others)
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
 * Completely hide a step or step_item using multiple methods
 */
function hideStepCompletely(element, description) {
    // Use aggressive hiding only for step_items, normal hiding for regular steps
    const isStepItem = description.includes('step_item');
    if (isStepItem) {
        // Aggressive hiding for step_items
        element.style.display = 'none !important';
        element.style.visibility = 'hidden';
        element.style.opacity = '0';
        element.style.height = '0';
        element.style.overflow = 'hidden';
        element.style.position = 'absolute';
        element.style.left = '-9999px';
        addClass(element, CSS_CLASSES.HIDDEN_STEP_ITEM);
    }
    else {
        // Normal hiding for regular steps
        element.style.display = 'none';
        element.style.visibility = 'hidden';
    }
    addClass(element, 'hidden-step');
    removeClass(element, CSS_CLASSES.ACTIVE_STEP);
    element.setAttribute('data-step-hidden', 'true');
    console.log(`[FormLib] Hiding ${description}:`, {
        display: element.style.display,
        visibility: element.style.visibility,
        opacity: element.style.opacity,
        isStepItem,
        classes: element.className,
        dataAnswer: getAttrValue(element, 'data-answer')
    });
}
/**
 * Show a step or step_item
 */
function showStepCompletely(element, description) {
    // Clear all possible hiding styles
    element.style.display = '';
    element.style.visibility = '';
    element.style.opacity = '';
    element.style.height = '';
    element.style.overflow = '';
    element.style.position = '';
    element.style.left = '';
    removeClass(element, 'hidden-step');
    removeClass(element, CSS_CLASSES.HIDDEN_STEP_ITEM);
    addClass(element, CSS_CLASSES.ACTIVE_STEP);
    element.removeAttribute('data-step-hidden');
    console.log(`[FormLib] Showing ${description}:`, {
        display: element.style.display,
        visibility: element.style.visibility,
        classes: element.className,
        dataAnswer: getAttrValue(element, 'data-answer')
    });
}
/**
 * Update required fields based on step_item subtype
 */
function updateRequiredFields(stepItemElement, enable = true) {
    const subtype = getAttrValue(stepItemElement, 'data-step-subtype');
    if (!subtype)
        return;
    console.log(`[FormLib] ${enable ? 'Enabling' : 'Disabling'} required fields for subtype: ${subtype}`);
    // Find all fields with data-require-for-subtypes attribute in this step_item
    const conditionalFields = stepItemElement.querySelectorAll('[data-require-for-subtypes]');
    conditionalFields.forEach(field => {
        const requiredForSubtypes = field.getAttribute('data-require-for-subtypes');
        const htmlField = field;
        if (requiredForSubtypes && requiredForSubtypes.split(',').map(s => s.trim()).includes(subtype)) {
            // This field should be required for this subtype
            if (enable) {
                htmlField.required = true;
                htmlField.disabled = false;
                console.log(`[FormLib] Enabled required field: ${htmlField.name || htmlField.id} for subtype: ${subtype}`);
            }
            else {
                htmlField.required = false;
                htmlField.disabled = true;
                htmlField.value = ''; // Clear the value when disabling
                console.log(`[FormLib] Disabled required field: ${htmlField.name || htmlField.id} for subtype: ${subtype}`);
            }
        }
    });
}
/**
 * Show a specific step_item within its parent step
 */
export function showStepItem(stepItemId) {
    console.log(`[FormLib] Attempting to show step_item: ${stepItemId}`);
    console.log(`[FormLib] Available step_items:`, stepItems.map(item => ({
        id: item.id,
        dataAnswer: getAttrValue(item.element, 'data-answer'),
        element: item.element
    })));
    const stepItem = stepItems.find(item => item.id === stepItemId);
    if (!stepItem) {
        console.warn(`[FormLib] Step item not found: ${stepItemId}`);
        console.log(`[FormLib] Looking for step_item with data-answer="${stepItemId}"`);
        // Try to find by data-answer attribute
        const stepItemByAnswer = stepItems.find(item => getAttrValue(item.element, 'data-answer') === stepItemId);
        if (stepItemByAnswer) {
            console.log(`[FormLib] Found step_item by data-answer: ${stepItemId}`, stepItemByAnswer);
            return showStepItem(stepItemByAnswer.id);
        }
        return;
    }
    const parentStep = steps[stepItem.parentStepIndex];
    if (!parentStep) {
        console.warn(`[FormLib] Parent step not found for step_item: ${stepItemId}`);
        return;
    }
    logVerbose(`Showing step_item ${stepItemId} in parent step ${stepItem.parentStepIndex}`);
    console.log(`[FormLib] Hiding all step_items in parent step ${stepItem.parentStepIndex}`);
    // Hide ALL step_items in the parent step first
    const allStepItemsInParent = stepItems.filter(item => item.parentStepIndex === stepItem.parentStepIndex);
    console.log(`[FormLib] Found ${allStepItemsInParent.length} step_items to hide in parent step`);
    allStepItemsInParent.forEach(item => {
        console.log(`[FormLib] Hiding step_item: ${item.id} (data-answer="${getAttrValue(item.element, 'data-answer')}")`);
        hideStepCompletely(item.element, `step_item ${item.id}`);
        updateRequiredFields(item.element, false); // Disable required fields for hidden step_items
        FormState.setStepVisibility(item.id, false);
    });
    console.log(`[FormLib] Now showing target step_item: ${stepItemId}`);
    // Show the target step_item
    showStepCompletely(stepItem.element, `step_item ${stepItemId}`);
    updateRequiredFields(stepItem.element, true); // Enable required fields for visible step_item
    FormState.setStepVisibility(stepItemId, true);
    // Update current step_item tracking
    currentStepItemId = stepItemId;
    console.log(`[FormLib] Successfully showed step_item: ${stepItemId}`, {
        currentStepItemId,
        visibleStepItems: allStepItemsInParent.filter(item => item.id === stepItemId).length
    });
}
/**
 * Hide a specific step_item
 */
export function hideStepItem(stepItemId) {
    logVerbose(`Attempting to hide step_item: ${stepItemId}`);
    const stepItem = stepItems.find(item => item.id === stepItemId);
    if (!stepItem) {
        logVerbose(`Step item not found for hiding: ${stepItemId}`);
        return;
    }
    logVerbose(`Hiding step_item: ${stepItemId}`);
    // Hide the step_item
    hideStepCompletely(stepItem.element, `step_item ${stepItemId}`);
    updateRequiredFields(stepItem.element, false); // Disable required fields for hidden step_item
    FormState.setStepVisibility(stepItemId, false);
    // Clear current step_item tracking if this was the active one
    if (currentStepItemId === stepItemId) {
        currentStepItemId = null;
    }
    logVerbose(`Successfully hid step_item: ${stepItemId}`);
}
/**
 * Set up navigation event listeners
 */
function setupNavigationListeners(root) {
    // Next button clicks
    const cleanup1 = delegateEvent(root, 'click', SELECTORS.NEXT_BTN, handleNextClick);
    // Back button clicks
    const cleanup2 = delegateEvent(root, 'click', SELECTORS.BACK_BTN, handleBackClick);
    // Skip button clicks
    const cleanup3 = delegateEvent(root, 'click', SELECTORS.SKIP, handleSkipClick);
    // Submit button clicks
    const cleanup4 = delegateEvent(root, 'click', SELECTORS.SUBMIT, handleSubmitClick);
    cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4);
}
/**
 * Handle next button click
 */
function handleNextClick(event, target) {
    event.preventDefault();
    logVerbose('Next button clicked');
    // Validate current step before proceeding
    const currentStep = getCurrentStep();
    if (!currentStep)
        return;
    // Check if we need to validate a step_item
    if (currentStepItemId) {
        const stepItem = stepItems.find(item => item.id === currentStepItemId);
        if (stepItem && !validateStepElement(stepItem.element)) {
            logVerbose('Step item validation failed, staying on current step');
            return;
        }
    }
    else if (!validateStepElement(currentStep.element)) {
        logVerbose('Step validation failed, staying on current step');
        return;
    }
    // Determine next step using branching logic
    let nextStepId = null;
    if (currentStepItemId) {
        // If we're in a step_item, use its data-go-to attribute
        const stepItem = stepItems.find(item => item.id === currentStepItemId);
        if (stepItem) {
            nextStepId = getAttrValue(stepItem.element, 'data-go-to');
            logVerbose(`Step item ${currentStepItemId} has data-go-to: ${nextStepId}`);
        }
    }
    if (!nextStepId) {
        // Use branching logic to determine next step
        nextStepId = getNextStep(currentStep.id);
        logVerbose(`Branching logic determined next step: ${nextStepId}`);
    }
    if (nextStepId) {
        goToStepById(nextStepId);
    }
    else {
        goToNextStep();
    }
}
/**
 * Handle back button click
 */
function handleBackClick(event, target) {
    event.preventDefault();
    logVerbose('Back button clicked');
    goToPreviousStep();
}
/**
 * Handle skip button click
 */
function handleSkipClick(event, target) {
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
        }
        else {
            logVerbose(`Skip target step not found: ${skipTarget}`);
        }
    }
}
/**
 * Handle submit button click
 */
function handleSubmitClick(event, target) {
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
 * Go to a step by ID (works for both parent steps and step_items)
 */
export function goToStepById(stepId) {
    logVerbose(`Attempting to navigate to step: ${stepId}`);
    // First check if it's a parent step
    const parentStepIndex = findStepIndexById(stepId);
    if (parentStepIndex !== -1) {
        logVerbose(`Found parent step: ${stepId} at index ${parentStepIndex}`);
        currentStepItemId = null; // Clear step item tracking
        goToStep(parentStepIndex);
        return;
    }
    // Check if it's a step_item
    const stepItem = stepItems.find(item => item.id === stepId);
    if (stepItem) {
        logVerbose(`Found step_item: ${stepId} in parent step ${stepItem.parentStepIndex}`);
        // Navigate to the parent step first
        if (stepItem.parentStepIndex !== undefined) {
            goToStep(stepItem.parentStepIndex);
            // Then show the specific step_item
            showStepItem(stepId);
        }
        return;
    }
    console.warn(`[FormLib] Step not found: ${stepId}`);
    logVerbose(`Step not found`, {
        targetStepId: stepId,
        availableParentSteps: steps.map(s => s.id),
        availableStepItems: stepItems.map(s => s.id)
    });
}
/**
 * Validate a step element (works for both parent steps and step_items)
 */
function validateStepElement(element) {
    // Use existing validation logic from validateCurrentStep
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
                logVerbose('Validation failed: invalid email format', {
                    element: htmlInput,
                    value: htmlInput.value
                });
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
export function showStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length)
        return;
    const step = steps[stepIndex];
    const element = step.element;
    // Use showStepCompletely to properly clear all hiding styles
    showStepCompletely(element, `parent step ${stepIndex} (${step.id})`);
    // Update FormState
    FormState.setStepInfo(step.id, { visible: true, visited: true });
    // IMPORTANT: Keep step_items hidden when showing parent step
    // Only show step_items when explicitly triggered by radio button clicks
    const stepItemsInThisStep = stepItems.filter(item => item.parentStepIndex === stepIndex);
    stepItemsInThisStep.forEach(stepItem => {
        hideStepCompletely(stepItem.element, `step_item ${stepItem.id} (keeping hidden on parent step show)`);
        FormState.setStepVisibility(stepItem.id, false);
    });
    logVerbose(`Step shown: ${step.id} (index: ${stepIndex})`, {
        display: element.style.display,
        visibility: element.style.visibility,
        classes: element.className,
        stepItemsHidden: stepItemsInThisStep.length
    });
}
/**
 * Hide a specific step
 */
function hideStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= steps.length)
        return;
    const step = steps[stepIndex];
    const element = step.element;
    // Use hideStepCompletely to properly hide the step (but not as aggressively as step_items)
    hideStepCompletely(element, `parent step ${stepIndex} (${step.id})`);
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
function goToNextStep() {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
        goToStep(nextIndex);
    }
    else {
        logVerbose('Already at last step');
    }
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
    const backButtons = queryAllByAttr(SELECTORS.BACK_BTN);
    const nextButtons = queryAllByAttr(SELECTORS.NEXT_BTN);
    const submitButtons = queryAllByAttr(SELECTORS.SUBMIT);
    // Back button state
    backButtons.forEach(btn => {
        const htmlBtn = btn;
        if (currentStepIndex === 0) {
            htmlBtn.disabled = true;
            addClass(btn, CSS_CLASSES.DISABLED);
        }
        else {
            htmlBtn.disabled = false;
            removeClass(btn, CSS_CLASSES.DISABLED);
        }
    });
    // Next/Submit button state
    const isLastStep = currentStepIndex === steps.length - 1;
    nextButtons.forEach(btn => {
        const htmlBtn = btn;
        if (isLastStep) {
            htmlBtn.style.display = 'none';
        }
        else {
            htmlBtn.style.display = '';
            htmlBtn.disabled = false;
            removeClass(btn, CSS_CLASSES.DISABLED);
        }
    });
    submitButtons.forEach(btn => {
        const htmlBtn = btn;
        if (isLastStep) {
            htmlBtn.style.display = '';
            htmlBtn.disabled = false;
            removeClass(btn, CSS_CLASSES.DISABLED);
        }
        else {
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
function validateCurrentStep() {
    const currentStep = getCurrentStep();
    if (!currentStep)
        return true;
    // Basic validation - check required fields
    const requiredInputs = currentStep.element.querySelectorAll('[required]');
    for (const input of requiredInputs) {
        const htmlInput = input;
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
function validateAllVisibleSteps() {
    let isValid = true;
    steps.forEach((step, index) => {
        if (FormState.isStepVisible(step.id)) {
            const requiredInputs = step.element.querySelectorAll('[required]');
            for (const input of requiredInputs) {
                const htmlInput = input;
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
/**
 * Debug function to log all registered steps (can be called from console)
 */
function debugSteps() {
    logVerbose('=== DEBUG: All Registered Steps ===');
    steps.forEach((step, index) => {
        const element = step.element;
        logVerbose(`Step ${index}:`, {
            stepId: step.id,
            dataAnswer: element.getAttribute('data-answer'),
            elementId: element.getAttribute('id'),
            index: step.index,
            visible: element.style.display !== 'none',
            classes: element.className,
            element: element
        });
    });
    logVerbose('=== END DEBUG ===');
}
// Make debug function available globally
window.debugFormSteps = debugSteps;
//# sourceMappingURL=multiStep.js.map