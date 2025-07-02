/**
 * Singleton FormState class for managing form data in memory
 */

import { logVerbose } from './utils.js';

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

class FormStateManager {
  private static instance: FormStateManager;
  private data: FormStateData = {};
  private steps: Record<string, StepInfo> = {};
  private branchPath: BranchPath = {
    currentStep: '',
    previousSteps: [],
    skippedSteps: [],
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
  public setField(name: string, value: any): void {
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
  public getField(name: string): any {
    return this.data[name];
  }

  /**
   * Get all field data
   */
  public getAll(): FormStateData {
    return { ...this.data };
  }

  /**
   * Clear all data
   */
  public clear(): void {
    const oldData = { ...this.data };
    this.data = {};
    this.steps = {};
    this.branchPath = {
      currentStep: '',
      previousSteps: [],
      skippedSteps: [],
      activeConditions: {}
    };
    
    logVerbose('FormState cleared', { oldData });
  }

  /**
   * Clear specific fields (used when branching changes)
   */
  public clearFields(fieldNames: string[]): void {
    const clearedFields: Record<string, any> = {};
    
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
   * Get branch path information
   */
  public getBranchPath(): BranchPath {
    return { ...this.branchPath };
  }

  /**
   * Add skipped step
   */
  public addSkippedStep(stepId: string): void {
    if (!this.branchPath.skippedSteps.includes(stepId)) {
      this.branchPath.skippedSteps.push(stepId);
      logVerbose(`Step skipped: ${stepId}`, this.branchPath.skippedSteps);
    }
  }

  /**
   * Set active condition
   */
  public setActiveCondition(key: string, value: any): void {
    this.branchPath.activeConditions[key] = value;
    logVerbose(`Active condition set: ${key}`, value);
  }

  /**
   * Get active condition
   */
  public getActiveCondition(key: string): any {
    return this.branchPath.activeConditions[key];
  }

  /**
   * Get fields by step type/subtype/number
   */
  public getFieldsByStep(type?: string, subtype?: string, number?: string): FormStateData {
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
  private onFieldChange(name: string, newValue: any, oldValue: any): void {
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
  public getDebugInfo(): any {
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