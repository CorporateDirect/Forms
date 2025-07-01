/**
 * Singleton FormState class for managing form data in memory
 */
export interface FormStateData {
    [key: string]: any;
}
export interface StepInfo {
    type?: string;
    subtype?: string;
    number?: string;
    visible: boolean;
    visited: boolean;
}
export interface BranchPath {
    currentStep: string;
    previousSteps: string[];
    skippedSteps: string[];
    activeConditions: Record<string, any>;
}
declare class FormStateManager {
    private static instance;
    private data;
    private steps;
    private branchPath;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): FormStateManager;
    /**
     * Set field value
     */
    setField(name: string, value: any): void;
    /**
     * Get field value
     */
    getField(name: string): any;
    /**
     * Get all field data
     */
    getAll(): FormStateData;
    /**
     * Clear all data
     */
    clear(): void;
    /**
     * Clear specific fields (used when branching changes)
     */
    clearFields(fieldNames: string[]): void;
    /**
     * Set step information
     */
    setStepInfo(stepId: string, info: Partial<StepInfo>): void;
    /**
     * Get step information
     */
    getStepInfo(stepId: string): StepInfo | undefined;
    /**
     * Get all step information
     */
    getAllSteps(): Record<string, StepInfo>;
    /**
     * Set current step in branch path
     */
    setCurrentStep(stepId: string): void;
    /**
     * Get current step
     */
    getCurrentStep(): string;
    /**
     * Get branch path information
     */
    getBranchPath(): BranchPath;
    /**
     * Add skipped step
     */
    addSkippedStep(stepId: string): void;
    /**
     * Set active condition
     */
    setActiveCondition(key: string, value: any): void;
    /**
     * Get active condition
     */
    getActiveCondition(key: string): any;
    /**
     * Get fields by step type/subtype/number
     */
    getFieldsByStep(type?: string, subtype?: string, number?: string): FormStateData;
    /**
     * Handle field change events
     */
    private onFieldChange;
    /**
     * Reset to previous step (for back navigation)
     */
    goToPreviousStep(): string | null;
    /**
     * Check if step was visited
     */
    wasStepVisited(stepId: string): boolean;
    /**
     * Check if step is visible
     */
    isStepVisible(stepId: string): boolean;
    /**
     * Get debug information
     */
    getDebugInfo(): any;
}
export declare const FormState: FormStateManager;
export {};
//# sourceMappingURL=formState.d.ts.map