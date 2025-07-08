/**
 * Branching logic module for handling conditional form navigation
 */
/**
 * Initialize branching functionality
 */
export declare function initBranching(root?: Document | Element): void;
/**
 * Get the next step based on branching logic
 * (This might still be useful for complex scenarios, but core navigation is event-based)
 */
export declare function getNextStep(): string | null;
/**
 * Reset branching module state
 */
export declare function resetBranching(): void;
/**
 * Get current branching state
 */
export declare function getBranchingState(): Record<string, unknown>;
//# sourceMappingURL=branching.d.ts.map