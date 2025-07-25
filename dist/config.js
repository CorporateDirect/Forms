/**
 * Configuration constants and defaults for the form functionality library
 *
 * NAVIGATION SYSTEM:
 * ==================
 * The navigation system uses a simple source → destination pattern:
 *
 * DESTINATIONS (targets):
 * - data-answer="step-id" → Identifies a step as a navigation target
 *
 * SOURCES (navigation triggers):
 * - data-go-to="step-id" → Navigate to step with data-answer="step-id"
 * - data-skip="step-id" → Skip to step with data-answer="step-id"
 *
 * EXAMPLES:
 * - <button data-go-to="step-5">Go to Step 5</button>
 *   → Navigates to: <div data-form="step" data-answer="step-5">
 *
 * - <button data-skip="step-10">Skip to Step 10</button>
 *   → Navigates to: <div data-form="step" data-answer="step-10">
 */
export const DATA_ATTRS = {
    // Form types
    MULTISTEP: 'data-form="multistep"',
    LOGIC: 'data-logic',
    // Step elements and navigation targets
    STEP: 'data-form="step"',
    ANSWER: 'data-answer', // Target identifier for steps (destination)
    // Navigation sources (these reference ANSWER values)
    GO_TO: 'data-go-to', // Points to data-answer value
    SKIP: 'data-skip', // Points to data-answer value
    // Standard navigation buttons
    NEXT_BTN: 'data-form="next-btn"',
    BACK_BTN: 'data-form="back-btn"',
    SUBMIT: 'data-form="submit"',
    ERROR_DISPLAY: 'data-form="error"',
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
export const SELECTORS = {
    // Form types
    MULTISTEP: '[data-form="multistep"]',
    LOGIC: '[data-logic]',
    // Step elements and navigation targets
    STEP: '[data-form="step"]',
    ANSWER: '[data-answer]', // Target identifier for steps (destination)
    // Navigation sources (these reference ANSWER values)
    GO_TO: '[data-go-to]', // Points to data-an1swer value
    SKIP: '[data-skip]', // Points to data-answer value
    // Standard navigation buttons
    NEXT_BTN: '[data-form="next-btn"]',
    BACK_BTN: '[data-form="back-btn"]',
    SUBMIT: '[data-form="submit"]',
    SUBMIT_BTN: '[data-form="submit-btn"]',
    ERROR_DISPLAY: '[data-form="error"]',
    // Conditional display
    SHOW_IF: '[data-show-if]',
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
    ERROR_MESSAGE: '[data-error-message]',
    VALIDATE: '[data-validate]',
    // Generic
    ALL_INPUTS: 'input, select, textarea',
    // New uniform form field selectors
    FORM_FIELD_WRAPPER: '.form-field_wrapper',
    FORM_FIELD_LABEL: '.form_field-label',
    FORM_INPUT: '.form_input',
    FORM_ERROR_MESSAGE: '.form_error-message'
};
export const DEFAULTS = {
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
export const CSS_CLASSES = {
    ACTIVE_STEP: 'active-step',
    HIDDEN_STEP: 'hidden-step',
    HIDDEN_STEP_ITEM: 'hidden-step-item',
    ERROR_FIELD: 'error-field',
    ACTIVE_ERROR: 'active-error',
    DISABLED: 'disabled',
    // New uniform form field classes
    FORM_FIELD_WRAPPER: 'form-field_wrapper',
    FORM_FIELD_LABEL: 'form_field-label',
    FORM_INPUT: 'form_input',
    FORM_ERROR_MESSAGE: 'form_error-message'
};
//# sourceMappingURL=config.js.map