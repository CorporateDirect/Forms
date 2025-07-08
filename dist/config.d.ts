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
export declare const DATA_ATTRS: {
    readonly MULTISTEP: "data-form=\"multistep\"";
    readonly LOGIC: "data-logic";
    readonly STEP: "data-form=\"step\"";
    readonly ANSWER: "data-answer";
    readonly GO_TO: "data-go-to";
    readonly SKIP: "data-skip";
    readonly NEXT_BTN: "data-form=\"next-btn\"";
    readonly BACK_BTN: "data-form=\"back-btn\"";
    readonly SUBMIT: "data-form=\"submit\"";
    readonly SUBMIT_BTN: "data-form=\"submit-btn\"";
    readonly ERROR_DISPLAY: "data-form=\"error\"";
    readonly SKIP_IF: "data-skip-if";
    readonly SKIP_UNLESS: "data-skip-unless";
    readonly SKIP_SECTION: "data-skip-section";
    readonly ALLOW_SKIP_UNDO: "data-allow-skip-undo";
    readonly SKIP_REASON: "data-skip-reason";
    readonly STEP_TYPE: "data-step-type";
    readonly STEP_SUBTYPE: "data-step-subtype";
    readonly STEP_NUMBER: "data-step-number";
    readonly STEP_FIELD_NAME: "data-step-field-name";
    readonly SUMMARY_FIELD: "data-summary-field";
    readonly SUMMARY_TYPE: "data-summary-type";
    readonly SUMMARY_SUBTYPE: "data-summary-subtype";
    readonly SUMMARY_NUMBER: "data-summary-number";
    readonly JOIN: "data-join";
    readonly REQUIRED: "required";
    readonly ERROR_MESSAGE: "data-error-message";
};
export declare const SELECTORS: {
    readonly MULTISTEP: "[data-form=\"multistep\"]";
    readonly LOGIC: "[data-logic]";
    readonly STEP: "[data-form=\"step\"]";
    readonly ANSWER: "[data-answer]";
    readonly GO_TO: "[data-go-to]";
    readonly SKIP: "[data-skip]";
    readonly NEXT_BTN: "[data-form=\"next-btn\"]";
    readonly BACK_BTN: "[data-form=\"back-btn\"]";
    readonly SUBMIT: "[data-form=\"submit\"]";
    readonly SUBMIT_BTN: "[data-form=\"submit-btn\"]";
    readonly ERROR_DISPLAY: "[data-form=\"error\"]";
    readonly SKIP_IF: "[data-skip-if]";
    readonly SKIP_UNLESS: "[data-skip-unless]";
    readonly SKIP_SECTION: "[data-skip-section]";
    readonly ALLOW_SKIP_UNDO: "[data-allow-skip-undo]";
    readonly SKIP_REASON: "[data-skip-reason]";
    readonly SHOW_IF: "[data-show-if]";
    readonly STEP_TYPE: "[data-step-type]";
    readonly STEP_SUBTYPE: "[data-step-subtype]";
    readonly STEP_NUMBER: "[data-step-number]";
    readonly STEP_FIELD_NAME: "[data-step-field-name]";
    readonly SUMMARY_FIELD: "[data-summary-field]";
    readonly SUMMARY_TYPE: "[data-summary-type]";
    readonly SUMMARY_SUBTYPE: "[data-summary-subtype]";
    readonly SUMMARY_NUMBER: "[data-summary-number]";
    readonly JOIN: "[data-join]";
    readonly REQUIRED: "[required]";
    readonly ERROR_MESSAGE: "[data-error-message]";
    readonly VALIDATE: "[data-validate]";
    readonly ALL_INPUTS: "input, select, textarea";
};
export declare const DEFAULTS: {
    readonly START_STEP: 1;
    readonly DEBUG: true;
    readonly LOG_PREFIX: "[FormLib]";
    readonly VALIDATION_DELAY: 300;
    readonly ANIMATION_DURATION: 300;
    readonly JOIN_SEPARATOR: {
        readonly space: " ";
        readonly comma: ", ";
        readonly dash: " - ";
        readonly pipe: " | ";
        readonly newline: "\n";
    };
};
export declare const CSS_CLASSES: {
    readonly ACTIVE_STEP: "active-step";
    readonly HIDDEN_STEP: "hidden-step";
    readonly HIDDEN_STEP_ITEM: "hidden-step-item";
    readonly ERROR_FIELD: "error-field";
    readonly ACTIVE_ERROR: "active-error";
    readonly DISABLED: "disabled";
    readonly SKIPPED_STEP: "skipped-step";
    readonly SKIP_AVAILABLE: "skip-available";
    readonly SKIP_DISABLED: "skip-disabled";
};
export type JoinType = keyof typeof DEFAULTS.JOIN_SEPARATOR;
//# sourceMappingURL=config.d.ts.map