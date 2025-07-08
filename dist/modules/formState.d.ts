/**
 * Singleton FormState class for managing form data in memory
 */
export interface FormStateData {
    [key: string]: unknown;
}
export interface StepInfo {
    type?: string;
    subtype?: string;
    number?: string;
    visible: boolean;
    visited: boolean;
    skipped?: boolean;
    skipReason?: string;
    allowSkipUndo?: boolean;
}
export interface BranchPath {
    currentStep: string;
    previousSteps: string[];
    skippedSteps: string[];
    skipHistory: SkipHistoryEntry[];
    activeConditions: Record<string, unknown>;
}
export interface SkipHistoryEntry {
    stepId: string;
    reason?: string;
    timestamp: number;
    canUndo: boolean;
    fieldsCleared: string[];
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
    setField(name: string, value: unknown): void;
    /**
     * Get field value
     */
    getField(name: string): unknown;
    /**
     * Get all field data
     */
    getAll(): FormStateData;
    /**
     * Clear all data (enhanced to handle skip history)
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
     * Set step visibility
     */
    setStepVisibility(stepId: string, visible: boolean): void;
    /**
     * Set current step in branch path
     */
    setCurrentStep(stepId: string): void;
    /**
     * Get current step
     */
    getCurrentStep(): string;
    /**
     * Get branch path (for skip condition evaluation)
     */
    getBranchPath(): BranchPath;
    /**
     * Add skipped step with enhanced tracking
     */
    addSkippedStep(stepId: string, reason?: string, canUndo?: boolean): void;
    /**
     * Remove step from skipped list (undo skip)
     */
    undoSkipStep(stepId: string): boolean;
    /**
     * Check if step is skipped
     */
    isStepSkipped(stepId: string): boolean;
    /**
     * Get skip history
     */
    getSkipHistory(): SkipHistoryEntry[];
    /**
     * Get all skipped steps
     */
    getSkippedSteps(): string[];
    /**
     * Clear skip history
     */
    clearSkipHistory(): void;
    /**
     * Get skip statistics
     */
    getSkipStats(): {
        totalSkipped: number;
        canUndoCount: number;
        skipReasons: Record<string, number>;
    };
    /**
     * Set active condition
     */
    setActiveCondition(key: string, value: unknown): void;
    /**
     * Get active condition
     */
    getActiveCondition(key: string): unknown;
    /**
     * Get fields by step type/subtype/number
     */
    getFieldsByStep(): FormStateData;
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
    getDebugInfo(): Record<string, unknown>;
}
export declare const FormState: FormStateManager;
export {};
//# sourceMappingURL=formState.d.ts.map