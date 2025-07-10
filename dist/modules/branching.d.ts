/**
 * Branching logic module for handling conditional form navigation
 */
/**
 * Initialize branching functionality
 */
export declare function initBranching(root?: Document | Element): void;
/**
 * Get next step based on current form state and branching logic
 * @param currentStepId - Current step ID
 * @returns Next step ID or null if no branching applies
 */
export declare function getNextStep(currentStepId: string): string | null;
/**
 * Reset branching module state
 */
export declare function resetBranching(): void;
/**
 * Get current branching state
 */
export declare function getBranchingState(): Record<string, unknown>;
//# sourceMappingURL=branching.d.ts.map