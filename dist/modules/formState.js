/**
 * Singleton FormState class for managing form data in memory
 */
import { logVerbose } from './utils.js';
class FormStateManager {
    constructor() {
        this.data = {};
        this.steps = {};
        this.branchPath = {
            currentStep: '',
            previousSteps: [],
            skippedSteps: [],
            skipHistory: [],
            activeConditions: {}
        };
        logVerbose('FormState initialized');
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!FormStateManager.instance) {
            FormStateManager.instance = new FormStateManager();
        }
        return FormStateManager.instance;
    }
    /**
     * Set field value
     */
    setField(name, value) {
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
    getField(name) {
        return this.data[name];
    }
    /**
     * Get all field data
     */
    getAll() {
        return { ...this.data };
    }
    /**
     * Clear all data (enhanced to handle skip history)
     */
    clear() {
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
    clearFields(fieldNames) {
        const clearedFields = {};
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
    setStepInfo(stepId, info) {
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
    getStepInfo(stepId) {
        return this.steps[stepId];
    }
    /**
     * Get all step information
     */
    getAllSteps() {
        return { ...this.steps };
    }
    /**
     * Set step visibility
     */
    setStepVisibility(stepId, visible) {
        this.setStepInfo(stepId, { visible });
        logVerbose(`Step visibility updated: ${stepId}`, { visible });
    }
    /**
     * Set current step in branch path
     */
    setCurrentStep(stepId) {
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
    getCurrentStep() {
        return this.branchPath.currentStep;
    }
    /**
     * Get branch path (for skip condition evaluation)
     */
    getBranchPath() {
        return { ...this.branchPath };
    }
    /**
     * Add skipped step with enhanced tracking
     */
    addSkippedStep(stepId, reason, canUndo = true) {
        if (!this.branchPath.skippedSteps.includes(stepId)) {
            this.branchPath.skippedSteps.push(stepId);
            // Add to skip history
            const skipEntry = {
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
    undoSkipStep(stepId) {
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
    isStepSkipped(stepId) {
        return this.branchPath.skippedSteps.includes(stepId);
    }
    /**
     * Get skip history
     */
    getSkipHistory() {
        return [...this.branchPath.skipHistory];
    }
    /**
     * Get all skipped steps
     */
    getSkippedSteps() {
        return [...this.branchPath.skippedSteps];
    }
    /**
     * Clear skip history
     */
    clearSkipHistory() {
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
    getSkipStats() {
        const stats = {
            totalSkipped: this.branchPath.skippedSteps.length,
            canUndoCount: 0,
            skipReasons: {}
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
    setActiveCondition(key, value) {
        this.branchPath.activeConditions[key] = value;
        logVerbose(`Active condition set: ${key}`, value);
    }
    /**
     * Get active condition
     */
    getActiveCondition(key) {
        return this.branchPath.activeConditions[key];
    }
    /**
     * Get fields by step type/subtype/number
     */
    getFieldsByStep() {
        const result = {};
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
    onFieldChange(name, newValue, oldValue) {
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
    goToPreviousStep() {
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
    wasStepVisited(stepId) {
        return this.steps[stepId]?.visited || false;
    }
    /**
     * Check if step is visible
     */
    isStepVisible(stepId) {
        return this.steps[stepId]?.visible || false;
    }
    /**
     * Get debug information
     */
    getDebugInfo() {
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
//# sourceMappingURL=formState.js.map