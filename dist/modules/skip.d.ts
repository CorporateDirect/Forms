/**
 * Enhanced skip functionality module
 */
/**
 * Initialize enhanced skip functionality
 */
export declare function initSkip(root?: Document | Element): void;
/**
 * Skip a specific step
 */
export declare function skipStep(stepId: string, reason?: string, allowUndo?: boolean, targetStep?: string): boolean;
/**
 * Skip an entire section
 */
export declare function skipSection(sectionId: string, reason?: string): boolean;
/**
 * Undo skip for a specific step
 */
export declare function undoSkipStep(stepId: string): boolean;
/**
 * Check if conditional skip should be applied
 */
export declare function evaluateSkipConditions(): void;
/**
 * Check if a step can be skipped
 */
export declare function canSkipStep(stepId: string): boolean;
/**
 * Get skip statistics and state
 */
export declare function getSkipState(): Record<string, unknown>;
/**
 * Reset skip functionality
 */
export declare function resetSkip(): void;
//# sourceMappingURL=skip.d.ts.map