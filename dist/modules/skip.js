/**
 * Enhanced skip functionality module
 */
import { SELECTORS, CSS_CLASSES } from '../config.js';
import { logVerbose, queryAllByAttr, getAttrValue, delegateEvent, addClass, removeClass, isVisible } from './utils.js';
import { FormState } from './formState.js';
import { clearFieldValidation } from './validation.js';
import { formEvents } from './events.js';
let initialized = false;
let cleanupFunctions = [];
let skipRules = new Map();
let skipSections = new Map();
/**
 * Initialize enhanced skip functionality
 */
export function initSkip(root = document) {
    if (initialized) {
        logVerbose('Skip module already initialized, cleaning up first');
        resetSkip();
    }
    logVerbose('Initializing enhanced skip functionality');
    // Set up skip rules from data attributes
    setupSkipRules(root);
    // Set up skip sections
    setupSkipSections(root);
    // Set up event listeners
    setupSkipListeners(root);
    initialized = true;
    logVerbose('Skip initialization complete', {
        skipRules: skipRules.size,
        skipSections: skipSections.size
    });
    // Register this module as initialized
    formEvents.registerModule('skip');
}
/**
 * Set up skip rules from data attributes
 */
function setupSkipRules(root) {
    const stepsWithSkipRules = queryAllByAttr(SELECTORS.STEP, root);
    stepsWithSkipRules.forEach(stepElement => {
        const stepId = getAttrValue(stepElement, 'data-answer');
        if (!stepId)
            return;
        const skipIf = getAttrValue(stepElement, 'data-skip-if');
        const skipUnless = getAttrValue(stepElement, 'data-skip-unless');
        const skipTo = getAttrValue(stepElement, 'data-skip-to');
        const skipReason = getAttrValue(stepElement, 'data-skip-reason');
        const allowUndo = getAttrValue(stepElement, 'data-allow-skip-undo') !== 'false';
        if (skipIf || skipUnless) {
            const condition = skipIf || `!(${skipUnless})`;
            const skipRule = {
                stepId,
                condition,
                targetStep: skipTo || undefined,
                reason: skipReason || 'Conditional skip',
                allowUndo,
                clearFields: true
            };
            skipRules.set(stepId, skipRule);
            logVerbose(`Skip rule configured for step: ${stepId}`, {
                condition,
                targetStep: skipTo,
                reason: skipReason
            });
        }
    });
}
/**
 * Set up skip sections from data attributes
 */
function setupSkipSections(root) {
    const sectionsWithSkip = queryAllByAttr(SELECTORS.SKIP_SECTION, root);
    sectionsWithSkip.forEach(sectionElement => {
        const sectionId = getAttrValue(sectionElement, 'data-skip-section');
        if (!sectionId)
            return;
        const condition = getAttrValue(sectionElement, 'data-skip-if');
        const reason = getAttrValue(sectionElement, 'data-skip-reason');
        // Find all steps in this section
        const stepsInSection = sectionElement.querySelectorAll(SELECTORS.STEP);
        const stepIds = [];
        stepsInSection.forEach(stepElement => {
            const stepId = getAttrValue(stepElement, 'data-answer');
            if (stepId) {
                stepIds.push(stepId);
            }
        });
        if (stepIds.length > 0) {
            const skipSection = {
                sectionId,
                steps: stepIds,
                condition: condition || undefined,
                reason: reason || `Section skip: ${sectionId}`
            };
            skipSections.set(sectionId, skipSection);
            logVerbose(`Skip section configured: ${sectionId}`, {
                steps: stepIds.length,
                condition,
                reason
            });
        }
    });
}
/**
 * Set up skip event listeners
 */
function setupSkipListeners(root) {
    // Skip button handling - use the main SKIP selector for buttons with data-skip attribute
    const cleanup1 = delegateEvent(root, 'click', SELECTORS.SKIP, handleSkipButtonClick);
    cleanupFunctions.push(cleanup1);
}
/**
 * Handle skip button click with enhanced logic
 */
function handleSkipButtonClick(event, target) {
    event.preventDefault();
    console.log('🔘 [Skip] Button clicked - starting analysis', {
        element: target,
        tagName: target.tagName,
        className: target.className,
        id: target.id
    });
    if (!initialized) {
        console.error('❌ [Skip] Module not initialized, ignoring skip button click', {
            target: target,
            initialized: initialized,
            skipRulesCount: skipRules.size,
            skipSectionsCount: skipSections.size
        });
        return;
    }
    // Get the data-skip value - this MUST match a data-answer value
    const dataSkip = getAttrValue(target, 'data-skip');
    const dataSkipReason = getAttrValue(target, 'data-skip-reason');
    const dataAllowUndo = getAttrValue(target, 'data-allow-skip-undo');
    console.log('📋 [Skip] Data attributes analysis:', {
        'data-skip': dataSkip,
        'data-skip-reason': dataSkipReason,
        'data-allow-skip-undo': dataAllowUndo,
        allAttributes: Array.from(target.attributes).map(attr => ({
            name: attr.name,
            value: attr.value
        }))
    });
    // Validate that data-skip has a value and it's not just "true" or empty
    if (!dataSkip || dataSkip === 'true' || dataSkip === '') {
        console.error('❌ [Skip] Invalid data-skip value - must specify target step', {
            dataSkip,
            isEmpty: dataSkip === '',
            isTrue: dataSkip === 'true',
            isNull: dataSkip === null,
            isUndefined: dataSkip === undefined,
            requirement: 'data-skip must contain a value that matches an existing data-answer'
        });
        return;
    }
    // Verify the target step exists in the DOM
    const targetElement = document.querySelector(`[data-answer="${dataSkip}"]`);
    const allAnswerElements = document.querySelectorAll('[data-answer]');
    const allAnswerValues = Array.from(allAnswerElements).map(el => getAttrValue(el, 'data-answer'));
    console.log('🔍 [Skip] Target step verification:', {
        targetStep: dataSkip,
        targetElementExists: !!targetElement,
        targetElement: targetElement ? {
            tagName: targetElement.tagName,
            id: targetElement.id,
            className: targetElement.className,
            dataAnswer: getAttrValue(targetElement, 'data-answer'),
            isVisible: targetElement instanceof HTMLElement ? isVisible(targetElement) : false
        } : null,
        availableSteps: allAnswerValues,
        totalStepsWithDataAnswer: allAnswerElements.length,
        searchQuery: `[data-answer="${dataSkip}"]`
    });
    if (!targetElement) {
        console.error('❌ [Skip] Target step not found in DOM! Skip operation cancelled.', {
            searchedFor: dataSkip,
            availableSteps: allAnswerValues,
            suggestion: `Check if element with data-answer="${dataSkip}" exists`,
            possibleMatches: allAnswerValues.filter(val => val && val.includes(dataSkip)),
            fix: `Ensure your skip button data-skip="${dataSkip}" matches an existing data-answer="${dataSkip}"`
        });
        return;
    }
    const currentStepId = FormState.getCurrentStep();
    if (!currentStepId) {
        console.error('❌ [Skip] No current step found for skip operation', {
            formState: FormState.getDebugInfo(),
            branchPath: FormState.getBranchPath(),
            allSteps: FormState.getAllSteps()
        });
        return;
    }
    const skipReason = dataSkipReason || 'User skipped';
    const allowUndo = dataAllowUndo !== 'false';
    console.log('🎯 [Skip] Processing valid skip request:', {
        currentStepId,
        targetStepId: dataSkip,
        skipReason,
        allowUndo,
        targetExists: true
    });
    console.log('🚀 [Skip] Emitting skip:request event:', {
        targetStepId: dataSkip,
        currentStep: currentStepId,
        reason: skipReason,
        allowUndo: allowUndo
    });
    formEvents.emit('skip:request', { targetStepId: dataSkip });
    console.log('✅ [Skip] Skip request emitted successfully');
}
/**
 * Skip a specific step
 */
export function skipStep(stepId, reason, allowUndo = true, targetStep) {
    if (!initialized) {
        logVerbose('Skip module not initialized, cannot skip step');
        return false;
    }
    if (!stepId) {
        logVerbose('Invalid stepId provided to skipStep');
        return false;
    }
    logVerbose('=== SKIP STEP FUNCTION START ===');
    logVerbose(`Attempting to skip step: ${stepId}`, { reason, allowUndo, targetStep });
    // Check if step is already skipped
    if (FormState.isStepSkipped(stepId)) {
        logVerbose(`Step already skipped: ${stepId}`);
        return false;
    }
    // Mark the step as skipped in the central state
    FormState.addSkippedStep(stepId, reason, allowUndo);
    // Clear fields of the skipped step
    const clearedFields = clearStepFields(stepId);
    // Apply visual styling for skipped step
    applySkipStyling(stepId, true);
    logVerbose(`Step ${stepId} skipped successfully`, {
        reason,
        allowUndo,
        targetStep,
        clearedFields
    });
    return true;
}
/**
 * Skip an entire section
 */
export function skipSection(sectionId, reason) {
    const section = skipSections.get(sectionId);
    if (!section) {
        logVerbose(`Skip section not found: ${sectionId}`);
        return false;
    }
    const skipReason = reason || section.reason || `Section skipped: ${sectionId}`;
    let skippedCount = 0;
    section.steps.forEach(stepId => {
        if (skipStep(stepId, skipReason, true)) {
            skippedCount++;
        }
    });
    logVerbose(`Section skipped: ${sectionId}`, {
        totalSteps: section.steps.length,
        skippedCount
    });
    return skippedCount > 0;
}
/**
 * Undo skip for a specific step
 */
export function undoSkipStep(stepId) {
    if (!FormState.isStepSkipped(stepId)) {
        logVerbose(`Step is not skipped, cannot undo: ${stepId}`);
        return false;
    }
    const success = FormState.undoSkipStep(stepId);
    if (success) {
        // Remove skip styling
        applySkipStyling(stepId, false);
        logVerbose(`Skip undone for step: ${stepId}`);
    }
    return success;
}
/**
 * Check if conditional skip should be applied
 */
export function evaluateSkipConditions() {
    const activeConditions = FormState.getBranchPath().activeConditions;
    skipRules.forEach((rule, stepId) => {
        if (!rule.condition)
            return;
        const shouldSkip = evaluateCondition(rule.condition, activeConditions);
        const isCurrentlySkipped = FormState.isStepSkipped(stepId);
        if (shouldSkip && !isCurrentlySkipped) {
            skipStep(stepId, rule.reason, rule.allowUndo, rule.targetStep);
        }
        else if (!shouldSkip && isCurrentlySkipped && rule.allowUndo) {
            undoSkipStep(stepId);
        }
    });
    // Evaluate section skips
    skipSections.forEach((section, sectionId) => {
        if (!section.condition)
            return;
        const shouldSkip = evaluateCondition(section.condition, activeConditions);
        if (shouldSkip) {
            skipSection(sectionId, section.reason);
        }
    });
}
/**
 * Clear fields in a step
 */
function clearStepFields(stepId) {
    const clearedFields = [];
    const stepElement = document.querySelector(`[data-answer="${stepId}"]`);
    if (!stepElement) {
        logVerbose(`Cannot clear fields - step element not found for ${stepId}`);
        return [];
    }
    const fields = stepElement.querySelectorAll(SELECTORS.ALL_INPUTS);
    fields.forEach(field => {
        const input = field;
        const fieldName = input.name || getAttrValue(input, 'data-step-field-name');
        if (fieldName) {
            // Clear value from FormState
            FormState.clearFields([fieldName]);
            // Clear validation state
            clearFieldValidation(fieldName);
            // Reset input value
            if (input.type === 'radio' || input.type === 'checkbox') {
                input.checked = false;
            }
            else {
                input.value = '';
            }
            clearedFields.push(fieldName);
        }
    });
    logVerbose(`Cleared ${clearedFields.length} fields in step ${stepId}`, { clearedFields });
    return clearedFields;
}
/**
 * Apply skip styling to a step
 */
function applySkipStyling(stepId, isSkipped) {
    const stepElement = document.querySelector(`[data-answer="${stepId}"]`);
    if (!stepElement)
        return;
    if (isSkipped) {
        addClass(stepElement, CSS_CLASSES.SKIPPED_STEP);
        removeClass(stepElement, CSS_CLASSES.SKIP_AVAILABLE);
    }
    else {
        removeClass(stepElement, CSS_CLASSES.SKIPPED_STEP);
        addClass(stepElement, CSS_CLASSES.SKIP_AVAILABLE);
    }
}
/**
 * Evaluate a condition string
 */
function evaluateCondition(condition, activeConditions) {
    if (!condition || typeof condition !== 'string') {
        logVerbose('Invalid condition provided', { condition });
        return false;
    }
    try {
        // Simple condition evaluation - can be enhanced for complex logic
        const trimmedCondition = condition.trim();
        // Handle negation
        if (trimmedCondition.startsWith('!')) {
            const innerCondition = trimmedCondition.substring(1).trim();
            return !evaluateCondition(innerCondition, activeConditions);
        }
        // Handle multiple conditions separated by commas (OR logic)
        if (trimmedCondition.includes(',')) {
            const conditions = trimmedCondition.split(',').map(c => c.trim());
            return conditions.some(cond => !!activeConditions[cond]);
        }
        // Handle multiple conditions separated by ampersand (AND logic)
        if (trimmedCondition.includes('&')) {
            const conditions = trimmedCondition.split('&').map(c => c.trim());
            return conditions.every(cond => !!activeConditions[cond]);
        }
        // Single condition
        return !!activeConditions[trimmedCondition];
    }
    catch (error) {
        logVerbose('Error evaluating skip condition', { condition, error });
        return false;
    }
}
/**
 * Navigate to the target step if provided.
 * This function is now decoupled and relies on event emission.
 */
function navigateToStep(stepId) {
    logVerbose(`Requesting navigation to step: ${stepId}`);
    formEvents.emit('skip:request', { targetStepId: stepId });
}
/**
 * Navigate to the next available step.
 * This function is now decoupled and relies on event emission.
 */
function navigateToNextAvailableStep() {
    logVerbose('Requesting navigation to next available step');
    formEvents.emit('skip:request', { targetStepId: null });
}
/**
 * Check if a step can be skipped
 */
export function canSkipStep(stepId) {
    return FormState.isStepSkipped(stepId);
}
/**
 * Get skip statistics and state
 */
export function getSkipState() {
    return {
        initialized,
        skipRules: Array.from(skipRules.entries()).map(([id, rule]) => ({
            stepId: id,
            condition: rule.condition,
            targetStep: rule.targetStep,
            reason: rule.reason,
            allowUndo: rule.allowUndo,
            clearFields: rule.clearFields
        })),
        skipSections: Array.from(skipSections.entries()).map(([id, section]) => ({
            sectionId: id,
            steps: section.steps,
            condition: section.condition,
            reason: section.reason
        })),
        currentSkipStats: FormState.getSkipStats(),
        skippedSteps: FormState.getSkippedSteps(),
        skipHistory: FormState.getSkipHistory()
    };
}
/**
 * Reset skip functionality
 */
export function resetSkip() {
    if (!initialized) {
        logVerbose('Skip module not initialized, nothing to reset');
        return;
    }
    logVerbose('Resetting skip functionality');
    // Unregister this module
    formEvents.unregisterModule('skip');
    // Clean up event listeners
    cleanupFunctions.forEach(cleanup => cleanup());
    cleanupFunctions = [];
    // Clear skip rules and sections
    skipRules.clear();
    skipSections.clear();
    // Clear skip history in FormState
    FormState.clearSkipHistory();
    initialized = false;
    logVerbose('Skip reset complete');
}
//# sourceMappingURL=skip.js.map