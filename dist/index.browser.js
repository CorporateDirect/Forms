/*!
 * Form Functionality Library v1.1.0
 * Browser-compatible bundle
 */
(function(window) {
  'use strict';
  
  /**
 * Configuration constants and defaults for the form functionality library
 */
const DATA_ATTRS = {
    // Form types
    MULTISTEP: 'data-form="multistep"',
    LOGIC: 'data-logic',
    // Step elements
    STEP: 'data-form="step"',
    ANSWER: 'data-answer',
    // Navigation buttons
    NEXT_BTN: 'data-form="next-btn"',
    BACK_BTN: 'data-form="back-btn"',
    SUBMIT: 'data-form="submit"',
    SKIP: 'data-skip',
    // Branching logic
    GO_TO: 'data-go-to',
    // Step categorization
    STEP_TYPE: 'data-step-type',
    STEP_SUBTYPE: 'data-step-subtype',
    STEP_NUMBER: 'data-step-number',
    // Summary fields
    STEP_FIELD_NAME: 'data-step-field-name',
    SUMMARY_FIELD: 'data-summary-field',
    SUMMARY_TYPE: 'data-summary-type',
    SUMMARY_SUBTYPE: 'data-summary-subtype',
    SUMMARY_NUMBER: 'data-summary-number',
    JOIN: 'data-join',
    // Validation
    REQUIRED: 'required',
    ERROR_MESSAGE: 'data-error-message'
};
const SELECTORS = {
    // Form types
    MULTISTEP: '[data-form="multistep"]',
    LOGIC: '[data-logic]',
    // Step elements
    STEP: '[data-form="step"]',
    ANSWER: '[data-answer]',
    // Navigation buttons
    NEXT_BTN: '[data-form="next-btn"]',
    BACK_BTN: '[data-form="back-btn"]',
    SUBMIT: '[data-form="submit"]',
    SKIP: '[data-skip]',
    // Branching logic
    GO_TO: '[data-go-to]',
    // Step categorization
    STEP_TYPE: '[data-step-type]',
    STEP_SUBTYPE: '[data-step-subtype]',
    STEP_NUMBER: '[data-step-number]',
    // Summary fields
    STEP_FIELD_NAME: '[data-step-field-name]',
    SUMMARY_FIELD: '[data-summary-field]',
    SUMMARY_TYPE: '[data-summary-type]',
    SUMMARY_SUBTYPE: '[data-summary-subtype]',
    SUMMARY_NUMBER: '[data-summary-number]',
    JOIN: '[data-join]',
    // Validation
    REQUIRED: '[required]',
    ERROR_MESSAGE: '[data-error-message]'
};
const DEFAULTS = {
    START_STEP: 1,
    DEBUG: true,
    LOG_PREFIX: '[FormLib]',
    VALIDATION_DELAY: 300, // ms
    ANIMATION_DURATION: 300, // ms
    JOIN_SEPARATOR: {
        space: ' ',
        comma: ', ',
        dash: ' - ',
        pipe: ' | ',
        newline: '\n'
    }
};
const CSS_CLASSES = {
    ACTIVE_STEP: 'active-step',
    HIDDEN_STEP: 'hidden-step',
    HIDDEN_STEP_ITEM: 'hidden-step-item',
    ERROR_FIELD: 'error-field',
    ERROR_MESSAGE: 'error-message',
    DISABLED: 'disabled'
};
  
  /**
 * Utility functions for the form functionality library
 */
/**
 * Enhanced logging with consistent formatting
 */
function logVerbose(message, data) {
    if (!DEFAULTS.DEBUG)
        return;
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = `${DEFAULTS.LOG_PREFIX} [${timestamp}]`;
    if (data !== undefined) {
        console.log(`${prefix} ${message}`, data);
    }
    else {
        console.log(`${prefix} ${message}`);
    }
}
/**
 * Query all elements by data attribute
 */
function queryAllByAttr(selector, root = document) {
    return root.querySelectorAll(selector);
}
/**
 * Query single element by data attribute
 */
function queryByAttr(selector, root = document) {
    return root.querySelector(selector);
}
/**
 * Get attribute value from element
 */
function getAttrValue(element, attribute) {
    return element.getAttribute(attribute);
}
/**
 * Set attribute value on element
 */
function setAttrValue(element, attribute, value) {
    element.setAttribute(attribute, value);
}
/**
 * Remove attribute from element
 */
function removeAttr(element, attribute) {
    element.removeAttribute(attribute);
}
/**
 * Check if element has attribute
 */
function hasAttr(element, attribute) {
    return element.hasAttribute(attribute);
}
/**
 * Add CSS class to element
 */
function addClass(element, className) {
    element.classList.add(className);
}
/**
 * Remove CSS class from element
 */
function removeClass(element, className) {
    element.classList.remove(className);
}
/**
 * Toggle CSS class on element
 */
function toggleClass(element, className, force) {
    element.classList.toggle(className, force);
}
/**
 * Check if element has CSS class
 */
function hasClass(element, className) {
    return element.classList.contains(className);
}
/**
 * Show element (remove hidden-step class and set display)
 */
function showElement(element) {
    removeClass(element, 'hidden-step');
    element.style.display = '';
    logVerbose(`Showing element:`, element);
}
/**
 * Hide element (add hidden-step class and set display none)
 */
function hideElement(element) {
    addClass(element, 'hidden-step');
    element.style.display = 'none';
    logVerbose(`Hiding element:`, element);
}
/**
 * Check if element is visible
 */
function isVisible(element) {
    return element.style.display !== 'none' && !hasClass(element, 'hidden-step');
}
/**
 * Debounce function calls
 */
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}
/**
 * Get form data as object
 */
function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (data[key]) {
            // Handle multiple values (checkboxes, multi-select)
            if (Array.isArray(data[key])) {
                data[key].push(value);
            }
            else {
                data[key] = [data[key], value];
            }
        }
        else {
            data[key] = value;
        }
    }
    return data;
}
/**
 * Get all form inputs within an element
 */
function getFormInputs(element) {
    return Array.from(element.querySelectorAll('input, select, textarea'));
}
/**
 * Check if element is a form input
 */
function isFormInput(element) {
    return element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement;
}
/**
 * Get input value safely
 */
function getInputValue(input) {
    if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox' || input.type === 'radio') {
            return input.checked ? input.value : '';
        }
        return input.value;
    }
    if (input instanceof HTMLSelectElement && input.multiple) {
        return Array.from(input.selectedOptions).map(option => option.value);
    }
    return input.value;
}
/**
 * Set input value safely
 */
function setInputValue(input, value) {
    if (input instanceof HTMLInputElement) {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = Array.isArray(value) ? value.includes(input.value) : value === input.value;
        }
        else {
            input.value = Array.isArray(value) ? value[0] || '' : value;
        }
    }
    else if (input instanceof HTMLSelectElement && input.multiple && Array.isArray(value)) {
        Array.from(input.options).forEach(option => {
            option.selected = value.includes(option.value);
        });
    }
    else {
        input.value = Array.isArray(value) ? value[0] || '' : value;
    }
}
/**
 * Create delegated event listener
 */
function delegateEvent(root, eventType, selector, handler) {
    const delegatedHandler = (event) => {
        const target = event.target?.closest(selector);
        if (target) {
            handler(event, target);
        }
    };
    root.addEventListener(eventType, delegatedHandler);
    // Return cleanup function
    return () => {
        root.removeEventListener(eventType, delegatedHandler);
    };
}
  
  /**
 * Singleton FormState class for managing form data in memory
 */
class FormStateManager {
    constructor() {
        this.data = {};
        this.steps = {};
        this.branchPath = {
            currentStep: '',
            previousSteps: [],
            skippedSteps: [],
            activeConditions: {}
        };
        logVerbose('FormState initialized');
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!FormStateManager.instance) {
            FormStateManager.instance = new FormStateManager();
        }
        return FormStateManager.instance;
    }
    /**
     * Set field value
     */
    setField(name, value) {
        const oldValue = this.data[name];
        this.data[name] = value;
        logVerbose(`Field updated: ${name}`, {
            oldValue,
            newValue: value
        });
        // Trigger change event for dependent logic
        this.onFieldChange(name, value, oldValue);
    }
    /**
     * Get field value
     */
    getField(name) {
        return this.data[name];
    }
    /**
     * Get all field data
     */
    getAll() {
        return { ...this.data };
    }
    /**
     * Clear all data
     */
    clear() {
        const oldData = { ...this.data };
        this.data = {};
        this.steps = {};
        this.branchPath = {
            currentStep: '',
            previousSteps: [],
            skippedSteps: [],
            activeConditions: {}
        };
        logVerbose('FormState cleared', { oldData });
    }
    /**
     * Clear specific fields (used when branching changes)
     */
    clearFields(fieldNames) {
        const clearedFields = {};
        fieldNames.forEach(name => {
            if (this.data[name] !== undefined) {
                clearedFields[name] = this.data[name];
                delete this.data[name];
            }
        });
        if (Object.keys(clearedFields).length > 0) {
            logVerbose('Fields cleared due to branch change', clearedFields);
        }
    }
    /**
     * Set step information
     */
    setStepInfo(stepId, info) {
        if (!this.steps[stepId]) {
            this.steps[stepId] = {
                visible: false,
                visited: false
            };
        }
        Object.assign(this.steps[stepId], info);
        logVerbose(`Step info updated: ${stepId}`, this.steps[stepId]);
    }
    /**
     * Get step information
     */
    getStepInfo(stepId) {
        return this.steps[stepId];
    }
    /**
     * Get all step information
     */
    getAllSteps() {
        return { ...this.steps };
    }
    /**
     * Set step visibility
     */
    setStepVisibility(stepId, visible) {
        this.setStepInfo(stepId, { visible });
        logVerbose(`Step visibility updated: ${stepId}`, { visible });
    }
    /**
     * Set current step in branch path
     */
    setCurrentStep(stepId) {
        if (this.branchPath.currentStep && this.branchPath.currentStep !== stepId) {
            this.branchPath.previousSteps.push(this.branchPath.currentStep);
        }
        this.branchPath.currentStep = stepId;
        // Mark step as visited
        this.setStepInfo(stepId, { visited: true });
        logVerbose(`Current step changed to: ${stepId}`, this.branchPath);
    }
    /**
     * Get current step
     */
    getCurrentStep() {
        return this.branchPath.currentStep;
    }
    /**
     * Get branch path information
     */
    getBranchPath() {
        return { ...this.branchPath };
    }
    /**
     * Add skipped step
     */
    addSkippedStep(stepId) {
        if (!this.branchPath.skippedSteps.includes(stepId)) {
            this.branchPath.skippedSteps.push(stepId);
            logVerbose(`Step skipped: ${stepId}`, this.branchPath.skippedSteps);
        }
    }
    /**
     * Set active condition
     */
    setActiveCondition(key, value) {
        this.branchPath.activeConditions[key] = value;
        logVerbose(`Active condition set: ${key}`, value);
    }
    /**
     * Get active condition
     */
    getActiveCondition(key) {
        return this.branchPath.activeConditions[key];
    }
    /**
     * Get fields by step type/subtype/number
     */
    getFieldsByStep(type, subtype, number) {
        const result = {};
        // For now, return all fields that match the criteria
        // This can be enhanced with more sophisticated filtering
        Object.entries(this.data).forEach(([key, value]) => {
            // Simple implementation - can be enhanced with metadata tracking
            result[key] = value;
        });
        return result;
    }
    /**
     * Handle field change events
     */
    onFieldChange(name, newValue, oldValue) {
        // This can be used to trigger dependent field updates, validation, etc.
        // For now, just log the change
        if (newValue !== oldValue) {
            logVerbose(`Field change detected: ${name}`, {
                from: oldValue,
                to: newValue
            });
        }
    }
    /**
     * Reset to previous step (for back navigation)
     */
    goToPreviousStep() {
        const previousStep = this.branchPath.previousSteps.pop();
        if (previousStep) {
            this.branchPath.currentStep = previousStep;
            logVerbose(`Went back to previous step: ${previousStep}`, this.branchPath);
            return previousStep;
        }
        return null;
    }
    /**
     * Check if step was visited
     */
    wasStepVisited(stepId) {
        return this.steps[stepId]?.visited || false;
    }
    /**
     * Check if step is visible
     */
    isStepVisible(stepId) {
        return this.steps[stepId]?.visible || false;
    }
    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            data: this.data,
            steps: this.steps,
            branchPath: this.branchPath,
            fieldCount: Object.keys(this.data).length,
            stepCount: Object.keys(this.steps).length
        };
    }
}
// Export singleton instance
const FormState = FormStateManager.getInstance();
  
  /**
 * Branching logic module for handling conditional form navigation
 */
let branchingInitialized = false;
let branchingCleanupFunctions = [];
/**
 * Initialize branching functionality
 */
function initBranching(root = document) {
    if (branchingInitialized) {
        logVerbose('Branching already branchingInitialized, cleaning up first');
        resetBranching();
    }
    logVerbose('Initializing branching logic');
    // Find all elements with branching triggers
    const branchTriggers = queryAllByAttr(SELECTORS.GO_TO, root);
    logVerbose(`Found ${branchTriggers.length} branch triggers`);
    // Find all conditional steps
    const conditionalSteps = queryAllByAttr(SELECTORS.ANSWER, root);
    logVerbose(`Found ${conditionalSteps.length} conditional steps`);
    // Set up event listeners for branching triggers
    setupBranchingListeners(root);
    // Don't update step visibility during initialization - let multi-step handle it
    // updateStepVisibility();
    branchingInitialized = true;
    logVerbose('Branching initialization complete');
}
/**
 * Set up event listeners for branching logic
 */
function setupBranchingListeners(root) {
    // Listen for changes on elements with data-go-to
    const cleanup1 = delegateEvent(root, 'change', SELECTORS.GO_TO, handleBranchTrigger);
    // Listen for input events (for real-time branching)
    const cleanup2 = delegateEvent(root, 'input', SELECTORS.GO_TO, handleBranchTrigger);
    // Listen for click events on radio buttons and checkboxes
    const cleanup3 = delegateEvent(root, 'click', SELECTORS.GO_TO, handleBranchTrigger);
    // SPECIAL HANDLING: Listen for clicks on radio button labels (Webflow custom styling)
    // This handles cases where radio inputs have opacity:0 and are positioned behind labels
    const cleanup4 = delegateEvent(root, 'click', 'label.radio_field, label.w-radio, .radio_label, .w-form-label, .w-radio-input', handleRadioLabelClick);
    branchingCleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4);
}
/**
 * Handle clicks on radio button labels (for Webflow custom styling)
 */
function handleRadioLabelClick(event, target) {
    console.log('[FormLib] Radio label clicked', { target, tagName: target.tagName, className: target.className });
    // Find the associated radio input within this label
    let radioInput = target.querySelector('input[type="radio"][data-go-to]');
    // If not found directly, also check if the clicked element is a child of a label containing the radio
    if (!radioInput) {
        const parentLabel = target.closest('label.radio_field, label.w-radio');
        if (parentLabel) {
            radioInput = parentLabel.querySelector('input[type="radio"][data-go-to]');
            console.log('[FormLib] Found radio input in parent label', { parentLabel, radioInput });
        }
    }
    if (!radioInput) {
        console.log('[FormLib] No radio input with data-go-to found in clicked label or parent label');
        // Also check for radio inputs without data-go-to for debugging
        const anyRadioInput = (target.querySelector('input[type="radio"]') ||
            target.closest('label')?.querySelector('input[type="radio"]'));
        if (anyRadioInput) {
            console.log('[FormLib] Found radio input without data-go-to', {
                radioInput: anyRadioInput,
                goTo: getAttrValue(anyRadioInput, 'data-go-to'),
                name: anyRadioInput.name,
                value: anyRadioInput.value,
                allAttributes: Array.from(anyRadioInput.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
            });
        }
        return;
    }
    const goToValue = getAttrValue(radioInput, 'data-go-to');
    console.log('[FormLib] Found radio input in label', {
        radioInput,
        goTo: goToValue,
        name: radioInput.name,
        value: radioInput.value,
        allAttributes: Array.from(radioInput.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
    });
    // Check/select the radio button
    radioInput.checked = true;
    // Apply active class styling
    applyRadioActiveClass(radioInput);
    // Trigger the branching logic for this radio input
    const syntheticEvent = new Event('change', { bubbles: true });
    Object.defineProperty(syntheticEvent, 'target', { value: radioInput });
    console.log('[FormLib] Triggering branch logic for data-go-to:', goToValue);
    handleBranchTrigger(syntheticEvent, radioInput);
}
/**
 * Handle branch trigger events
 */
function handleBranchTrigger(event, target) {
    console.log('[FormLib] handleBranchTrigger called', {
        target,
        tagName: target.tagName,
        type: target.type,
        isFormInput: isFormInput(target)
    });
    if (!isFormInput(target)) {
        console.log('[FormLib] Target is not a form input, ignoring');
        return;
    }
    const goToValue = getAttrValue(target, 'data-go-to');
    const inputValue = getInputValue(target);
    console.log('[FormLib] Branch trigger activated', {
        element: target,
        goTo: goToValue,
        value: inputValue,
        type: target.type || target.tagName,
        checked: target.checked,
        name: target.name,
        allAttributes: Array.from(target.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
    });
    // Store the field value in state
    const fieldName = target.name || getAttrValue(target, 'data-step-field-name');
    if (fieldName) {
        FormState.setField(fieldName, inputValue);
    }
    // Handle different input types
    if (target instanceof HTMLInputElement) {
        if (target.type === 'radio' && target.checked) {
            // For radio buttons, first deactivate all other radio buttons in the same group
            handleRadioGroupSelection(target);
            // Apply active class styling
            applyRadioActiveClass(target);
            activateBranch(goToValue, target.value);
            // For radio buttons with data-go-to, trigger step_item visibility
            if (goToValue) {
                triggerStepItemVisibility(goToValue);
            }
        }
        else if (target.type === 'checkbox') {
            if (target.checked) {
                activateBranch(goToValue, target.value);
            }
            else {
                deactivateBranch(goToValue);
            }
        }
        else if (target.type !== 'radio' && target.type !== 'checkbox') {
            // Text inputs, selects, etc.
            if (inputValue) {
                activateBranch(goToValue, inputValue);
            }
            else {
                deactivateBranch(goToValue);
            }
        }
    }
    else {
        // Select elements and textareas
        if (inputValue) {
            activateBranch(goToValue, inputValue);
        }
        else {
            deactivateBranch(goToValue);
        }
    }
    // Only update step visibility if we have active conditions
    const activeConditions = FormState.getBranchPath().activeConditions;
    const hasActiveConditions = Object.values(activeConditions).some(value => value !== null && value !== undefined && value !== '');
    if (hasActiveConditions) {
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
                if (radioLabel) {
                    radioLabel.classList.remove(activeClass);
                }
            }
        });
    }
    // Add active class to the selected radio and its label
    selectedRadio.classList.add(activeClass);
    const parentLabel = selectedRadio.closest('label');
    if (parentLabel) {
        parentLabel.classList.add(activeClass);
    }
    logVerbose(`Applied active class to radio button: ${selectedRadio.name}`, {
        activeClass,
        radioClasses: selectedRadio.className,
        labelClasses: parentLabel?.className
    });
}
/**
 * Handle radio button group selection - deactivate other options in the same group
 */
function handleRadioGroupSelection(selectedRadio) {
    if (!selectedRadio.name)
        return;
    logVerbose(`Handling radio group selection for: ${selectedRadio.name}`, {
        selectedValue: selectedRadio.value,
        selectedGoTo: getAttrValue(selectedRadio, 'data-go-to')
    });
    // Find all radio buttons in the same group
    const radioGroup = document.querySelectorAll(`input[type="radio"][name="${selectedRadio.name}"]`);
    radioGroup.forEach(radio => {
        const htmlRadio = radio;
        const radioGoTo = getAttrValue(htmlRadio, 'data-go-to');
        if (htmlRadio !== selectedRadio && radioGoTo) {
            // Deactivate this radio button's branch
            logVerbose(`Deactivating radio option: ${radioGoTo}`);
            deactivateBranch(radioGoTo);
            // Hide the corresponding step_item
            if (radioGoTo) {
                hideStepItem(radioGoTo);
            }
        }
    });
}
/**
 * Hide a specific step_item
 */
function hideStepItem(stepItemId) {
    logVerbose(`Hiding step_item: ${stepItemId}`);
    // Import hideStepItem functionality from multiStep module
    import('./multiStep.js').then(({ hideStepItem: multiStepHideStepItem }) => {
        if (multiStepHideStepItem) {
            multiStepHideStepItem(stepItemId);
        }
    }).catch(error => {
        // If the function doesn't exist, we'll handle it manually
        logVerbose(`Manual step_item hiding for: ${stepItemId}`);
        const stepItemElements = document.querySelectorAll(`[data-answer="${stepItemId}"]`);
        stepItemElements.forEach(element => {
            const htmlElement = element;
            htmlElement.style.display = 'none';
            htmlElement.style.visibility = 'hidden';
            htmlElement.classList.add('hidden-step');
        });
    });
}
/**
 * Trigger step_item visibility based on radio button selection
 */
function triggerStepItemVisibility(stepItemId) {
    logVerbose(`Triggering step_item visibility: ${stepItemId}`);
    // Import showStepItem dynamically to avoid circular dependency
    import('./multiStep.js').then(({ showStepItem }) => {
        showStepItem(stepItemId);
    }).catch(error => {
        console.warn('[FormLib] Failed to show step_item:', error);
    });
}
/**
 * Activate a branch path
 */
function activateBranch(target, value) {
    if (!target)
        return;
    logVerbose(`Activating branch: ${target}`, {
        value,
        valueType: typeof value,
        targetString: String(target)
    });
    // Set active condition in state
    FormState.setActiveCondition(target, value);
    // Clear fields from inactive branches
    clearInactiveBranchFields();
    // Log current active conditions after setting
    logVerbose('Active conditions after branch activation', {
        activeConditions: FormState.getBranchPath().activeConditions
    });
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
 * Get the next step based on current branching logic
 */
function getNextStep(currentStep) {
    const activeConditions = FormState.getBranchPath().activeConditions;
    logVerbose('Evaluating next step', {
        currentStep,
        activeConditions
    });
    // Find the most relevant active condition
    for (const [target, value] of Object.entries(activeConditions)) {
        if (value !== null && value !== undefined && value !== '') {
            logVerbose(`Next step determined by branch: ${target}`);
            return target;
        }
    }
    // If no active conditions, return null (will fall back to sequential navigation)
    logVerbose('No active branch conditions, using sequential navigation');
    return null;
}
/**
 * Update step visibility based on current branching state
 */
function updateStepVisibility() {
    const conditionalSteps = queryAllByAttr(SELECTORS.ANSWER);
    const activeConditions = FormState.getBranchPath().activeConditions;
    logVerbose('Updating step visibility', { activeConditions });
    conditionalSteps.forEach(step => {
        const stepAnswer = getAttrValue(step, 'data-answer');
        const shouldBeVisible = shouldStepBeVisible(stepAnswer, activeConditions);
        // Update FormState
        if (stepAnswer) {
            FormState.setStepInfo(stepAnswer, { visible: shouldBeVisible });
        }
        // Update DOM visibility
        const htmlStep = step;
        if (shouldBeVisible) {
            htmlStep.style.display = '';
            htmlStep.classList.remove('hidden-step');
            logVerbose(`Step made visible: ${stepAnswer}`);
        }
        else {
            htmlStep.style.display = 'none';
            htmlStep.classList.add('hidden-step');
            logVerbose(`Step hidden: ${stepAnswer}`);
        }
    });
}
/**
 * Determine if a step should be visible based on active conditions
 */
function shouldStepBeVisible(stepAnswer, activeConditions) {
    if (!stepAnswer)
        return true;
    // Check if this step matches any active condition
    for (const [target, value] of Object.entries(activeConditions)) {
        if (target === stepAnswer && value !== null && value !== undefined && value !== '') {
            return true;
        }
    }
    return false;
}
/**
 * Clear fields from inactive branches
 */
function clearInactiveBranchFields() {
    const allSteps = queryAllByAttr(SELECTORS.STEP);
    const fieldsToKeep = [];
    const fieldsToClear = [];
    allSteps.forEach(step => {
        const stepAnswer = getAttrValue(step, 'data-answer');
        const isVisible = stepAnswer ? FormState.isStepVisible(stepAnswer) : true;
        // Get all form inputs in this step
        const inputs = step.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            const fieldName = input.name ||
                getAttrValue(input, 'data-step-field-name');
            if (fieldName) {
                if (isVisible) {
                    fieldsToKeep.push(fieldName);
                }
                else {
                    fieldsToClear.push(fieldName);
                }
            }
        });
    });
    // Clear fields that are not in visible steps
    const uniqueFieldsToClear = fieldsToClear.filter(field => !fieldsToKeep.includes(field));
    if (uniqueFieldsToClear.length > 0) {
        FormState.clearFields(uniqueFieldsToClear);
    }
}
/**
 * Clear fields from a specific branch
 */
function clearBranchFields(branchTarget) {
    const branchStep = queryByAttr(`[data-answer="${branchTarget}"]`);
    if (!branchStep)
        return;
    const inputs = branchStep.querySelectorAll('input, select, textarea');
    const fieldsToClear = [];
    inputs.forEach(input => {
        const fieldName = input.name ||
            getAttrValue(input, 'data-step-field-name');
        if (fieldName) {
            fieldsToClear.push(fieldName);
        }
    });
    if (fieldsToClear.length > 0) {
        FormState.clearFields(fieldsToClear);
        logVerbose(`Cleared fields from branch ${branchTarget}`, fieldsToClear);
    }
}
/**
 * Evaluate complex branching conditions (for future enhancement)
 */
function evaluateConditions(conditions, logic = 'and') {
    if (conditions.length === 0)
        return true;
    const results = conditions.map(condition => {
        const fieldValue = FormState.getField(condition.field);
        switch (condition.operator) {
            case 'equals':
                return fieldValue === condition.value;
            case 'not_equals':
                return fieldValue !== condition.value;
            case 'contains':
                return String(fieldValue).includes(String(condition.value));
            case 'greater_than':
                return Number(fieldValue) > Number(condition.value);
            case 'less_than':
                return Number(fieldValue) < Number(condition.value);
            default:
                return false;
        }
    });
    return logic === 'and' ? results.every(r => r) : results.some(r => r);
}
/**
 * Reset branching state and cleanup
 */
function resetBranching() {
    logVerbose('Resetting branching logic');
    // Clean up event listeners
    branchingCleanupFunctions.forEach(cleanup => cleanup());
    branchingCleanupFunctions = [];
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
    branchingInitialized = false;
    logVerbose('Branching reset complete');
}
/**
 * Get current branching state for debugging
 */
function getBranchingState() {
    return {
        branchingInitialized,
        activeConditions: FormState.getBranchPath().activeConditions,
        visibleSteps: Object.entries(FormState.getAllSteps())
            .filter(([_, info]) => info.visible)
            .map(([stepId, _]) => stepId)
    };
}
/**
 * Debug function to test radio button detection (can be called from console)
 */
function debugRadioButtons() {
    console.log('=== DEBUG: Radio Button Detection ===');
    // Find all radio buttons with data-go-to
    const radioButtons = document.querySelectorAll('input[type="radio"][data-go-to]');
    console.log(`Found ${radioButtons.length} radio buttons with data-go-to:`);
    radioButtons.forEach((radio, index) => {
        const htmlRadio = radio;
        const goTo = getAttrValue(radio, 'data-go-to');
        const parentLabel = radio.closest('label');
        console.log(`Radio ${index}:`, {
            element: radio,
            name: htmlRadio.name,
            value: htmlRadio.value,
            goTo: goTo,
            checked: htmlRadio.checked,
            parentLabel: parentLabel,
            parentLabelClasses: parentLabel?.className,
            style: htmlRadio.style.cssText,
            allAttributes: Array.from(radio.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ')
        });
    });
    // Find all labels that might contain radio buttons
    const radioLabels = document.querySelectorAll('label.radio_field, label.w-radio');
    console.log(`Found ${radioLabels.length} radio labels:`);
    radioLabels.forEach((label, index) => {
        const radioInside = label.querySelector('input[type="radio"]');
        const goTo = radioInside ? getAttrValue(radioInside, 'data-go-to') : null;
        console.log(`Label ${index}:`, {
            element: label,
            className: label.className,
            radioInside: radioInside,
            goTo: goTo,
            radioName: radioInside ? radioInside.name : null
        });
    });
    console.log('=== END DEBUG ===');
}
/**
 * Test function to manually trigger radio button selection (can be called from console)
 */
function testRadioClick(goToValue) {
    console.log(`=== TESTING: Manual radio click for ${goToValue} ===`);
    const radioButton = document.querySelector(`input[type="radio"][data-go-to="${goToValue}"]`);
    if (!radioButton) {
        console.error(`Radio button with data-go-to="${goToValue}" not found`);
        return;
    }
    console.log('Found radio button:', radioButton);
    // Manually trigger the selection
    radioButton.checked = true;
    applyRadioActiveClass(radioButton);
    // Create and dispatch events
    const changeEvent = new Event('change', { bubbles: true });
    const clickEvent = new Event('click', { bubbles: true });
    console.log('Dispatching events...');
    radioButton.dispatchEvent(clickEvent);
    radioButton.dispatchEvent(changeEvent);
    // Manually trigger branching logic
    console.log('Manually triggering branch logic...');
    handleBranchTrigger(changeEvent, radioButton);
    console.log('=== END TEST ===');
}
// Make debug functions available globally for console access
window.debugRadioButtons = debugRadioButtons;
window.testRadioClick = testRadioClick;
/**
 * Debug function to log current branching state (can be called from console)
 */
function debugBranching() {
    const activeConditions = FormState.getBranchPath().activeConditions;
    logVerbose('=== DEBUG: Branching State ===');
    logVerbose('Active Conditions:', activeConditions);
    // Find all elements with data-go-to
    const branchTriggers = queryAllByAttr(SELECTORS.GO_TO);
    logVerbose('All Branch Triggers:');
    branchTriggers.forEach((trigger, index) => {
        const goTo = getAttrValue(trigger, 'data-go-to');
        const htmlTrigger = trigger;
        let value = '';
        let checked = false;
        let elementType = htmlTrigger.tagName;
        if (isFormInput(trigger)) {
            const inputValue = getInputValue(trigger);
            value = Array.isArray(inputValue) ? inputValue.join(', ') : inputValue;
            if (trigger instanceof HTMLInputElement) {
                checked = trigger.checked;
                elementType = trigger.type;
            }
        }
        logVerbose(`Trigger ${index}:`, {
            element: trigger,
            goTo: goTo,
            value: value,
            checked: checked,
            type: elementType
        });
    });
    // Find all steps with data-answer
    const answerSteps = queryAllByAttr(SELECTORS.ANSWER);
    logVerbose('All Answer Steps:');
    answerSteps.forEach((step, index) => {
        const answer = getAttrValue(step, 'data-answer');
        logVerbose(`Answer Step ${index}:`, {
            element: step,
            dataAnswer: answer,
            visible: step.style.display !== 'none'
        });
    });
    logVerbose('=== END DEBUG ===');
}
// Make debug function available globally
window.debugBranching = debugBranching;
  
  /**
 * Multi-step form navigation module
 */
let multiStepInitialized = false;
let multiStepCleanupFunctions = [];
let steps = [];
let stepItems = [];
let currentStepIndex = 0;
let currentStepItemId = null;
/**
 * Initialize multi-step functionality
 */
function initMultiStep(root = document) {
    if (multiStepInitialized) {
        logVerbose('MultiStep already multiStepInitialized, cleaning up first');
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
    multiStepInitialized = true;
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
function showStepItem(stepItemId) {
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
function hideStepItem(stepItemId) {
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
    multiStepCleanupFunctions.push(cleanup1, cleanup2, cleanup3, cleanup4);
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
function goToStepById(stepId) {
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
function goToStep(stepIndex) {
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
function showStep(stepIndex) {
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
function getCurrentStepInfo() {
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
    multiStepCleanupFunctions.forEach(cleanup => cleanup());
    multiStepCleanupFunctions = [];
    // Hide all steps
    steps.forEach((step, index) => {
        hideStep(index);
    });
    // Reset state
    steps = [];
    currentStepIndex = 0;
    multiStepInitialized = false;
    logVerbose('Multi-step reset complete');
}
/**
 * Get multi-step state for debugging
 */
function getMultiStepState() {
    return {
        multiStepInitialized,
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
  
  /**
 * Form validation module with branch awareness
 */
let validationInitialized = false;
let validationCleanupFunctions = [];
let fieldValidations = new Map();
/**
 * Initialize validation functionality
 */
function initValidation(root = document) {
    if (validationInitialized) {
        logVerbose('Validation already validationInitialized, cleaning up first');
        resetValidation();
    }
    logVerbose('Initializing form validation');
    // Find all form inputs
    const formInputs = queryAllByAttr('input, select, textarea', root);
    logVerbose(`Found ${formInputs.length} form inputs`);
    // Set up validation rules for each input
    setupFieldValidations(formInputs);
    // Set up event listeners
    setupValidationListeners(root);
    validationInitialized = true;
    logVerbose('Validation initialization complete');
}
/**
 * Set up validation rules for form inputs
 */
function setupFieldValidations(inputs) {
    inputs.forEach(input => {
        if (!isFormInput(input))
            return;
        const htmlInput = input;
        const fieldName = htmlInput.name || getAttrValue(input, 'data-step-field-name');
        if (!fieldName) {
            logVerbose('Skipping field validation setup - no field name', {
                element: input,
                name: htmlInput.name,
                dataStepFieldName: getAttrValue(input, 'data-step-field-name'),
                id: htmlInput.id,
                type: htmlInput.type
            });
            return;
        }
        const rules = extractValidationRules(input);
        if (rules.length === 0) {
            logVerbose(`No validation rules found for field: ${fieldName}`);
            return;
        }
        fieldValidations.set(fieldName, {
            element: input,
            rules,
            isValid: true
        });
        logVerbose(`Validation rules set for field: ${fieldName}`, {
            rules: rules.map(r => r.type),
            rulesCount: rules.length
        });
    });
}
/**
 * Extract validation rules from input element
 */
function extractValidationRules(input) {
    const rules = [];
    // Required validation
    if (input.hasAttribute('required')) {
        rules.push({
            type: 'required',
            message: getAttrValue(input, 'data-error-message') || 'This field is required'
        });
    }
    // Email validation
    if (input instanceof HTMLInputElement && input.type === 'email') {
        rules.push({
            type: 'email',
            message: 'Please enter a valid email address'
        });
    }
    // Phone validation
    if (input instanceof HTMLInputElement && input.type === 'tel') {
        rules.push({
            type: 'phone',
            message: 'Please enter a valid phone number'
        });
    }
    // Min length validation
    const minLength = getAttrValue(input, 'minlength');
    if (minLength) {
        rules.push({
            type: 'min',
            value: parseInt(minLength),
            message: `Minimum ${minLength} characters required`
        });
    }
    // Max length validation
    const maxLength = getAttrValue(input, 'maxlength');
    if (maxLength) {
        rules.push({
            type: 'max',
            value: parseInt(maxLength),
            message: `Maximum ${maxLength} characters allowed`
        });
    }
    // Pattern validation
    const pattern = getAttrValue(input, 'pattern');
    if (pattern) {
        rules.push({
            type: 'pattern',
            value: new RegExp(pattern),
            message: 'Please enter a valid format'
        });
    }
    return rules;
}
/**
 * Set up validation event listeners
 */
function setupValidationListeners(root) {
    // Real-time validation on input (debounced)
    const debouncedValidation = debounce(handleFieldValidation, DEFAULTS.VALIDATION_DELAY);
    const cleanup1 = delegateEvent(root, 'input', 'input, select, textarea', debouncedValidation);
    // Validation on blur
    const cleanup2 = delegateEvent(root, 'blur', 'input, select, textarea', handleFieldValidation);
    // Validation on change
    const cleanup3 = delegateEvent(root, 'change', 'input, select, textarea', handleFieldValidation);
    validationCleanupFunctions.push(cleanup1, cleanup2, cleanup3);
}
/**
 * Handle field validation events
 */
function handleFieldValidation(event, target) {
    if (!isFormInput(target))
        return;
    const htmlTarget = target;
    const fieldName = htmlTarget.name || getAttrValue(target, 'data-step-field-name');
    if (!fieldName) {
        logVerbose('Skipping validation - no field name found', {
            element: target,
            name: htmlTarget.name,
            dataStepFieldName: getAttrValue(target, 'data-step-field-name')
        });
        return;
    }
    // Check if field is in visible step
    const stepElement = target.closest(SELECTORS.STEP);
    if (stepElement) {
        const stepId = getAttrValue(stepElement, 'data-answer');
        if (stepId && !FormState.isStepVisible(stepId)) {
            logVerbose(`Skipping validation for field in hidden step: ${fieldName}`);
            return;
        }
    }
    validateField(fieldName);
}
/**
 * Validate a specific field
 */
function validateField(fieldName) {
    const fieldValidation = fieldValidations.get(fieldName);
    if (!fieldValidation) {
        logVerbose(`No validation rules found for field: ${fieldName}`);
        return true;
    }
    const input = fieldValidation.element;
    if (!input) {
        logVerbose(`No element found for field: ${fieldName}`);
        return true;
    }
    const value = getInputValue(input);
    logVerbose(`Validating field: ${fieldName}`, { value, elementExists: !!input });
    // Run all validation rules
    let isValid = true;
    let errorMessage = '';
    for (const rule of fieldValidation.rules) {
        const ruleResult = validateRule(value, rule);
        if (!ruleResult.isValid) {
            isValid = false;
            errorMessage = ruleResult.message || 'Validation failed';
            break; // Stop at first failed rule
        }
    }
    // Update field validation state
    fieldValidation.isValid = isValid;
    fieldValidation.errorMessage = errorMessage;
    // Update visual state - only if element exists and has parent
    try {
        updateFieldVisualState(input, isValid, errorMessage);
    }
    catch (error) {
        logVerbose(`Error updating visual state for field: ${fieldName}`, error);
    }
    // Update FormState
    FormState.setField(fieldName, value);
    logVerbose(`Field validation result: ${fieldName}`, {
        isValid,
        errorMessage,
        value
    });
    return isValid;
}
/**
 * Validate a single rule
 */
function validateRule(value, rule) {
    switch (rule.type) {
        case 'required':
            const isEmpty = value === '' || value === null || value === undefined ||
                (Array.isArray(value) && value.length === 0);
            return {
                isValid: !isEmpty,
                message: rule.message
            };
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return {
                isValid: !value || emailRegex.test(String(value)),
                message: rule.message
            };
        case 'phone':
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            return {
                isValid: !value || phoneRegex.test(String(value).replace(/\D/g, '')),
                message: rule.message
            };
        case 'min':
            return {
                isValid: !value || String(value).length >= rule.value,
                message: rule.message
            };
        case 'max':
            return {
                isValid: !value || String(value).length <= rule.value,
                message: rule.message
            };
        case 'pattern':
            return {
                isValid: !value || rule.value.test(String(value)),
                message: rule.message
            };
        case 'custom':
            return {
                isValid: !rule.validator || rule.validator(value),
                message: rule.message
            };
        default:
            return { isValid: true };
    }
}
/**
 * Update field visual state based on validation
 */
function updateFieldVisualState(input, isValid, errorMessage) {
    // Update field styling
    if (isValid) {
        removeClass(input, CSS_CLASSES.ERROR_FIELD);
    }
    else {
        addClass(input, CSS_CLASSES.ERROR_FIELD);
    }
    // Update error message display
    const errorElement = findOrCreateErrorElement(input);
    if (errorElement) {
        if (isValid) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
        else {
            errorElement.textContent = errorMessage || 'Validation failed';
            errorElement.style.display = 'block';
        }
    }
}
/**
 * Find or create error message element
 */
function findOrCreateErrorElement(input) {
    // Defensive checks
    if (!input) {
        logVerbose('Cannot create error element - no input element provided');
        return null;
    }
    const fieldName = input.name || getAttrValue(input, 'data-step-field-name');
    if (!fieldName) {
        logVerbose('Cannot create error element - no field name found', {
            element: input,
            name: input.name,
            dataStepFieldName: getAttrValue(input, 'data-step-field-name')
        });
        return null;
    }
    // Check if input has a parent element
    if (!input.parentElement) {
        logVerbose(`Cannot create error element for field: ${fieldName} - no parent element`, {
            element: input,
            parentElement: input.parentElement,
            nodeName: input.nodeName,
            id: input.id
        });
        return null;
    }
    // Look for existing error element
    let errorElement = null;
    try {
        errorElement = input.parentElement.querySelector(`.${CSS_CLASSES.ERROR_MESSAGE}[data-field="${fieldName}"]`);
    }
    catch (error) {
        logVerbose(`Error finding existing error element for field: ${fieldName}`, error);
        return null;
    }
    if (!errorElement) {
        try {
            // Create new error element
            errorElement = document.createElement('div');
            errorElement.className = CSS_CLASSES.ERROR_MESSAGE;
            errorElement.setAttribute('data-field', fieldName);
            errorElement.style.color = 'red';
            errorElement.style.fontSize = '0.875em';
            errorElement.style.marginTop = '0.25rem';
            errorElement.style.display = 'none';
            // Insert after the input
            const nextSibling = input.nextSibling;
            if (nextSibling) {
                input.parentElement.insertBefore(errorElement, nextSibling);
            }
            else {
                input.parentElement.appendChild(errorElement);
            }
            logVerbose(`Created error element for field: ${fieldName}`);
        }
        catch (error) {
            logVerbose(`Error creating error element for field: ${fieldName}`, error);
            return null;
        }
    }
    return errorElement;
}
/**
 * Validate a specific step
 */
function validateStep(stepId) {
    const stepElement = queryByAttr(`[data-answer="${stepId}"]`);
    if (!stepElement) {
        logVerbose(`Step not found with data-answer="${stepId}"`);
        return true;
    }
    // Check if step is visible
    if (!FormState.isStepVisible(stepId)) {
        logVerbose(`Skipping validation for hidden step: ${stepId}`);
        return true;
    }
    logVerbose(`Validating step: ${stepId}`);
    const inputs = stepElement.querySelectorAll('input, select, textarea');
    let isStepValid = true;
    inputs.forEach(input => {
        if (!isFormInput(input))
            return;
        const fieldName = input.name || getAttrValue(input, 'data-step-field-name');
        if (fieldName) {
            const isFieldValid = validateField(fieldName);
            if (!isFieldValid) {
                isStepValid = false;
            }
        }
    });
    logVerbose(`Step validation result: ${stepId}`, { isValid: isStepValid });
    return isStepValid;
}
/**
 * Validate all visible fields
 */
function validateAllVisibleFields() {
    logVerbose('Validating all visible fields');
    let allValid = true;
    const validationResults = {};
    for (const [fieldName, fieldValidation] of fieldValidations) {
        // Check if field is in visible step
        const stepElement = fieldValidation.element.closest(SELECTORS.STEP);
        let shouldValidate = true;
        if (stepElement) {
            const stepId = getAttrValue(stepElement, 'data-answer');
            if (stepId && !FormState.isStepVisible(stepId)) {
                shouldValidate = false;
            }
        }
        if (shouldValidate) {
            const isValid = validateField(fieldName);
            validationResults[fieldName] = isValid;
            if (!isValid) {
                allValid = false;
            }
        }
    }
    logVerbose('All visible fields validation complete', {
        allValid,
        results: validationResults
    });
    return allValid;
}
/**
 * Clear validation errors for a field
 */
function clearFieldValidation(fieldName) {
    const fieldValidation = fieldValidations.get(fieldName);
    if (!fieldValidation)
        return;
    fieldValidation.isValid = true;
    fieldValidation.errorMessage = undefined;
    updateFieldVisualState(fieldValidation.element, true);
    logVerbose(`Cleared validation for field: ${fieldName}`);
}
/**
 * Clear validation errors for all fields
 */
function clearAllValidation() {
    logVerbose('Clearing all field validation');
    fieldValidations.forEach((validation, fieldName) => {
        clearFieldValidation(fieldName);
    });
}
/**
 * Add custom validation rule to a field
 */
function addCustomValidation(fieldName, validator, message) {
    const fieldValidation = fieldValidations.get(fieldName);
    if (!fieldValidation) {
        logVerbose(`Cannot add custom validation to unknown field: ${fieldName}`);
        return;
    }
    fieldValidation.rules.push({
        type: 'custom',
        validator,
        message
    });
    logVerbose(`Added custom validation to field: ${fieldName}`, { message });
}
/**
 * Get validation state for debugging
 */
function getValidationState() {
    const state = {
        validationInitialized,
        totalFields: fieldValidations.size,
        validFields: 0,
        invalidFields: 0,
        fields: {}
    };
    fieldValidations.forEach((validation, fieldName) => {
        state.fields[fieldName] = {
            isValid: validation.isValid,
            errorMessage: validation.errorMessage,
            rulesCount: validation.rules.length
        };
        if (validation.isValid) {
            state.validFields++;
        }
        else {
            state.invalidFields++;
        }
    });
    return state;
}
/**
 * Reset validation state and cleanup
 */
function resetValidation() {
    logVerbose('Resetting validation');
    // Clean up event listeners
    validationCleanupFunctions.forEach(cleanup => cleanup());
    validationCleanupFunctions = [];
    // Clear all validation states
    clearAllValidation();
    // Reset field validations
    fieldValidations.clear();
    validationInitialized = false;
    logVerbose('Validation reset complete');
}
  
  /**
 * Error handling and display module
 */
let errorConfigs = new Map();
/**
 * Initialize error handling
 */
function initErrors(root = document) {
    logVerbose('Initializing error handling');
    // Find all form inputs and set up error configurations
    const inputs = root.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const fieldName = input.name ||
            getAttrValue(input, 'data-step-field-name');
        if (fieldName) {
            errorConfigs.set(fieldName, {
                fieldName,
                element: input,
                customMessage: getAttrValue(input, 'data-error-message') || undefined
            });
        }
    });
    logVerbose(`Error handling errorsInitialized for ${errorConfigs.size} fields`);
}
/**
 * Show error for a specific field
 */
function showError(fieldName, message) {
    const config = errorConfigs.get(fieldName);
    if (!config) {
        logVerbose(`Cannot show error for unknown field: ${fieldName}`);
        return;
    }
    const errorMessage = message || config.customMessage || 'This field has an error';
    logVerbose(`Showing error for field: ${fieldName}`, { message: errorMessage });
    // Add error styling to the field
    addClass(config.element, CSS_CLASSES.ERROR_FIELD);
    // Create or update error message element
    const errorElement = findOrCreateErrorElement(config);
    if (errorElement) {
        errorElement.textContent = errorMessage;
        errorElement.style.display = 'block';
        config.errorElement = errorElement;
    }
    // Scroll to field if it's not visible
    scrollToFieldIfNeeded(config.element);
}
/**
 * Clear error for a specific field
 */
function clearError(fieldName) {
    const config = errorConfigs.get(fieldName);
    if (!config) {
        logVerbose(`Cannot clear error for unknown field: ${fieldName}`);
        return;
    }
    logVerbose(`Clearing error for field: ${fieldName}`);
    // Remove error styling from the field
    removeClass(config.element, CSS_CLASSES.ERROR_FIELD);
    // Hide error message element
    if (config.errorElement) {
        config.errorElement.textContent = '';
        config.errorElement.style.display = 'none';
    }
}
/**
 * Clear all errors
 */
function clearAllErrors() {
    logVerbose('Clearing all field errors');
    errorConfigs.forEach((config, fieldName) => {
        clearError(fieldName);
    });
}
/**
 * Show multiple errors at once
 */
function showErrors(errors) {
    logVerbose('Showing multiple errors', errors);
    Object.entries(errors).forEach(([fieldName, message]) => {
        showError(fieldName, message);
    });
}
/**
 * Check if a field has an error
 */
function hasError(fieldName) {
    const config = errorConfigs.get(fieldName);
    if (!config)
        return false;
    return config.element.classList.contains(CSS_CLASSES.ERROR_FIELD);
}
/**
 * Get all fields with errors
 */
function getFieldsWithErrors() {
    const fieldsWithErrors = [];
    errorConfigs.forEach((config, fieldName) => {
        if (hasError(fieldName)) {
            fieldsWithErrors.push(fieldName);
        }
    });
    return fieldsWithErrors;
}
/**
 * Set custom error message for a field
 */
function setCustomErrorMessage(fieldName, message) {
    const config = errorConfigs.get(fieldName);
    if (!config) {
        logVerbose(`Cannot set custom error message for unknown field: ${fieldName}`);
        return;
    }
    config.customMessage = message;
    logVerbose(`Custom error message set for field: ${fieldName}`, { message });
}
/**
 * Find or create error message element for a field
 */
function findOrCreateErrorElement(config) {
    // Defensive checks
    if (!config || !config.element) {
        logVerbose('Cannot create error element - no config or element provided');
        return null;
    }
    // Check if element has a parent element
    if (!config.element.parentElement) {
        logVerbose(`Cannot create error element for field: ${config.fieldName} - no parent element`, {
            element: config.element,
            parentElement: config.element.parentElement,
            nodeName: config.element.nodeName,
            id: config.element.id
        });
        return null;
    }
    // Look for existing error element
    let errorElement = null;
    try {
        errorElement = config.element.parentElement.querySelector(`.${CSS_CLASSES.ERROR_MESSAGE}[data-field="${config.fieldName}"]`);
    }
    catch (error) {
        logVerbose(`Error finding existing error element for field: ${config.fieldName}`, error);
        return null;
    }
    if (!errorElement) {
        try {
            // Create new error element
            errorElement = document.createElement('div');
            errorElement.className = CSS_CLASSES.ERROR_MESSAGE;
            errorElement.setAttribute('data-field', config.fieldName);
            errorElement.style.color = 'red';
            errorElement.style.fontSize = '0.875em';
            errorElement.style.marginTop = '0.25rem';
            errorElement.style.display = 'none';
            // Insert after the input
            const parent = config.element.parentElement;
            const nextSibling = config.element.nextSibling;
            if (nextSibling) {
                parent.insertBefore(errorElement, nextSibling);
            }
            else {
                parent.appendChild(errorElement);
            }
            logVerbose(`Created error element for field: ${config.fieldName}`);
        }
        catch (error) {
            logVerbose(`Error creating error element for field: ${config.fieldName}`, error);
            return null;
        }
    }
    return errorElement;
}
/**
 * Scroll to field if it's not in viewport
 */
function scrollToFieldIfNeeded(element) {
    const rect = element.getBoundingClientRect();
    const isVisible = rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    if (!isVisible) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        logVerbose(`Scrolled to field with error: ${element.name || 'unnamed'}`);
    }
}
/**
 * Highlight field with error (alternative to standard error styling)
 */
function highlightFieldError(fieldName, highlightClass = 'field-highlight') {
    const config = errorConfigs.get(fieldName);
    if (!config)
        return;
    addClass(config.element, highlightClass);
    // Remove highlight after a delay
    setTimeout(() => {
        removeClass(config.element, highlightClass);
    }, 3000);
    logVerbose(`Highlighted field with error: ${fieldName}`);
}
/**
 * Focus on first field with error
 */
function focusFirstError() {
    const fieldsWithErrors = getFieldsWithErrors();
    if (fieldsWithErrors.length > 0) {
        const firstErrorField = fieldsWithErrors[0];
        const config = errorConfigs.get(firstErrorField);
        if (config && config.element instanceof HTMLInputElement) {
            config.element.focus();
            logVerbose(`Focused on first error field: ${firstErrorField}`);
        }
    }
}
/**
 * Get error statistics
 */
function getErrorStats() {
    const fieldsWithErrors = getFieldsWithErrors();
    return {
        totalFields: errorConfigs.size,
        fieldsWithErrors: fieldsWithErrors.length,
        fieldsWithoutErrors: errorConfigs.size - fieldsWithErrors.length,
        errorFields: fieldsWithErrors
    };
}
/**
 * Reset error handling
 */
function resetErrors() {
    logVerbose('Resetting error handling');
    // Clear all errors
    clearAllErrors();
    // Clear configurations
    errorConfigs.clear();
    logVerbose('Error handling reset complete');
}
/**
 * Get error state for debugging
 */
function getErrorState() {
    const fieldsWithErrors = getFieldsWithErrors();
    const state = {
        totalFields: errorConfigs.size,
        fieldsWithErrors: fieldsWithErrors.length,
        errors: {}
    };
    fieldsWithErrors.forEach(fieldName => {
        const config = errorConfigs.get(fieldName);
        state.errors[fieldName] = {
            message: config?.errorElement?.textContent || 'Unknown error',
            customMessage: config?.customMessage
        };
    });
    return state;
}
  
  /**
 * Summary module for collecting and displaying form field values
 */
let summaryInitialized = false;
let summaryCleanupFunctions = [];
let summaryFields = [];
/**
 * Initialize summary functionality
 */
function initSummary(root = document) {
    if (summaryInitialized) {
        logVerbose('Summary already summaryInitialized, cleaning up first');
        resetSummary();
    }
    logVerbose('Initializing summary functionality');
    // Find all summary display elements
    const summaryElements = queryAllByAttr(SELECTORS.SUMMARY_FIELD, root);
    logVerbose(`Found ${summaryElements.length} summary fields`);
    // Set up summary field configurations
    setupSummaryFields(summaryElements);
    // Set up event listeners for field changes
    setupSummaryListeners(root);
    // Initial summary update
    updateAllSummaries();
    summaryInitialized = true;
    logVerbose('Summary initialization complete');
}
/**
 * Set up summary field configurations
 */
function setupSummaryFields(summaryElements) {
    summaryElements.forEach(element => {
        const summaryFieldAttr = getAttrValue(element, 'data-summary-field');
        if (!summaryFieldAttr)
            return;
        // Parse field names (pipe-separated)
        const fieldNames = summaryFieldAttr.split('|').map(name => name.trim());
        // Get join type
        const joinAttr = getAttrValue(element, 'data-join');
        const joinType = joinAttr && joinAttr in DEFAULTS.JOIN_SEPARATOR ? joinAttr : 'space';
        // Get categorization attributes
        const type = getAttrValue(element, 'data-summary-type') || undefined;
        const subtype = getAttrValue(element, 'data-summary-subtype') || undefined;
        const number = getAttrValue(element, 'data-summary-number') || undefined;
        const summaryField = {
            element: element,
            fieldNames,
            joinType,
            type,
            subtype,
            number
        };
        summaryFields.push(summaryField);
        logVerbose('Summary field configured', {
            fieldNames,
            joinType,
            type,
            subtype,
            number
        });
    });
}
/**
 * Set up event listeners for field changes
 */
function setupSummaryListeners(root) {
    // Listen for input changes on fields with data-step-field-name
    const cleanup1 = delegateEvent(root, 'input', SELECTORS.STEP_FIELD_NAME, handleFieldChange);
    // Listen for change events
    const cleanup2 = delegateEvent(root, 'change', SELECTORS.STEP_FIELD_NAME, handleFieldChange);
    // Listen for blur events
    const cleanup3 = delegateEvent(root, 'blur', SELECTORS.STEP_FIELD_NAME, handleFieldChange);
    summaryCleanupFunctions.push(cleanup1, cleanup2, cleanup3);
}
/**
 * Handle field change events
 */
function handleFieldChange(event, target) {
    if (!isFormInput(target))
        return;
    const fieldName = getAttrValue(target, 'data-step-field-name');
    if (!fieldName)
        return;
    const value = getInputValue(target);
    logVerbose(`Summary field changed: ${fieldName}`, { value });
    // Update FormState
    FormState.setField(fieldName, value);
    // Update summaries that include this field
    updateSummariesForField(fieldName);
}
/**
 * Update summaries that include a specific field
 */
function updateSummariesForField(fieldName) {
    summaryFields.forEach(summaryField => {
        if (summaryField.fieldNames.includes(fieldName)) {
            updateSummaryField(summaryField);
        }
    });
}
/**
 * Update all summary fields
 */
function updateSummary() {
    logVerbose('Updating all summaries');
    updateAllSummaries();
}
/**
 * Update all summary fields (internal)
 */
function updateAllSummaries() {
    summaryFields.forEach(summaryField => {
        updateSummaryField(summaryField);
    });
}
/**
 * Update a specific summary field
 */
function updateSummaryField(summaryField) {
    const values = [];
    // Collect values for all field names
    summaryField.fieldNames.forEach(fieldName => {
        const value = FormState.getField(fieldName);
        if (value !== null && value !== undefined && value !== '') {
            // Handle different value types
            if (Array.isArray(value)) {
                values.push(...value.filter(v => v !== ''));
            }
            else {
                values.push(String(value));
            }
        }
    });
    // Join values according to join type
    const joinedValue = joinValues(values, summaryField.joinType);
    // Update the summary element
    updateSummaryElement(summaryField.element, joinedValue);
    logVerbose(`Summary field updated`, {
        fieldNames: summaryField.fieldNames,
        values,
        joinType: summaryField.joinType,
        result: joinedValue
    });
}
/**
 * Join values according to join type
 */
function joinValues(values, joinType) {
    if (values.length === 0)
        return '';
    const separator = DEFAULTS.JOIN_SEPARATOR[joinType];
    return values.join(separator);
}
/**
 * Update summary element content
 */
function updateSummaryElement(element, value) {
    // Update text content
    element.textContent = value;
    // Add/remove empty class for styling
    if (value === '') {
        element.classList.add('summary-empty');
        element.classList.remove('summary-filled');
    }
    else {
        element.classList.remove('summary-empty');
        element.classList.add('summary-filled');
    }
}
/**
 * Get summary by type/subtype/number
 */
function getSummaryByCategory(type, subtype, number) {
    const matchingSummaries = [];
    summaryFields.forEach(summaryField => {
        const matches = ((!type || summaryField.type === type) &&
            (!subtype || summaryField.subtype === subtype) &&
            (!number || summaryField.number === number));
        if (matches) {
            const currentValue = summaryField.element.textContent || '';
            if (currentValue) {
                matchingSummaries.push(currentValue);
            }
        }
    });
    logVerbose('Retrieved summaries by category', {
        type,
        subtype,
        number,
        results: matchingSummaries
    });
    return matchingSummaries;
}
/**
 * Clear summary for specific fields
 */
function clearSummary(fieldNames) {
    if (fieldNames) {
        logVerbose('Clearing specific summary fields', fieldNames);
        // Clear specific fields from FormState
        FormState.clearFields(fieldNames);
        // Update affected summaries
        fieldNames.forEach(fieldName => {
            updateSummariesForField(fieldName);
        });
    }
    else {
        logVerbose('Clearing all summaries');
        // Clear all field values from FormState
        FormState.clear();
        // Update all summaries
        updateAllSummaries();
    }
}
/**
 * Get all current summary values
 */
function getAllSummaryValues() {
    const summaryValues = {};
    summaryFields.forEach((summaryField, index) => {
        const key = summaryField.type && summaryField.subtype && summaryField.number
            ? `${summaryField.type}-${summaryField.subtype}-${summaryField.number}`
            : `summary-${index}`;
        summaryValues[key] = {
            fieldNames: summaryField.fieldNames,
            value: summaryField.element.textContent || '',
            joinType: summaryField.joinType,
            type: summaryField.type,
            subtype: summaryField.subtype,
            number: summaryField.number
        };
    });
    return summaryValues;
}
/**
 * Force refresh all summaries from current FormState
 */
function refreshSummaries() {
    logVerbose('Refreshing all summaries from FormState');
    updateAllSummaries();
}
/**
 * Add custom summary field programmatically
 */
function addCustomSummary(element, fieldNames, joinType = 'space', type, subtype, number) {
    const summaryField = {
        element,
        fieldNames,
        joinType,
        type,
        subtype,
        number
    };
    summaryFields.push(summaryField);
    updateSummaryField(summaryField);
    logVerbose('Custom summary field added', {
        fieldNames,
        joinType,
        type,
        subtype,
        number
    });
}
/**
 * Get summary state for debugging
 */
function getSummaryState() {
    return {
        summaryInitialized,
        totalSummaryFields: summaryFields.length,
        summaryFields: summaryFields.map(field => ({
            fieldNames: field.fieldNames,
            joinType: field.joinType,
            type: field.type,
            subtype: field.subtype,
            number: field.number,
            currentValue: field.element.textContent || ''
        })),
        formStateData: FormState.getAll()
    };
}
/**
 * Reset summary functionality
 */
function resetSummary() {
    logVerbose('Resetting summary functionality');
    // Clean up event listeners
    summaryCleanupFunctions.forEach(cleanup => cleanup());
    summaryCleanupFunctions = [];
    // Clear all summary fields
    summaryFields.forEach(summaryField => {
        updateSummaryElement(summaryField.element, '');
    });
    // Reset summary fields array
    summaryFields = [];
    summaryInitialized = false;
    logVerbose('Summary reset complete');
}
  
  /**
 * Form Functionality Library - Main Entry Point
 *
 * A modular, flexible form functionality library for Webflow forms
 * supporting single-step, multi-step, and branching forms.
 */
// Import all modules
/**
 * Main FormLib class - singleton instance
 */
class FormLibrary {
    constructor() {
        this.initialized = false;
        this.rootElement = document;
        logVerbose('FormLibrary instance created');
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!FormLibrary.instance) {
            FormLibrary.instance = new FormLibrary();
        }
        return FormLibrary.instance;
    }
    /**
     * Initialize the form library
     */
    init(root = document) {
        if (this.initialized) {
            logVerbose('FormLibrary already initialized, reinitializing...');
            this.destroy();
        }
        this.rootElement = root;
        logVerbose('Initializing FormLibrary', {
            root: root === document ? 'document' : 'custom element'
        });
        // Check if we have any forms to work with
        const multistepForms = root.querySelectorAll(SELECTORS.MULTISTEP);
        const logicForms = root.querySelectorAll(SELECTORS.LOGIC);
        const stepElements = root.querySelectorAll(SELECTORS.STEP);
        logVerbose('Form detection results', {
            multistepForms: multistepForms.length,
            logicForms: logicForms.length,
            stepElements: stepElements.length
        });
        if (multistepForms.length === 0 && stepElements.length === 0) {
            logVerbose('No compatible forms found, library will not initialize');
            return;
        }
        // Initialize modules in dependency order
        try {
            // 1. Initialize error handling first (used by validation)
            initErrors(root);
            // 2. Initialize validation (used by multi-step navigation)
            initValidation(root);
            // 3. Initialize branching logic (used by multi-step navigation)
            if (logicForms.length > 0) {
                initBranching(root);
            }
            // 4. Initialize multi-step navigation (coordinates with branching)
            if (multistepForms.length > 0 || stepElements.length > 0) {
                initMultiStep(root);
            }
            // 5. Initialize summary functionality (listens to field changes)
            initSummary(root);
            this.initialized = true;
            logVerbose('FormLibrary initialization complete');
            // Log initial state
            this.logCurrentState();
        }
        catch (error) {
            logVerbose('FormLibrary initialization failed', error);
            throw error;
        }
    }
    /**
     * Destroy and cleanup the form library
     */
    destroy() {
        if (!this.initialized) {
            logVerbose('FormLibrary not initialized, nothing to destroy');
            return;
        }
        logVerbose('Destroying FormLibrary');
        // Reset all modules (they handle their own cleanup)
        try {
            resetBranching();
            // Note: Other modules will be reset when re-initialized
        }
        catch (error) {
            logVerbose('Error during FormLibrary destruction', error);
        }
        // Clear FormState
        FormState.clear();
        this.initialized = false;
        logVerbose('FormLibrary destruction complete');
    }
    /**
     * Check if library is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Get current form state for debugging
     */
    getState() {
        return {
            initialized: this.initialized,
            formState: FormState.getDebugInfo(),
            branching: getBranchingState(),
            multiStep: getMultiStepState(),
            validation: getValidationState(),
            errors: getErrorState(),
            summary: getSummaryState()
        };
    }
    /**
     * Log current state to console
     */
    logCurrentState() {
        const state = this.getState();
        logVerbose('Current FormLibrary State', state);
    }
    /**
     * Validate entire form
     */
    validateForm() {
        if (!this.initialized) {
            logVerbose('Cannot validate form - library not initialized');
            return false;
        }
        logVerbose('Validating entire form');
        const isValid = validateAllVisibleFields();
        logVerbose('Form validation result', { isValid });
        return isValid;
    }
    /**
     * Reset form to initial state
     */
    resetForm() {
        if (!this.initialized) {
            logVerbose('Cannot reset form - library not initialized');
            return;
        }
        logVerbose('Resetting form to initial state');
        // Clear all errors
        clearAllErrors();
        // Clear form state
        FormState.clear();
        // Clear summaries
        clearSummary();
        // Go to first step if multi-step
        try {
            goToStep(0);
        }
        catch (error) {
            logVerbose('Could not go to first step during reset', error);
        }
        logVerbose('Form reset complete');
    }
    /**
     * Get form data
     */
    getFormData() {
        return FormState.getAll();
    }
    /**
     * Set form data
     */
    setFormData(data) {
        Object.entries(data).forEach(([key, value]) => {
            FormState.setField(key, value);
        });
        // Update summaries after setting data
        updateSummary();
        logVerbose('Form data set', data);
    }
}
// Create and singleton instance
const FormLib = FormLibrary.getInstance();
// Export the main interface
FormLib;
// Export individual modules for advanced usage
// Auto-initialize on DOM ready if forms are detected
if (typeof window !== 'undefined') {
    const autoInit = () => {
        const multistepForms = document.querySelectorAll(SELECTORS.MULTISTEP);
        const stepElements = document.querySelectorAll(SELECTORS.STEP);
        if (multistepForms.length > 0 || stepElements.length > 0) {
            logVerbose('Auto-initializing FormLibrary on DOM ready');
            FormLib.init();
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    }
    else {
        // DOM is already ready
        autoInit();
    }
}
// Make FormLib available globally for testing
if (typeof window !== 'undefined') {
    window.FormLib = FormLib;
    logVerbose('FormLib attached to window for debugging');
}
  
  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.FormLibrary = FormLibrary;
    window.FormLib = FormLib;
  }
  
})(typeof window !== 'undefined' ? window : this);
