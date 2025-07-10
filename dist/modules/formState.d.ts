/**
 * Simple FormState singleton for managing form data in memory
 * Per instructions: Only handles form data with 4 required methods
 */
export interface FormStateData {
    [key: string]: unknown;
}
declare class FormStateManager {
    private static instance;
    private data;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): FormStateManager;
    /**
     * Set field value
     * @param name - Field name
     * @param value - Field value
     */
    setField(name: string, value: unknown): void;
    /**
     * Get field value
     * @param name - Field name
     * @returns Field value or undefined
     */
    getField(name: string): unknown;
    /**
     * Get all field data
     * @returns Copy of all form data
     */
    getAll(): FormStateData;
    /**
     * Clear all data
     */
    clear(): void;
    /**
     * Clear specific fields (used when branching changes)
     * @param fieldNames - Array of field names to clear
     */
    clearFields(fieldNames: string[]): void;
    /**
     * Get debug information
     */
    getDebugInfo(): Record<string, unknown>;
}
export declare const FormState: FormStateManager;
export {};
//# sourceMappingURL=formState.d.ts.map