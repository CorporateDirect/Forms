/**
 * Summary module for collecting and displaying form field values
 */
import { JoinType } from '../config.js';
/**
 * Initialize summary functionality
 */
export declare function initSummary(root?: Document | Element): void;
/**
 * Update all summary fields
 */
export declare function updateSummary(): void;
/**
 * Get summary by type/subtype/number
 */
export declare function getSummaryByCategory(type?: string, subtype?: string, number?: string): string[];
/**
 * Clear summary for specific fields
 */
export declare function clearSummary(fieldNames?: string[]): void;
/**
 * Get all current summary values
 */
export declare function getAllSummaryValues(): Record<string, any>;
/**
 * Force refresh all summaries from current FormState
 */
export declare function refreshSummaries(): void;
/**
 * Add custom summary field programmatically
 */
export declare function addCustomSummary(element: HTMLElement, fieldNames: string[], joinType?: JoinType, type?: string, subtype?: string, number?: string): void;
/**
 * Get current summary state for debugging
 */
export declare function getSummaryState(): Record<string, unknown>;
//# sourceMappingURL=summary.d.ts.map