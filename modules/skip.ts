/**
 * Basic skip functionality module
 */

import { SELECTORS } from '../config.js';
import { 
  logVerbose, 
  getAttrValue, 
  delegateEvent
} from './utils.js';
import { FormState } from './formState.js';
import { formEvents } from './events.js';

let initialized = false;
let cleanupFunctions: (() => void)[] = [];

/**
 * Initialize basic skip functionality
 */
export function initSkip(root: Document | Element = document): void {
  if (initialized) {
    logVerbose('Skip module already initialized, cleaning up first');
    resetSkip();
  }

  logVerbose('Initializing basic skip functionality');

  // Set up event listeners
  setupSkipListeners(root);

  initialized = true;
  logVerbose('Skip initialization complete');
  
  // Register this module as initialized
  formEvents.registerModule('skip');
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
 * Handle skip button click with basic logic
 */
function handleSkipButtonClick(event: Event, target: Element): void {
  event.preventDefault();
  
  if (!initialized) {
    logVerbose('Skip module not initialized, ignoring skip button click');
    return;
  }
  
  // Get the data-skip value - this MUST match a data-answer value
  const dataSkip = getAttrValue(target, 'data-skip');
  
  // Validate that data-skip has a value
  if (!dataSkip || dataSkip === 'true' || dataSkip === '') {
    logVerbose('Invalid data-skip value - must specify target step', { dataSkip });
    return;
  }
  
  // Verify the target step exists in the DOM
  const targetElement = document.querySelector(`[data-answer="${dataSkip}"]`);
  
  if (!targetElement) {
    logVerbose('Target step not found in DOM', { targetStepId: dataSkip });
    return;
  }
  
  const currentStepId = FormState.getCurrentStep();
  if (!currentStepId) {
    logVerbose('No current step found for skip operation');
    return;
  }

  logVerbose('Processing skip request', {
    currentStepId,
    targetStepId: dataSkip
  });
  
  // Emit skip request event to navigate to target step
  formEvents.emit('skip:request', { targetStepId: dataSkip });
}

/**
 * Skip a specific step (basic functionality)
 */
export function skipStep(stepId: string): boolean {
  if (!initialized) {
    logVerbose('Skip module not initialized, cannot skip step');
    return false;
  }

  if (!stepId) {
    logVerbose('Invalid stepId provided to skipStep');
    return false;
  }

  logVerbose(`Skipping step: ${stepId}`);
  return true;
}

/**
 * Get skip state for debugging
 */
export function getSkipState(): Record<string, unknown> {
  return {
    initialized
  };
}

/**
 * Reset skip functionality
 */
export function resetSkip(): void {
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

  initialized = false;
  logVerbose('Skip reset complete');
} 