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
  ERROR_DISPLAY: 'data-form="error"',
  
  // Enhanced skip functionality
  SKIP_TO: 'data-skip-to',
  SKIP_IF: 'data-skip-if',
  SKIP_UNLESS: 'data-skip-unless',
  SKIP_SECTION: 'data-skip-section',
  ALLOW_SKIP_UNDO: 'data-allow-skip-undo',
  SKIP_REASON: 'data-skip-reason',
  
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
} as const;

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
  ERROR_DISPLAY: '[data-form="error"]',
  
  // Enhanced skip functionality
  SKIP_TO: '[data-skip-to]',
  SKIP_IF: '[data-skip-if]',
  SKIP_UNLESS: '[data-skip-unless]',
  SKIP_SECTION: '[data-skip-section]',
  ALLOW_SKIP_UNDO: '[data-allow-skip-undo]',
  SKIP_REASON: '[data-skip-reason]',
  
  // Branching logic
  GO_TO: '[data-go-to]',
  SHOW_IF: '[data-show-if]',
  SKIP_BTN: '[data-form="skip-btn"]',
  SUBMIT_BTN: '[data-form="submit-btn"]',
  
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
  VALIDATE: '[data-validate]'
} as const;

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
} as const;

export const CSS_CLASSES = {
  ACTIVE_STEP: 'active-step',
  HIDDEN_STEP: 'hidden-step',
  HIDDEN_STEP_ITEM: 'hidden-step-item',
  ERROR_FIELD: 'error-field',
  ACTIVE_ERROR: 'active-error',
  DISABLED: 'disabled',
  SKIPPED_STEP: 'skipped-step',
  SKIP_AVAILABLE: 'skip-available',
  SKIP_DISABLED: 'skip-disabled'
} as const;

export type JoinType = keyof typeof DEFAULTS.JOIN_SEPARATOR; 