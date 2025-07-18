/**
 * Multi-step form navigation module - UPDATED FOR NEW SIMPLIFIED STRUCTURE
 */
/**
 * Initialize multi-step functionality - UPDATED FOR NEW STRUCTURE
 */
export declare function initMultiStep(root?: Document | Element): void;
/**
 * Get list of navigated step IDs for validation scoping
 */
export declare function getNavigatedSteps(): string[];
/**
 * Debug function to diagnose step visibility and registration issues
 */
export declare function debugStepSystem(): void;
/**
 * Go to step by ID - ENHANCED with better error handling and branch support
 */
export declare function goToStepById(stepId: string): void;
/**
 * Go to step by index - UPDATED for new structure and navigation tracking
 */
export declare function goToStep(stepIndex: number): void;
//# sourceMappingURL=multiStep.d.ts.map