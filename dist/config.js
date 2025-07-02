/**
 * Configuration constants and defaults for the form functionality library
 */
export const DATA_ATTRS = {
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
export const SELECTORS = {
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
    ERROR_MESSAGE: 'error-message',
    DISABLED: 'disabled'
};
//# sourceMappingURL=config.js.map