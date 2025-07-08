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
  // Skip button handling - use the main SKIP selector for buttons with data-skip attribute
  const cleanup1 = delegateEvent(root, 'click', SELECTORS.SKIP, handleSkipButtonClick);

  cleanupFunctions.push(cleanup1);
}

/**
 * Handle skip button click with enhanced logic
 */
function handleSkipButtonClick(event: Event, target: Element): void {
  event.preventDefault();
  
  logVerbose('=== SKIP BUTTON CLICK START ===');
  logVerbose('Skip button clicked in skip module', {
    target: target,
    tagName: target.tagName,
    className: target.className,
    attributes: Array.from(target.attributes).map(attr => ({ name: attr.name, value: attr.value }))
  });
  
  const currentStepId = FormState.getCurrentStep();
  if (!currentStepId) {
    logVerbose('No current step found for skip operation');
    return;
  }

  const skipReason = getAttrValue(target, 'data-skip-reason') || 'User skipped';
  const allowUndo = getAttrValue(target, 'data-allow-skip-undo') !== 'false';
  const skipValue = getAttrValue(target, 'data-skip');

  logVerbose('=== SKIP BUTTON ANALYSIS ===', {
    currentStepId,
    skipReason,
    allowUndo,
    skipValue,
    hasSkipValue: !!skipValue && skipValue !== 'true' && skipValue !== '',
    rawSkipValue: skipValue,
    skipValueType: typeof skipValue,
    skipValueLength: skipValue?.length || 0
  });

  // Determine target step with detailed logging
  let targetStep: string | undefined;
  if (skipValue && skipValue !== 'true' && skipValue !== '') {
    targetStep = skipValue;
    logVerbose('Using data-skip as target', { targetStep });
  } else {
    logVerbose('No specific target found, will use next available step');
  }

  // Verify target step exists in DOM
  if (targetStep) {
    const targetElement = document.querySelector(`[data-answer="${targetStep}"]`);
    logVerbose('Target step verification', {
      targetStep,
      targetElementExists: !!targetElement,
      targetElement: targetElement ? {
        tagName: targetElement.tagName,
        id: targetElement.id,
        className: targetElement.className,
        dataAnswer: getAttrValue(targetElement, 'data-answer')
      } : null
    });
  }

  logVerbose('=== CALLING SKIP STEP FUNCTION ===', {
    stepId: currentStepId,
    reason: skipReason,
    allowUndo,
    targetStep
  });

  // Use skipStep function which has better navigation logic
  const success = skipStep(currentStepId, skipReason, allowUndo, targetStep);
  
  logVerbose('=== SKIP OPERATION RESULT ===', {
    success,
    finalCurrentStep: FormState.getCurrentStep()
  });
  
  if (!success) {
    logVerbose('Skip operation failed');
  }
  
  logVerbose('=== SKIP BUTTON CLICK END ===');
}

/**
 * Skip a specific step
 */
export function skipStep(stepId: string, reason?: string, allowUndo: boolean = true, targetStep?: string): boolean {
  logVerbose('=== SKIP STEP FUNCTION START ===');
  logVerbose(`Attempting to skip step: ${stepId}`, { reason, allowUndo, targetStep });

  // Check if step is already skipped
  if (FormState.isStepSkipped(stepId)) {
    logVerbose(`Step already skipped: ${stepId}`);
    return false;
  }

  // Clear fields in the step being skipped
  const fieldsCleared = clearStepFields(stepId);
  logVerbose('Fields cleared from skipped step', { fieldsCleared });
  
  // Add to skip tracking
  FormState.addSkippedStep(stepId, reason, allowUndo);
  logVerbose('Step added to skip tracking in FormState');
  
  // Update skip history with cleared fields
  const skipHistory = FormState.getSkipHistory();
  const latestEntry = skipHistory[skipHistory.length - 1];
  if (latestEntry && latestEntry.stepId === stepId) {
    latestEntry.fieldsCleared = fieldsCleared;
  }

  // Apply skip styling
  applySkipStyling(stepId, true);
  logVerbose('Skip styling applied');

  // Navigate to target step or next step
  logVerbose('=== NAVIGATION DECISION ===', {
    hasTargetStep: !!targetStep,
    targetStep,
    willNavigateToTarget: !!targetStep,
    willNavigateToNext: !targetStep
  });

  if (targetStep) {
    logVerbose('Navigating to specific target step', { targetStep });
    navigateToStep(targetStep);
  } else {
    logVerbose('No target step specified, navigating to next available step');
    navigateToNextAvailableStep();
  }

  logVerbose(`=== SKIP STEP FUNCTION END ===`, {
    stepId,
    fieldsCleared: fieldsCleared.length,
    targetStep,
    success: true
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
 * Navigate to a specific step
 */
function navigateToStep(stepId: string): void {
  logVerbose('=== NAVIGATE TO STEP FUNCTION START ===');
  logVerbose(`Navigation requested to step: ${stepId}`);
  
  // Check if navigation function is available
  logVerbose('Navigation function availability', {
    goToStepByIdAvailable: !!goToStepById,
    goToStepByIdType: typeof goToStepById
  });

  // First, let's verify the target step exists in the DOM
  const targetElement = document.querySelector(`[data-answer="${stepId}"]`);
  const targetStepWrapper = document.querySelector(`.step_wrapper[data-answer="${stepId}"]`);
  
  logVerbose('Target step DOM verification', {
    targetStepId: stepId,
    targetElementExists: !!targetElement,
    targetStepWrapperExists: !!targetStepWrapper,
    targetElement: targetElement ? {
      tagName: targetElement.tagName,
      id: targetElement.id,
      className: targetElement.className,
      dataAnswer: targetElement.getAttribute('data-answer')
    } : null,
    targetStepWrapper: targetStepWrapper ? {
      tagName: targetStepWrapper.tagName,
      id: targetStepWrapper.id,
      className: targetStepWrapper.className,
      dataAnswer: targetStepWrapper.getAttribute('data-answer')
    } : null
  });

  if (goToStepById) {
    logVerbose(`Calling goToStepById with stepId: ${stepId}`);
    
    // Get current step before navigation
    const currentStepBefore = FormState.getCurrentStep();
    logVerbose('State before navigation', { currentStepBefore });
    
    // Call the navigation function
    goToStepById(stepId);
    
    // Get current step after navigation
    const currentStepAfter = FormState.getCurrentStep();
    logVerbose('State after navigation', { 
      currentStepAfter,
      navigationSuccessful: currentStepAfter === stepId,
      expectedStep: stepId,
      actualStep: currentStepAfter
    });
    
    // If navigation failed, let's try to understand why
    if (currentStepAfter !== stepId) {
      logVerbose('❌ NAVIGATION FAILED - DEBUGGING', {
        expectedStep: stepId,
        actualStep: currentStepAfter,
        targetElementExists: !!targetElement,
        targetStepWrapperExists: !!targetStepWrapper,
        possibleIssue: 'Step might not be properly initialized or goToStepById function has a bug'
      });
      
      // Let's try to find all steps with data-answer attributes
      const allStepsWithAnswers = document.querySelectorAll('[data-answer]');
      const stepAnswers = Array.from(allStepsWithAnswers).map(el => el.getAttribute('data-answer'));
      
      logVerbose('All available steps with data-answer', {
        totalSteps: allStepsWithAnswers.length,
        stepAnswers: stepAnswers,
        searchingFor: stepId,
        foundInList: stepAnswers.includes(stepId)
      });
    }
    
    logVerbose('=== NAVIGATE TO STEP FUNCTION END ===');
  } else {
    logVerbose(`ERROR: Navigation requested to step: ${stepId}, but goToStepById is not set.`);
    logVerbose('=== NAVIGATE TO STEP FUNCTION END (FAILED) ===');
  }
}

/**
 * Navigate to the next available (non-skipped) step
 */
function navigateToNextAvailableStep(): void {
  logVerbose('Finding next available step...');
  
  // Get current step info
  const currentStepId = FormState.getCurrentStep();
  if (!currentStepId) {
    logVerbose('No current step found for navigation');
    return;
  }

  // Find all steps in the form
  const allSteps = Array.from(document.querySelectorAll(SELECTORS.STEP));
  const stepIds: string[] = [];
  
  allSteps.forEach(stepElement => {
    const stepId = getAttrValue(stepElement, 'data-answer');
    if (stepId) {
      stepIds.push(stepId);
    }
  });

  logVerbose('Available steps for navigation', {
    currentStepId,
    allStepIds: stepIds,
    totalSteps: stepIds.length
  });

  // Find current step index
  const currentIndex = stepIds.indexOf(currentStepId);
  if (currentIndex === -1) {
    logVerbose(`Current step ${currentStepId} not found in step list`);
    return;
  }

  // Look for next non-skipped step
  for (let i = currentIndex + 1; i < stepIds.length; i++) {
    const nextStepId = stepIds[i];
    const isSkipped = FormState.isStepSkipped(nextStepId);
    const isVisible = FormState.isStepVisible(nextStepId);
    
    logVerbose(`Checking step ${nextStepId}`, {
      index: i,
      isSkipped,
      isVisible,
      stepId: nextStepId
    });

    if (!isSkipped) {
      logVerbose(`Found next available step: ${nextStepId}`);
      navigateToStep(nextStepId);
      return;
    }
  }

  // If no next step found, try using the simple next step function
  logVerbose('No specific next step found, using default navigation');
  if (goToNextStep) {
    goToNextStep();
  } else {
    logVerbose('Navigation requested to next available step, but goToNextStep is not set.');
  }
}

/**
 * Check if a step can be skipped
 */
export function canSkipStep(stepId: string): boolean {
  return FormState.isStepSkipped(stepId);
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