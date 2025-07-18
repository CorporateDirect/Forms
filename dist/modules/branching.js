/**
 * Branching logic module for handling conditional form navigation
 */
import { SELECTORS } from '../config.js';
import { logVerbose, queryAllByAttr, queryByAttr, getAttrValue, delegateEvent, getInputValue, isFormInput } from './utils.js';
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
    console.log('🌿 [Branching] === INITIALIZATION START ===');
    console.log('🔍 [Branching] Root element:', {
        isDocument: root === document,
        elementType: root.constructor.name
    });
    logVerbose('Initializing branching logic');
    // Check if multiStep will be initialized to handle branch events
    const multistepForms = root.querySelectorAll(SELECTORS.MULTISTEP);
    const stepElements = root.querySelectorAll(SELECTORS.STEP);
    console.log('📋 [Branching] Form detection:', {
        multistepForms: multistepForms.length,
        stepElements: stepElements.length,
        multistepSelector: SELECTORS.MULTISTEP,
        stepSelector: SELECTORS.STEP
    });
    if (multistepForms.length === 0 && stepElements.length === 0) {
        console.warn('⚠️ [Branching] Warning: Branching initialized but no multi-step forms found. Branch events may not be handled.');
        logVerbose('Warning: Branching initialized but no multi-step forms found. Branch events may not be handled.');
    }
    // Find all elements with data-go-to attributes
    const goToElements = root.querySelectorAll(SELECTORS.GO_TO);
    console.log('🎯 [Branching] data-go-to elements found:', {
        count: goToElements.length,
        selector: SELECTORS.GO_TO,
        elements: Array.from(goToElements).map((el, i) => ({
            index: i,
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            dataGoTo: el.getAttribute('data-go-to'),
            name: el.name,
            type: el.type || el.tagName,
            value: el.value
        }))
    });
    // Find all elements with data-answer attributes
    const answerElements = root.querySelectorAll(SELECTORS.ANSWER);
    console.log('🎯 [Branching] data-answer elements found:', {
        count: answerElements.length,
        selector: SELECTORS.ANSWER,
        elements: Array.from(answerElements).map((el, i) => ({
            index: i,
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            dataAnswer: el.getAttribute('data-answer'),
            isStep: el.hasAttribute('data-form') && el.getAttribute('data-form') === 'step'
        }))
    });
    // Set up event listeners for branching triggers
    setupBranchingListeners(root);
    initialized = true;
    console.log('✅ [Branching] Initialization complete');
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
    console.log('🌿 [Branch] Trigger event detected', {
        eventType: event.type,
        element: target,
        tagName: target.tagName,
        className: target.className,
        id: target.id
    });
    if (!initialized) {
        console.error('❌ [Branch] Module not initialized, ignoring branch trigger', {
            target: target,
            initialized: initialized,
            eventType: event.type
        });
        return;
    }
    if (!isFormInput(target)) {
        console.log('ℹ️ [Branch] Element is not a form input, ignoring', {
            tagName: target.tagName,
            isInput: target instanceof HTMLInputElement,
            isSelect: target instanceof HTMLSelectElement,
            isTextarea: target instanceof HTMLTextAreaElement
        });
        return;
    }
    const goToValue = getAttrValue(target, 'data-go-to');
    const fieldName = target.name || getAttrValue(target, 'data-step-field-name');
    const inputValue = getInputValue(target);
    const inputType = target.type || target.tagName;
    console.log('📋 [Branch] Data attributes analysis:', {
        'data-go-to': goToValue,
        'data-step-field-name': getAttrValue(target, 'data-step-field-name'),
        'name': target.name,
        'type': inputType,
        'value': inputValue,
        'checked': target.checked,
        allAttributes: Array.from(target.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
        }))
    });
    // Validate go-to value before proceeding
    if (goToValue && !validateGoToValue(goToValue)) {
        console.error('❌ [Branch] Invalid data-go-to value format', {
            goToValue,
            validFormat: 'alphanumeric, hyphens, underscores only',
            pattern: '/^[a-zA-Z0-9_-]+$/'
        });
        return;
    }
    // Check if this is pointing to an actual step (not a step_item)
    // If so, use direct step navigation instead of complex branching logic
    const targetElement = document.querySelector(`[data-answer="${goToValue}"]`);
    if (targetElement && targetElement.closest('[data-form="step"]')) {
        console.log('ℹ️ [Branch] Target is a main step, using direct navigation instead of branching logic:', {
            goToValue,
            targetElement: targetElement.tagName,
            isMainStep: true
        });
        // For radio buttons, handle selection and navigate directly
        if (target instanceof HTMLInputElement && target.type === 'radio' && target.checked) {
            // Apply active styling
            applyRadioActiveClass(target);
            // Navigate directly to target step
            console.log('🎯 [Branch] Navigating directly to main step:', { goToValue });
            formEvents.emit('step:navigate', { targetStepId: goToValue, reason: 'radio_selection_main_step' });
        }
        return;
    }
    // For the new linear structure with separate steps for each branch option,
    // radio buttons should use normal step navigation instead of complex branching
    if (target instanceof HTMLInputElement && target.type === 'radio') {
        console.log('🔄 [Branch] Radio button detected - using simple step navigation instead of branching logic:', {
            goToValue,
            radioName: target.name,
            radioValue: target.value,
            isChecked: target.checked
        });
        if (target.checked && goToValue) {
            // Apply radio button styling
            applyRadioActiveClass(target);
            // Use direct step navigation event
            console.log('🎯 [Branch] Emitting step:navigate for radio button:', { targetStepId: goToValue });
            formEvents.emit('step:navigate', { targetStepId: goToValue, reason: 'radio_button_selection' });
        }
        // Skip all the complex branching logic for radio buttons
        return;
    }
    console.log('🎯 [Branch] Processing branch trigger:', {
        element: target,
        goTo: goToValue,
        value: inputValue,
        type: inputType,
        fieldName: fieldName,
        hasGoTo: !!goToValue,
        hasValue: !!inputValue
    });
    // Note: Field value now stored centrally by field coordinator
    console.log('💾 [Branch] Field change detected for branching logic:', {
        fieldName,
        value: inputValue,
        goToValue
    });
    // Handle different input types with detailed logging
    try {
        if (target instanceof HTMLInputElement) {
            if (target.type === 'radio' && target.checked) {
                console.log('📻 [Branch] Processing radio button selection:', {
                    name: target.name,
                    value: target.value,
                    checked: target.checked,
                    goTo: goToValue
                });
                if (!goToValue) {
                    console.warn('⚠️ [Branch] Radio button has no data-go-to attribute, skipping navigation', {
                        element: target,
                        name: target.name,
                        value: target.value
                    });
                    return;
                }
                // Verify target step exists
                const targetElement = document.querySelector(`[data-answer="${goToValue}"]`);
                if (!targetElement) {
                    const allAnswerElements = document.querySelectorAll('[data-answer]');
                    const allAnswerValues = Array.from(allAnswerElements).map(el => getAttrValue(el, 'data-answer'));
                    console.error('❌ [Branch] Target step not found in DOM!', {
                        searchedFor: goToValue,
                        availableSteps: allAnswerValues,
                        suggestion: `Check if element with data-answer="${goToValue}" exists`,
                        possibleMatches: allAnswerValues.filter(val => val && val.includes(goToValue))
                    });
                }
                // Handle radio group selection
                handleRadioGroupSelection(target);
                // Apply active class styling
                applyRadioActiveClass(target);
                // Activate branch and emit event
                activateBranch(goToValue);
                console.log('🚀 [Branch] Emitting branch:change event:', {
                    targetStepId: goToValue,
                    triggerValue: target.value,
                    triggerType: 'radio'
                });
                formEvents.emit('branch:change', { targetStepId: goToValue });
            }
            else if (target.type === 'checkbox') {
                console.log('☑️ [Branch] Processing checkbox:', {
                    name: target.name,
                    value: target.value,
                    checked: target.checked,
                    goTo: goToValue
                });
                if (goToValue) {
                    if (target.checked) {
                        console.log('✅ [Branch] Checkbox checked, activating branch:', { goToValue });
                        activateBranch(goToValue);
                    }
                    else {
                        console.log('❌ [Branch] Checkbox unchecked, deactivating branch:', { goToValue });
                        deactivateBranch(goToValue);
                    }
                }
            }
            else if (target.type !== 'radio' && target.type !== 'checkbox') {
                console.log('📝 [Branch] Processing text input/other:', {
                    type: target.type,
                    name: target.name,
                    value: inputValue,
                    goTo: goToValue
                });
                // Text inputs, selects, etc.
                if (goToValue) {
                    if (inputValue) {
                        console.log('✅ [Branch] Input has value, activating branch:', { goToValue, inputValue });
                        activateBranch(goToValue);
                    }
                    else {
                        console.log('❌ [Branch] Input is empty, deactivating branch:', { goToValue });
                        deactivateBranch(goToValue);
                    }
                }
            }
        }
        else {
            console.log('📋 [Branch] Processing select/textarea:', {
                tagName: target.tagName,
                value: inputValue,
                goTo: goToValue
            });
            // Select elements and textareas
            if (goToValue) {
                if (inputValue) {
                    console.log('✅ [Branch] Element has value, activating branch:', { goToValue, inputValue });
                    activateBranch(goToValue);
                }
                else {
                    console.log('❌ [Branch] Element is empty, deactivating branch:', { goToValue });
                    deactivateBranch(goToValue);
                }
            }
        }
    }
    catch (error) {
        console.error('💥 [Branch] Error handling branch trigger:', {
            error: error,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            element: target,
            goToValue,
            inputValue,
            fieldName
        });
    }
    // Radio button branching: Navigate to target step using normal step navigation
    console.log('ℹ️ [Branch] Radio button navigation complete - target step navigation triggered');
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
 * Activate a branch target - navigate to target step
 */
function activateBranch(target) {
    if (!target)
        return;
    console.log('🌿 [Branch] Navigating to branch target step:', { target });
    // Emit navigation event to go to target step (not step_item)
    formEvents.emit('step:navigate', { targetStepId: target, reason: 'radio_selection' });
}
/**
 * Deactivate a branch target - clear fields only (no navigation needed for separate steps)
 */
function deactivateBranch(target) {
    if (!target)
        return;
    console.log('🍂 [Branch] Deactivating branch target (clearing fields only):', { target });
    // Clear form data for this branch
    clearBranchFields(target);
    // Note: No hide event needed since we're using separate steps now
}
/**
 * Update visibility of all conditional steps based on active branches
 */
function updateStepVisibility() {
    const allConditionalSteps = queryAllByAttr('[data-show-if]');
    // Active conditions removed (was part of advanced skip logic)
    const activeConditions = {};
    allConditionalSteps.forEach(step => {
        const condition = getAttrValue(step, 'data-show-if');
        const stepId = getAttrValue(step, 'data-answer');
        if (condition && stepId) {
            if (evaluateCondition(condition, activeConditions)) {
                // Emit event for step to be shown - let multiStep handle visibility
                logVerbose('Branching logic determines step should be visible', { stepId });
                formEvents.emit('branch:show', { stepId });
            }
            else {
                // Emit event for step to be hidden - let multiStep handle visibility
                logVerbose('Branching logic determines step should be hidden', { stepId });
                formEvents.emit('branch:hide', { stepId });
            }
        }
    });
}
// Note: Field required state management now handled by multiStep.ts to avoid conflicts
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
 * Get next step based on current form state and branching logic
 * @param currentStepId - Current step ID
 * @returns Next step ID or null if no branching applies
 */
export function getNextStep(currentStepId) {
    if (!initialized) {
        logVerbose('Branching module not initialized, cannot determine next step');
        return null;
    }
    logVerbose('Evaluating next step for branching logic', { currentStepId });
    // Find all data-go-to elements in current step that are active/selected
    const currentStepElement = document.querySelector(`[data-answer="${currentStepId}"]`);
    if (!currentStepElement) {
        logVerbose('Current step element not found', { currentStepId });
        return null;
    }
    const goToElements = currentStepElement.querySelectorAll(SELECTORS.GO_TO);
    for (const element of goToElements) {
        const input = element;
        const goToValue = getAttrValue(input, 'data-go-to');
        if (!goToValue)
            continue;
        // Check if this element determines the next step
        if (input.type === 'radio' && input.checked) {
            logVerbose('Found active radio determining next step', {
                goToValue,
                inputName: input.name,
                inputValue: input.value
            });
            return goToValue;
        }
        else if (input.type === 'checkbox' && input.checked) {
            logVerbose('Found active checkbox determining next step', {
                goToValue,
                inputName: input.name,
                inputValue: input.value
            });
            return goToValue;
        }
        else if (input.type !== 'radio' && input.type !== 'checkbox' && input.value.trim()) {
            logVerbose('Found input with value determining next step', {
                goToValue,
                inputType: input.type,
                inputValue: input.value
            });
            return goToValue;
        }
    }
    logVerbose('No branching logic applies, returning null for sequential navigation');
    return null;
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
    // Active conditions removed (was part of advanced skip logic)
    initialized = false;
    logVerbose('Branching module reset');
}
/**
 * Get current branching state
 */
export function getBranchingState() {
    return {
        initialized,
        // activeConditions removed (was part of advanced skip logic)
    };
}
//# sourceMappingURL=branching.js.map