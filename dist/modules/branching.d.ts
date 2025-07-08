/**
 * Branching logic module for handling conditional form navigation
 */
/**
 * Set step item functions from multiStep module
 */
export declare function setStepItemFunctions(showStepItemFunction: (stepItemId: string) => void, hideStepItemFunction: (stepItemId: string) => void): void;
/**
 * Initialize branching functionality
 */
export declare function initBranching(root?: Document | Element): void;
/**
 * Get the next step based on branching logic
 */
export declare function getNextStep(): string | null;
/**
 * Reset branching module state
 */
export declare function resetBranching(): void;
/**
 * Get current branching state for debugging
 */
export declare function getBranchingState(): Record<string, unknown>;
//# sourceMappingURL=branching.d.ts.map