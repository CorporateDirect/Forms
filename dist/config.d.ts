/**
 * Configuration constants and defaults for the form functionality library
 */
export declare const DATA_ATTRS: {
    readonly MULTISTEP: "data-form=\"multistep\"";
    readonly LOGIC: "data-logic";
    readonly STEP: "data-form=\"step\"";
    readonly ANSWER: "data-answer";
    readonly NEXT_BTN: "data-form=\"next-btn\"";
    readonly BACK_BTN: "data-form=\"back-btn\"";
    readonly SUBMIT: "data-form=\"submit\"";
    readonly SKIP: "data-skip";
    readonly ERROR_DISPLAY: "data-form=\"error\"";
    readonly SKIP_TO: "data-skip-to";
    readonly SKIP_IF: "data-skip-if";
    readonly SKIP_UNLESS: "data-skip-unless";
    readonly SKIP_SECTION: "data-skip-section";
    readonly ALLOW_SKIP_UNDO: "data-allow-skip-undo";
    readonly SKIP_REASON: "data-skip-reason";
    readonly GO_TO: "data-go-to";
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
    readonly NEXT_BTN: "[data-form=\"next-btn\"]";
    readonly BACK_BTN: "[data-form=\"back-btn\"]";
    readonly SUBMIT: "[data-form=\"submit\"]";
    readonly SKIP: "[data-skip]";
    readonly ERROR_DISPLAY: "[data-form=\"error\"]";
    readonly SKIP_TO: "[data-skip-to]";
    readonly SKIP_IF: "[data-skip-if]";
    readonly SKIP_UNLESS: "[data-skip-unless]";
    readonly SKIP_SECTION: "[data-skip-section]";
    readonly ALLOW_SKIP_UNDO: "[data-allow-skip-undo]";
    readonly SKIP_REASON: "[data-skip-reason]";
    readonly GO_TO: "[data-go-to]";
    readonly SHOW_IF: "[data-show-if]";
    readonly SKIP_BTN: "[data-form=\"skip-btn\"]";
    readonly SUBMIT_BTN: "[data-form=\"submit-btn\"]";
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