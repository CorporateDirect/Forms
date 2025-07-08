/**
 * Multi-step form navigation module
 */
/**
 * Initialize multi-step functionality
 */
export declare function initMultiStep(root?: Document | Element): void;
/**
 * Show a specific step_item within its parent step
 */
export declare function showStepItem(stepItemId: string): void;
/**
 * Hide a specific step_item
 */
export declare function hideStepItem(stepItemId: string): void;
/**
 * Go to a step by ID (handles both regular steps and branching step_items)
 */
export declare function goToStepById(stepId: string): void;
/**
 * Go to a specific step by index
 */
export declare function goToStep(stepIndex: number): void;
/**
 * Show a step by its index
 */
export declare function showStep(stepIndex: number): void;
/**
 * Get current step information
 */
export declare function getCurrentStepInfo(): Record<string, unknown>;
/**
 * Get multi-step state for debugging
 */
export declare function getMultiStepState(): Record<string, unknown>;
//# sourceMappingURL=multiStep.d.ts.map