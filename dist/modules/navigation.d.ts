/**
 * Universal Form Navigation & Radio Button Module
 * Ensures data-go-to ↔ data-answer navigation pattern works across any form
 */
interface NavigationElement {
    type: 'source' | 'target';
    element: HTMLElement;
    elementType: string;
    classes: string;
    radioInfo?: {
        name: string;
        value: string;
    };
}
interface NavigationIssue {
    type: 'MISSING_TARGET' | 'ORPHANED_ANSWER';
    target: string;
    message: string;
}
interface NavigationValidationResult {
    valid: boolean;
    issues: NavigationIssue[];
    navigationMap: Record<string, NavigationElement[]>;
    stats: {
        totalGoToElements: number;
        totalAnswerElements: number;
        uniqueGoToTargets: number;
        uniqueAnswerTargets: number;
    };
}
/**
 * Validate the navigation pattern across the entire form
 */
export declare function validateNavigationPattern(root?: Document | Element): NavigationValidationResult;
/**
 * Initialize the navigation system
 */
export declare function initNavigation(root?: Document | Element): NavigationValidationResult;
/**
 * Reset the navigation system
 */
export declare function resetNavigation(): void;
/**
 * Get current navigation state
 */
export declare function getNavigationState(): any;
/**
 * Validate a specific navigation target exists
 */
export declare function validateNavigationTarget(target: string): boolean;
/**
 * Get all navigation issues
 */
export declare function getNavigationIssues(): NavigationIssue[];
export {};
//# sourceMappingURL=navigation.d.ts.map