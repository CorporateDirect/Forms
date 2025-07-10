/**
 * Simple FormState singleton for managing form data in memory
 * Per instructions: Only handles form data with 4 required methods
 */
import { logVerbose } from './utils.js';
class FormStateManager {
    constructor() {
        this.data = {};
        logVerbose('FormState initialized (simplified)');
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
     * @param name - Field name
     * @param value - Field value
     */
    setField(name, value) {
        const oldValue = this.data[name];
        this.data[name] = value;
        logVerbose(`Field updated: ${name}`, {
            oldValue,
            newValue: value
        });
    }
    /**
     * Get field value
     * @param name - Field name
     * @returns Field value or undefined
     */
    getField(name) {
        return this.data[name];
    }
    /**
     * Get all field data
     * @returns Copy of all form data
     */
    getAll() {
        return { ...this.data };
    }
    /**
     * Clear all data
     */
    clear() {
        const oldData = { ...this.data };
        this.data = {};
        logVerbose('FormState cleared', { oldData });
    }
    /**
     * Clear specific fields (used when branching changes)
     * @param fieldNames - Array of field names to clear
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
     * Get debug information
     */
    getDebugInfo() {
        return {
            data: this.data,
            fieldCount: Object.keys(this.data).length
        };
    }
}
// Export singleton instance
export const FormState = FormStateManager.getInstance();
//# sourceMappingURL=formState.js.map