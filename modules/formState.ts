/**
 * Singleton FormState class for managing form data in memory
 */

import { logVerbose } from './utils.js';

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

class FormStateManager {
  private static instance: FormStateManager;
  private data: FormStateData = {};
  private steps: Record<string, StepInfo> = {};
  private branchPath: BranchPath = {
    currentStep: '',
    previousSteps: [],
    skippedSteps: [],
    skipHistory: [],
    activeConditions: {}
  };

  private constructor() {
    logVerbose('FormState initialized');
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): FormStateManager {
    if (!FormStateManager.instance) {
      FormStateManager.instance = new FormStateManager();
    }
    return FormStateManager.instance;
  }

  /**
   * Set field value
   */
  public setField(name: string, value: unknown): void {
    const oldValue = this.data[name];
    this.data[name] = value;
    
    logVerbose(`Field updated: ${name}`, {
      oldValue,
      newValue: value
    });

    // Trigger change event for dependent logic
    this.onFieldChange(name, value, oldValue);
  }

  /**
   * Get field value
   */
  public getField(name: string): unknown {
    return this.data[name];
  }

  /**
   * Get all field data
   */
  public getAll(): FormStateData {
    return { ...this.data };
  }

  /**
   * Clear all data (enhanced to handle skip history)
   */
  public clear(): void {
    const oldData = { ...this.data };
    this.data = {};
    this.steps = {};
    this.branchPath = {
      currentStep: '',
      previousSteps: [],
      skippedSteps: [],
      skipHistory: [],
      activeConditions: {}
    };
    
    logVerbose('FormState cleared', { oldData });
  }

  /**
   * Clear specific fields (used when branching changes)
   */
  public clearFields(fieldNames: string[]): void {
    const clearedFields: Record<string, unknown> = {};
    
    fieldNames.forEach(name => {
      if (this.data[name] !== undefined) {
        clearedFields[name] = this.data[name];
        delete this.data[name];
      }
    });

    if (Object.keys(clearedFields).length > 0) {
      logVerbose('Fields cleared due to branch change', clearedFields);
    }
  }

  /**
   * Set step information
   */
  public setStepInfo(stepId: string, info: Partial<StepInfo>): void {
    if (!this.steps[stepId]) {
      this.steps[stepId] = {
        visible: false,
        visited: false
      };
    }

    Object.assign(this.steps[stepId], info);
    
    logVerbose(`Step info updated: ${stepId}`, this.steps[stepId]);
  }

  /**
   * Get step information
   */
  public getStepInfo(stepId: string): StepInfo | undefined {
    return this.steps[stepId];
  }

  /**
   * Get all step information
   */
  public getAllSteps(): Record<string, StepInfo> {
    return { ...this.steps };
  }

  /**
   * Set step visibility
   */
  public setStepVisibility(stepId: string, visible: boolean): void {
    this.setStepInfo(stepId, { visible });
    logVerbose(`Step visibility updated: ${stepId}`, { visible });
  }

  /**
   * Set current step in branch path
   */
  public setCurrentStep(stepId: string): void {
    if (this.branchPath.currentStep && this.branchPath.currentStep !== stepId) {
      this.branchPath.previousSteps.push(this.branchPath.currentStep);
    }
    
    this.branchPath.currentStep = stepId;
    
    // Mark step as visited
    this.setStepInfo(stepId, { visited: true });
    
    logVerbose(`Current step changed to: ${stepId}`, this.branchPath);
  }

  /**
   * Get current step
   */
  public getCurrentStep(): string {
    return this.branchPath.currentStep;
  }

  /**
   * Get branch path (for skip condition evaluation)
   */
  public getBranchPath(): BranchPath {
    return { ...this.branchPath };
  }

  /**
   * Add skipped step with enhanced tracking
   */
  public addSkippedStep(stepId: string, reason?: string, canUndo: boolean = true): void {
    if (!this.branchPath.skippedSteps.includes(stepId)) {
      this.branchPath.skippedSteps.push(stepId);
      
      // Add to skip history
      const skipEntry: SkipHistoryEntry = {
        stepId,
        reason,
        timestamp: Date.now(),
        canUndo,
        fieldsCleared: []
      };
      
      this.branchPath.skipHistory.push(skipEntry);
      
      // Mark step as skipped
      this.setStepInfo(stepId, { 
        skipped: true, 
        skipReason: reason,
        allowSkipUndo: canUndo 
      });
      
      logVerbose(`Step skipped: ${stepId}`, { 
        reason, 
        canUndo,
        totalSkipped: this.branchPath.skippedSteps.length 
      });
    }
  }

  /**
   * Remove step from skipped list (undo skip)
   */
  public undoSkipStep(stepId: string): boolean {
    const skipIndex = this.branchPath.skippedSteps.indexOf(stepId);
    if (skipIndex === -1) {
      logVerbose(`Cannot undo skip - step not in skipped list: ${stepId}`);
      return false;
    }

    // Check if undo is allowed
    const stepInfo = this.getStepInfo(stepId);
    if (stepInfo && stepInfo.allowSkipUndo === false) {
      logVerbose(`Cannot undo skip - undo not allowed for step: ${stepId}`);
      return false;
    }

    // Remove from skipped steps
    this.branchPath.skippedSteps.splice(skipIndex, 1);
    
    // Update step info
    this.setStepInfo(stepId, { 
      skipped: false, 
      skipReason: undefined 
    });

    // Update skip history
    const historyEntry = this.branchPath.skipHistory.find(entry => entry.stepId === stepId);
    if (historyEntry) {
      historyEntry.canUndo = false; // Mark as undone
    }

    logVerbose(`Skip undone for step: ${stepId}`, {
      remainingSkipped: this.branchPath.skippedSteps.length
    });

    return true;
  }

  /**
   * Check if step is skipped
   */
  public isStepSkipped(stepId: string): boolean {
    return this.branchPath.skippedSteps.includes(stepId);
  }

  /**
   * Get skip history
   */
  public getSkipHistory(): SkipHistoryEntry[] {
    return [...this.branchPath.skipHistory];
  }

  /**
   * Get all skipped steps
   */
  public getSkippedSteps(): string[] {
    return [...this.branchPath.skippedSteps];
  }

  /**
   * Clear skip history
   */
  public clearSkipHistory(): void {
    this.branchPath.skippedSteps = [];
    this.branchPath.skipHistory = [];
    
    // Update all step info to remove skip status
    Object.keys(this.steps).forEach(stepId => {
      if (this.steps[stepId].skipped) {
        this.setStepInfo(stepId, { 
          skipped: false, 
          skipReason: undefined 
        });
      }
    });

    logVerbose('Skip history cleared');
  }

  /**
   * Get skip statistics
   */
  public getSkipStats(): {
    totalSkipped: number;
    canUndoCount: number;
    skipReasons: Record<string, number>;
  } {
    const stats = {
      totalSkipped: this.branchPath.skippedSteps.length,
      canUndoCount: 0,
      skipReasons: {} as Record<string, number>
    };

    this.branchPath.skipHistory.forEach(entry => {
      if (entry.canUndo) {
        stats.canUndoCount++;
      }
      
      if (entry.reason) {
        stats.skipReasons[entry.reason] = (stats.skipReasons[entry.reason] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Set active condition
   */
  public setActiveCondition(key: string, value: unknown): void {
    this.branchPath.activeConditions[key] = value;
    logVerbose(`Active condition set: ${key}`, value);
  }

  /**
   * Get active condition
   */
  public getActiveCondition(key: string): unknown {
    return this.branchPath.activeConditions[key];
  }

  /**
   * Get fields by step type/subtype/number
   */
  public getFieldsByStep(): FormStateData {
    const result: FormStateData = {};
    
    // For now, return all fields that match the criteria
    // This can be enhanced with more sophisticated filtering
    Object.entries(this.data).forEach(([key, value]) => {
      // Simple implementation - can be enhanced with metadata tracking
      result[key] = value;
    });

    return result;
  }

  /**
   * Handle field change events
   */
  private onFieldChange(name: string, newValue: unknown, oldValue: unknown): void {
    // This can be used to trigger dependent field updates, validation, etc.
    // For now, just log the change
    if (newValue !== oldValue) {
      logVerbose(`Field change detected: ${name}`, {
        from: oldValue,
        to: newValue
      });
    }
  }

  /**
   * Reset to previous step (for back navigation)
   */
  public goToPreviousStep(): string | null {
    const previousStep = this.branchPath.previousSteps.pop();
    if (previousStep) {
      this.branchPath.currentStep = previousStep;
      logVerbose(`Went back to previous step: ${previousStep}`, this.branchPath);
      return previousStep;
    }
    return null;
  }

  /**
   * Check if step was visited
   */
  public wasStepVisited(stepId: string): boolean {
    return this.steps[stepId]?.visited || false;
  }

  /**
   * Check if step is visible
   */
  public isStepVisible(stepId: string): boolean {
    return this.steps[stepId]?.visible || false;
  }

  /**
   * Get debug information
   */
  public getDebugInfo(): Record<string, unknown> {
    return {
      data: this.data,
      steps: this.steps,
      branchPath: this.branchPath,
      fieldCount: Object.keys(this.data).length,
      stepCount: Object.keys(this.steps).length
    };
  }
}

// Export singleton instance
export const FormState = FormStateManager.getInstance(); 