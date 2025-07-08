/**
 * Branching logic module for handling conditional form navigation
 */
import { SELECTORS } from '../config.js';
import { logVerbose, queryAllByAttr, queryByAttr, getAttrValue, delegateEvent, getInputValue, isFormInput } from './utils.js';
import { FormState } from './formState.js';
// Forward declaration for multiStep integration
let showStepItemFn = null;
let hideStepItemFn = null;
/**
 * Set step item functions from multiStep module
 */
export function setStepItemFunctions(showStepItemFunction, hideStepItemFunction) {
    showStepItemFn = showStepItemFunction;
    hideStepItemFn = hideStepItemFunction;
    logVerbose('Step item functions set for branching module');
}
let initialized = false;
let cleanupFunctions = [];
/**
 * Initialize branching functionality
 */
export function initBranching(root = document) {
    if (initialized) {
        logVerbose('Branching already initialized, cleaning up first');
        resetBranching();
    }
    logVerbose('Initializing branching logic');
    // Set up event listeners for branching triggers
    setupBranchingListeners(root);
    initialized = true;
    logVerbose('Branching initialization complete');
}
/**
 * Set up event listeners for branching logic
 */
function setupBranchingListeners(root) {
    // Main event listener for form inputs with data-go-to
    const cleanup1 = delegateEvent(root, 'change', SELECTORS.GO_TO, handleBranchTrigger);
    // Input events for real-time branching
    const cleanup2 = delegateEvent(root, 'input', SELECTORS.GO_TO, handleBranchTrigger);
    // Click events for radio buttons and checkboxes
    const cleanup3 = delegateEvent(root, 'click', SELECTORS.GO_TO, handleBranchTrigger);
    // Enhanced radio button support for custom styling
    const cleanup4 = delegateEvent(root, 'click', 'label.radio_field, .w-radio, .radio_button-skip-step, .w-form-formradioinput, .w-radio-input', handleRadioLabelClick);
    cleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4);
}
/**
 * Handle clicks on radio button labels and visual elements
 */
function handleRadioLabelClick(event, target) {
    // Find the associated radio input
    let radioInput = null;
    // Method 1: Look for radio input inside the clicked element
    radioInput = target.querySelector('input[type="radio"][data-go-to]');
    // Method 2: Look in parent label
    if (!radioInput) {
        const parentLabel = target.closest('label');
        if (parentLabel) {
            radioInput = parentLabel.querySelector('input[type="radio"][data-go-to]');
        }
    }
    // Method 3: Look in sibling elements (for complex layouts)
    if (!radioInput) {
        const container = target.closest('.radio_field, .w-radio, .radio_component');
        if (container) {
            radioInput = container.querySelector('input[type="radio"][data-go-to]');
        }
    }
    if (radioInput && getAttrValue(radioInput, 'data-go-to')) {
        event.preventDefault();
        event.stopPropagation();
        // Select the radio button
        radioInput.checked = true;
        // Apply active styling
        applyRadioActiveClass(radioInput);
        // Trigger branching logic
        const syntheticEvent = new Event('change', { bubbles: true });
        Object.defineProperty(syntheticEvent, 'target', { value: radioInput });
        handleBranchTrigger(syntheticEvent, radioInput);
    }
}
/**
 * Evaluate condition string against active conditions
 */
function evaluateCondition(condition, activeConditions) {
    if (!condition || typeof condition !== 'string') {
        logVerbose('Invalid condition provided', { condition });
        return false;
    }
    try {
        // Simple condition evaluation - can be enhanced for complex logic
        // For now, just check if the condition key exists in activeConditions
        const trimmedCondition = condition.trim();
        // Handle multiple conditions separated by commas (OR logic)
        if (trimmedCondition.includes(',')) {
            const conditions = trimmedCondition.split(',').map(c => c.trim());
            return conditions.some(cond => !!activeConditions[cond]);
        }
        // Handle multiple conditions separated by ampersand (AND logic)
        if (trimmedCondition.includes('&')) {
            const conditions = trimmedCondition.split('&').map(c => c.trim());
            return conditions.every(cond => !!activeConditions[cond]);
        }
        // Single condition
        return !!activeConditions[trimmedCondition];
    }
    catch (error) {
        logVerbose('Error evaluating condition', { condition, error });
        return false;
    }
}
/**
 * Validate data-go-to attribute value
 */
function validateGoToValue(goToValue) {
    if (!goToValue)
        return false;
    // Check for valid step ID format (alphanumeric, hyphens, underscores)
    const validStepIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validStepIdPattern.test(goToValue)) {
        logVerbose('Invalid data-go-to value format', { goToValue });
        return false;
    }
    return true;
}
/**
 * Handle branch trigger events
 */
function handleBranchTrigger(event, target) {
    if (!isFormInput(target)) {
        return;
    }
    const goToValue = getAttrValue(target, 'data-go-to');
    // Validate go-to value before proceeding
    if (goToValue && !validateGoToValue(goToValue)) {
        logVerbose('Skipping branch trigger due to invalid data-go-to value', { goToValue });
        return;
    }
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
    // Handle different input types with better error handling
    try {
        if (target instanceof HTMLInputElement) {
            if (target.type === 'radio' && target.checked) {
                if (!goToValue) {
                    logVerbose('Radio button has no data-go-to attribute, skipping navigation');
                    return;
                }
                // Handle radio group selection
                handleRadioGroupSelection(target);
                // Apply active class styling
                applyRadioActiveClass(target);
                // Activate branch and show step item
                activateBranch(goToValue, target.value);
                triggerStepItemVisibility(goToValue);
            }
            else if (target.type === 'checkbox') {
                if (goToValue) {
                    if (target.checked) {
                        activateBranch(goToValue, target.value);
                    }
                    else {
                        deactivateBranch(goToValue);
                    }
                }
            }
            else if (target.type !== 'radio' && target.type !== 'checkbox') {
                // Text inputs, selects, etc.
                if (goToValue) {
                    if (inputValue) {
                        activateBranch(goToValue, inputValue);
                    }
                    else {
                        deactivateBranch(goToValue);
                    }
                }
            }
        }
        else {
            // Select elements and textareas
            if (goToValue) {
                if (inputValue) {
                    activateBranch(goToValue, inputValue);
                }
                else {
                    deactivateBranch(goToValue);
                }
            }
        }
    }
    catch (error) {
        logVerbose('Error handling branch trigger', { error, element: target });
    }
    // Update step visibility if we have active conditions
    const activeConditions = FormState.getBranchPath().activeConditions;
    if (Object.keys(activeConditions).length > 0) {
        updateStepVisibility();
    }
}
/**
 * Apply active class to radio button and remove from others in the same group
 */
function applyRadioActiveClass(selectedRadio) {
    const activeClass = getAttrValue(selectedRadio, 'fs-inputactive-class') || 'is-active-inputactive';
    // Remove active class from other radio buttons in the same group
    if (selectedRadio.name) {
        const radioGroup = document.querySelectorAll(`input[type="radio"][name="${selectedRadio.name}"]`);
        radioGroup.forEach(radio => {
            const htmlRadio = radio;
            const radioLabel = htmlRadio.closest('label');
            if (htmlRadio !== selectedRadio) {
                htmlRadio.classList.remove(activeClass);
                radioLabel?.classList.remove(activeClass);
            }
        });
    }
    // Add active class to the selected radio and its label
    selectedRadio.classList.add(activeClass);
    const parentLabel = selectedRadio.closest('label');
    parentLabel?.classList.add(activeClass);
}
/**
 * Handle radio button group selection - deactivate other options in the same group
 */
function handleRadioGroupSelection(selectedRadio) {
    if (!selectedRadio.name)
        return;
    // Find all radio buttons in the same group
    const radioGroup = document.querySelectorAll(`input[type="radio"][name="${selectedRadio.name}"]`);
    radioGroup.forEach(radio => {
        const htmlRadio = radio;
        const radioGoTo = getAttrValue(htmlRadio, 'data-go-to');
        if (htmlRadio !== selectedRadio && radioGoTo) {
            // Deactivate this radio button's branch
            deactivateBranch(radioGoTo);
            hideStepItem(radioGoTo);
        }
    });
}
/**
 * Show a step item by calling the multiStep function
 */
function showStepItem(stepItemId) {
    if (showStepItemFn) {
        showStepItemFn(stepItemId);
    }
    else {
        // Fallback to just updating FormState
        FormState.setStepVisibility(stepItemId, true);
        logVerbose(`Set step item visibility to true in FormState: ${stepItemId} (multiStep function not available)`);
    }
}
/**
 * Hide a step item by calling the multiStep function
 */
function hideStepItem(stepItemId) {
    if (hideStepItemFn) {
        hideStepItemFn(stepItemId);
    }
    else {
        // Fallback to just updating FormState
        FormState.setStepVisibility(stepItemId, false);
        logVerbose(`Set step item visibility to false in FormState: ${stepItemId} (multiStep function not available)`);
    }
}
/**
 * Trigger step_item visibility based on radio button selection
 */
function triggerStepItemVisibility(stepItemId) {
    // Defensive check
    if (!stepItemId) {
        logVerbose('No stepItemId provided to triggerStepItemVisibility');
        return;
    }
    logVerbose('=== BRANCHING: TRIGGER STEP ITEM VISIBILITY ===');
    logVerbose(`Triggering visibility for step_item: ${stepItemId}`);
    // Check if this might conflict with skip navigation
    const currentStep = FormState.getCurrentStep();
    logVerbose('Branching visibility trigger context', {
        targetStepItem: stepItemId,
        currentStep,
        isSkipOperation: false // This is branching, not skip
    });
    showStepItem(stepItemId);
    logVerbose('=== BRANCHING: TRIGGER STEP ITEM VISIBILITY END ===');
}
/**
 * Activate a branch and store its state
 */
function activateBranch(target, value) {
    if (!target)
        return;
    FormState.setActiveCondition(target, value);
}
/**
 * Deactivate a branch path
 */
function deactivateBranch(target) {
    if (!target)
        return;
    logVerbose(`Deactivating branch: ${target}`);
    // Remove active condition from state
    FormState.setActiveCondition(target, null);
    // Clear fields from this branch
    clearBranchFields(target);
    // Update step visibility
    updateStepVisibility();
}
/**
 * Get the next step based on branching logic
 */
export function getNextStep() {
    const activeConditions = FormState.getBranchPath().activeConditions;
    // This logic can be enhanced to handle complex rules.
    // For now, it returns the first active condition target.
    const nextStep = Object.keys(activeConditions).find(key => activeConditions[key]);
    return nextStep || null;
}
/**
 * Update step visibility based on active branching conditions.
 */
function updateStepVisibility() {
    const allSteps = queryAllByAttr(SELECTORS.STEP);
    const activeConditions = FormState.getBranchPath().activeConditions;
    allSteps.forEach(step => {
        const stepAnswer = getAttrValue(step, 'data-answer');
        const shouldBeVisible = shouldStepBeVisible(stepAnswer, activeConditions);
        // Update FormState
        if (stepAnswer) {
            FormState.setStepVisibility(stepAnswer, shouldBeVisible);
        }
    });
}
/**
 * Check if a step should be visible based on its data-show-if attribute.
 */
function shouldStepBeVisible(stepAnswer, activeConditions) {
    if (!stepAnswer)
        return true; // Steps without data-answer are always visible
    // Find the step element
    const stepElement = queryByAttr(`[data-answer="${stepAnswer}"]`);
    if (stepElement) {
        const showIf = getAttrValue(stepElement, 'data-show-if');
        if (showIf) {
            // Check if the step matches the show-if condition
            const conditionMet = evaluateCondition(showIf, activeConditions);
            return conditionMet;
        }
    }
    // Default to not visible if it has conditions but none are met
    return false;
}
/**
 * Clear fields associated with inactive branches
 */
function clearBranchFields(branchTarget) {
    // Find all fields that were set when this branch was active
    const fieldsToCheck = document.querySelectorAll(`[data-step-field-name]`);
    fieldsToCheck.forEach(field => {
        const fieldElement = field;
        const stepElement = fieldElement.closest(SELECTORS.STEP);
        if (stepElement) {
            const stepAnswer = getAttrValue(stepElement, 'data-answer');
            if (stepAnswer === branchTarget) {
                // Clear field value
                fieldElement.value = '';
                if (fieldElement.name) {
                    FormState.setField(fieldElement.name, null);
                }
            }
        }
    });
}
/**
 * Reset branching module state
 */
export function resetBranching() {
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
        const htmlStep = step;
        htmlStep.style.display = 'none';
        htmlStep.classList.add('hidden-step');
    });
    initialized = false;
    logVerbose('Branching reset complete');
}
/**
 * Get current branching state for debugging
 */
export function getBranchingState() {
    return {
        initialized,
        activeConditions: FormState.getBranchPath().activeConditions,
        branchPath: FormState.getBranchPath()
    };
}
//# sourceMappingURL=branching.js.map