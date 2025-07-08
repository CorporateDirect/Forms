/**
 * Branching logic module for handling conditional form navigation
 */
import { SELECTORS } from '../config.js';
import { logVerbose, queryAllByAttr, queryByAttr, getAttrValue, delegateEvent, getInputValue, isFormInput, showElement, hideElement } from './utils.js';
import { FormState } from './formState.js';
import { formEvents } from './events.js';
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
    // Register this module as initialized
    formEvents.registerModule('branching');
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
    if (!initialized) {
        logVerbose('Branching module not initialized, ignoring branch trigger');
        return;
    }
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
                formEvents.emit('branch:change', { targetStepId: goToValue });
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
 * Handle radio group state for branching
 */
function handleRadioGroupSelection(selectedRadio) {
    const groupName = selectedRadio.name;
    if (!groupName)
        return;
    const allRadiosInGroup = document.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
    allRadiosInGroup.forEach(radio => {
        const r = radio;
        if (r !== selectedRadio) {
            const goToValue = getAttrValue(r, 'data-go-to');
            if (goToValue) {
                deactivateBranch(goToValue);
            }
        }
    });
}
/**
 * Activate a branch target
 */
function activateBranch(target, value) {
    if (!target)
        return;
    FormState.setActiveCondition(target, value);
}
/**
 * Deactivate a branch target
 */
function deactivateBranch(target) {
    if (!target)
        return;
    FormState.setActiveCondition(target, null);
    clearBranchFields(target);
}
/**
 * Get the next step based on branching logic
 * (This might still be useful for complex scenarios, but core navigation is event-based)
 */
export function getNextStep() {
    const activeConditions = FormState.getBranchPath().activeConditions;
    const activeTargets = Object.keys(activeConditions).filter(key => activeConditions[key]);
    return activeTargets.length > 0 ? activeTargets[0] : null;
}
/**
 * Update visibility of all conditional steps based on active branches
 */
function updateStepVisibility() {
    const allConditionalSteps = queryAllByAttr('[data-show-if]');
    const activeConditions = FormState.getBranchPath().activeConditions;
    allConditionalSteps.forEach(step => {
        const condition = getAttrValue(step, 'data-show-if');
        if (condition) {
            if (evaluateCondition(condition, activeConditions)) {
                showElement(step);
            }
            else {
                hideElement(step);
            }
        }
    });
}
/**
 * Clear fields within a deactivated branch
 */
function clearBranchFields(branchTarget) {
    const fieldsToClear = [];
    const branchContainer = queryByAttr(`[data-answer="${branchTarget}"]`);
    if (branchContainer) {
        const fields = queryAllByAttr('[data-step-field-name]', branchContainer);
        fields.forEach(field => {
            const fieldName = getAttrValue(field, 'data-step-field-name');
            if (fieldName) {
                fieldsToClear.push(fieldName);
            }
        });
    }
    if (fieldsToClear.length > 0) {
        FormState.clearFields(fieldsToClear);
    }
}
/**
 * Reset branching module state
 */
export function resetBranching() {
    if (!initialized) {
        logVerbose('Branching module not initialized, nothing to reset');
        return;
    }
    logVerbose('Resetting branching module');
    // Unregister this module
    formEvents.unregisterModule('branching');
    cleanupFunctions.forEach(fn => fn());
    cleanupFunctions = [];
    // Clear relevant parts of FormState
    const branchPath = FormState.getBranchPath();
    branchPath.activeConditions = {};
    initialized = false;
    logVerbose('Branching module reset');
}
/**
 * Get current branching state
 */
export function getBranchingState() {
    return {
        initialized,
        activeConditions: FormState.getBranchPath().activeConditions
    };
}
//# sourceMappingURL=branching.js.map