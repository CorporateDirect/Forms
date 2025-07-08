/**
 * Enhanced skip functionality module
 */

import { SELECTORS, CSS_CLASSES } from '../config.js';
import { 
  logVerbose, 
  queryAllByAttr, 
  getAttrValue, 
  delegateEvent,
  addClass,
  removeClass
} from './utils.js';
import { FormState } from './formState.js';
import { clearFieldValidation } from './validation.js';

// Forward declarations for multiStep integration
let goToStepById: ((stepId: string) => void) | null = null;
let goToNextStep: (() => void) | null = null;

/**
 * Set navigation functions from multiStep module
 */
export function setNavigationFunctions(
  goToStepByIdFn: (stepId: string) => void,
  goToNextStepFn: () => void
): void {
  goToStepById = goToStepByIdFn;
  goToNextStep = goToNextStepFn;
  logVerbose('Navigation functions set for skip module');
}

interface SkipRule {
  stepId: string;
  condition?: string;
  targetStep?: string;
  reason?: string;
  allowUndo: boolean;
  clearFields: boolean;
}

interface SkipSection {
  sectionId: string;
  steps: string[];
  condition?: string;
  reason?: string;
}

let initialized = false;
let cleanupFunctions: (() => void)[] = [];
let skipRules: Map<string, SkipRule> = new Map();
let skipSections: Map<string, SkipSection> = new Map();

/**
 * Initialize enhanced skip functionality
 */
export function initSkip(root: Document | Element = document): void {
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
}

/**
 * Set up skip rules from data attributes
 */
function setupSkipRules(root: Document | Element): void {
  const stepsWithSkipRules = queryAllByAttr(SELECTORS.STEP, root);
  
  stepsWithSkipRules.forEach(stepElement => {
    const stepId = getAttrValue(stepElement, 'data-answer');
    if (!stepId) return;

    const skipIf = getAttrValue(stepElement, 'data-skip-if');
    const skipUnless = getAttrValue(stepElement, 'data-skip-unless');
    const skipTo = getAttrValue(stepElement, 'data-skip-to');
    const skipReason = getAttrValue(stepElement, 'data-skip-reason');
    const allowUndo = getAttrValue(stepElement, 'data-allow-skip-undo') !== 'false';

    if (skipIf || skipUnless) {
      const condition = skipIf || `!(${skipUnless})`;
      
      const skipRule: SkipRule = {
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
function setupSkipSections(root: Document | Element): void {
  const sectionsWithSkip = queryAllByAttr(SELECTORS.SKIP_SECTION, root);
  
  sectionsWithSkip.forEach(sectionElement => {
    const sectionId = getAttrValue(sectionElement, 'data-skip-section');
    if (!sectionId) return;

    const condition = getAttrValue(sectionElement, 'data-skip-if');
    const reason = getAttrValue(sectionElement, 'data-skip-reason');
    
    // Find all steps in this section
    const stepsInSection = sectionElement.querySelectorAll(SELECTORS.STEP);
    const stepIds: string[] = [];
    
    stepsInSection.forEach(stepElement => {
      const stepId = getAttrValue(stepElement, 'data-answer');
      if (stepId) {
        stepIds.push(stepId);
      }
    });

    if (stepIds.length > 0) {
      const skipSection: SkipSection = {
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
function setupSkipListeners(root: Document | Element): void {
  // Enhanced skip button handling
  const cleanup1 = delegateEvent(root, 'click', SELECTORS.SKIP_BTN, handleSkipButtonClick);
  
  // Skip-to button handling
  const cleanup2 = delegateEvent(root, 'click', SELECTORS.SKIP_TO, handleSkipToClick);

  cleanupFunctions.push(cleanup1, cleanup2);
}

/**
 * Handle skip button click with enhanced logic
 */
function handleSkipButtonClick(event: Event, target: Element): void {
  event.preventDefault();
  
  const currentStepId = FormState.getCurrentStep();
  if (!currentStepId) {
    logVerbose('No current step found for skip operation');
    return;
  }

  const skipReason = getAttrValue(target, 'data-skip-reason') || 'User skipped';
  const allowUndo = getAttrValue(target, 'data-allow-skip-undo') !== 'false';
  const skipTo = getAttrValue(target, 'data-skip-to');

  skipStep(currentStepId, skipReason, allowUndo, skipTo || undefined);
}

/**
 * Handle skip-to button click
 */
function handleSkipToClick(event: Event, target: Element): void {
  event.preventDefault();
  
  const targetStepId = getAttrValue(target, 'data-skip-to');
  if (!targetStepId) {
    logVerbose('No target step specified for skip-to operation');
    return;
  }

  const reason = getAttrValue(target, 'data-skip-reason') || `Skipped to ${targetStepId}`;
  const allowUndo = getAttrValue(target, 'data-allow-skip-undo') !== 'false';

  skipToStep(targetStepId, reason, allowUndo);
}

/**
 * Skip a specific step
 */
export function skipStep(stepId: string, reason?: string, allowUndo: boolean = true, targetStep?: string): boolean {
  logVerbose(`Attempting to skip step: ${stepId}`, { reason, allowUndo, targetStep });

  // Check if step is already skipped
  if (FormState.isStepSkipped(stepId)) {
    logVerbose(`Step already skipped: ${stepId}`);
    return false;
  }

  // Clear fields in the step being skipped
  const fieldsCleared = clearStepFields(stepId);
  
  // Add to skip tracking
  FormState.addSkippedStep(stepId, reason, allowUndo);
  
  // Update skip history with cleared fields
  const skipHistory = FormState.getSkipHistory();
  const latestEntry = skipHistory[skipHistory.length - 1];
  if (latestEntry && latestEntry.stepId === stepId) {
    latestEntry.fieldsCleared = fieldsCleared;
  }

  // Apply skip styling
  applySkipStyling(stepId, true);

  // Navigate to target step or next step
  if (targetStep) {
    navigateToStep(targetStep);
  } else {
    navigateToNextAvailableStep();
  }

  logVerbose(`Step skipped successfully: ${stepId}`, {
    fieldsCleared: fieldsCleared.length,
    targetStep
  });

  return true;
}

/**
 * Skip to a specific step (skipping all steps in between)
 */
export function skipToStep(targetStepId: string, reason?: string, allowUndo: boolean = true): boolean {
  const currentStepId = FormState.getCurrentStep();
  if (!currentStepId) {
    logVerbose('No current step found for skip-to operation');
    return false;
  }

  // Get all steps between current and target
  const stepsToSkip = getStepsBetween(currentStepId, targetStepId);
  
  if (stepsToSkip.length === 0) {
    logVerbose(`No steps to skip between ${currentStepId} and ${targetStepId}`);
    return false;
  }

  // Skip all intermediate steps
  stepsToSkip.forEach(stepId => {
    skipStep(stepId, reason, allowUndo);
  });

  // Navigate to target step
  navigateToStep(targetStepId);

  logVerbose(`Skipped to step: ${targetStepId}`, {
    stepsSkipped: stepsToSkip.length,
    skippedSteps: stepsToSkip
  });

  return true;
}

/**
 * Skip an entire section
 */
export function skipSection(sectionId: string, reason?: string): boolean {
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
export function undoSkipStep(stepId: string): boolean {
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
export function evaluateSkipConditions(): void {
  const activeConditions = FormState.getBranchPath().activeConditions;
  
  skipRules.forEach((rule, stepId) => {
    if (!rule.condition) return;

    const shouldSkip = evaluateCondition(rule.condition, activeConditions);
    const isCurrentlySkipped = FormState.isStepSkipped(stepId);

    if (shouldSkip && !isCurrentlySkipped) {
      skipStep(stepId, rule.reason, rule.allowUndo, rule.targetStep);
    } else if (!shouldSkip && isCurrentlySkipped && rule.allowUndo) {
      undoSkipStep(stepId);
    }
  });

  // Evaluate section skips
  skipSections.forEach((section, sectionId) => {
    if (!section.condition) return;

    const shouldSkip = evaluateCondition(section.condition, activeConditions);
    
    if (shouldSkip) {
      skipSection(sectionId, section.reason);
    }
  });
}

/**
 * Clear fields in a step
 */
function clearStepFields(stepId: string): string[] {
  const stepElement = document.querySelector(`[data-answer="${stepId}"]`);
  if (!stepElement) return [];

  const fieldsCleared: string[] = [];
  const fields = stepElement.querySelectorAll('input, select, textarea');

  fields.forEach(field => {
    const htmlField = field as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    const fieldName = htmlField.name || getAttrValue(field, 'data-step-field-name');

    if (fieldName) {
      // Clear validation errors
      clearFieldValidation(fieldName);
      
      // Clear field value
      if (htmlField instanceof HTMLInputElement && (htmlField.type === 'checkbox' || htmlField.type === 'radio')) {
        htmlField.checked = false;
      } else {
        htmlField.value = '';
      }

      // Clear from FormState
      FormState.setField(fieldName, null);
      fieldsCleared.push(fieldName);
    }
  });

  return fieldsCleared;
}

/**
 * Apply skip styling to a step
 */
function applySkipStyling(stepId: string, isSkipped: boolean): void {
  const stepElement = document.querySelector(`[data-answer="${stepId}"]`);
  if (!stepElement) return;

  if (isSkipped) {
    addClass(stepElement, CSS_CLASSES.SKIPPED_STEP);
    removeClass(stepElement, CSS_CLASSES.SKIP_AVAILABLE);
  } else {
    removeClass(stepElement, CSS_CLASSES.SKIPPED_STEP);
    addClass(stepElement, CSS_CLASSES.SKIP_AVAILABLE);
  }
}

/**
 * Evaluate a condition string
 */
function evaluateCondition(condition: string, activeConditions: Record<string, unknown>): boolean {
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
  } catch (error) {
    logVerbose('Error evaluating skip condition', { condition, error });
    return false;
  }
}

/**
 * Get steps between two step IDs
 */
function getStepsBetween(fromStepId: string, toStepId: string): string[] {
  // This is a simplified implementation
  // In a real scenario, you'd need to determine the actual step order
  const allSteps = Array.from(document.querySelectorAll(SELECTORS.STEP));
  const stepIds: string[] = [];
  
  let capturing = false;
  
  allSteps.forEach(stepElement => {
    const stepId = getAttrValue(stepElement, 'data-answer');
    if (!stepId) return;

    if (stepId === fromStepId) {
      capturing = true;
      return; // Don't include the starting step
    }
    
    if (stepId === toStepId) {
      capturing = false;
      return; // Don't include the target step
    }
    
    if (capturing) {
      stepIds.push(stepId);
    }
  });

  return stepIds;
}

/**
 * Navigate to a specific step
 */
function navigateToStep(stepId: string): void {
  if (goToStepById) {
    goToStepById(stepId);
  } else {
    logVerbose(`Navigation requested to step: ${stepId}, but goToStepById is not set.`);
  }
}

/**
 * Navigate to the next available (non-skipped) step
 */
function navigateToNextAvailableStep(): void {
  if (goToNextStep) {
    goToNextStep();
  } else {
    logVerbose('Navigation requested to next available step, but goToNextStep is not set.');
  }
}

/**
 * Get skip statistics and state
 */
export function getSkipState(): Record<string, unknown> {
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
export function resetSkip(): void {
  logVerbose('Resetting skip functionality');

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