/**
 * Branching logic module for handling conditional form navigation
 */
/**
 * Initialize branching functionality
 */
export declare function initBranching(root?: Document | Element): void;
/**
 * Get the next step based on branching logic
 */
export declare function getNextStep(currentStep?: string): string | null;
/**
 * Reset branching module state
 */
export declare function resetBranching(): void;
/**
 * Get current branching state for debugging
 */
export declare function getBranchingState(): Record<string, unknown>;
//# sourceMappingURL=branching.d.ts.map