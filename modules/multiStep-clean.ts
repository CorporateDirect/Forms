/**
 * ULTRA-MINIMAL Multi-step navigation - Zero Legacy Code
 * Focus: Show target step, hide all others. Nothing else.
 */

import { SELECTORS } from '../config.js';
import { logVerbose, queryAllByAttr, getAttrValue, delegateEvent } from './utils.js';

interface SimpleStep {
  element: HTMLElement;
  id: string;
  index: number;
}

let initialized = false;
let steps: SimpleStep[] = [];
let currentStepIndex = 0;

/**
 * ULTRA-MINIMAL: Initialize with zero complexity
 */
export function initMultiStepClean(root: Document | Element = document): void {
  console.log('🚀 [CLEAN] Ultra-minimal initialization starting...');
  
  // Find all steps
  const stepElements = queryAllByAttr(SELECTORS.STEP, root);
  
  if (stepElements.length === 0) {
    console.error('❌ [CLEAN] No steps found');
    return;
  }
  
  // Create simple step array
  steps = Array.from(stepElements).map((element, index) => {
    const stepWrapper = element.querySelector('.step_wrapper[data-answer]');
    const dataAnswer = stepWrapper ? 
      getAttrValue(stepWrapper, 'data-answer') : 
      getAttrValue(element, 'data-answer');
    
    return {
      element: element as HTMLElement,
      id: dataAnswer || `step-${index}`,
      index
    };
  });
  
  console.log('✅ [CLEAN] Steps registered:', steps.map(s => s.id));
  
  // DEAD SIMPLE: Hide all, show first
  hideAllSteps();
  showStep(0);
  
  // Listen for radio buttons
  setupRadioListeners(root);
  
  initialized = true;
  console.log('✅ [CLEAN] Initialization complete');
}

/**
 * ULTRA-MINIMAL: Hide all steps (brute force)
 */
function hideAllSteps(): void {
  steps.forEach(step => {
    step.element.style.display = 'none';
    step.element.style.visibility = 'hidden';
    console.log(`🙈 [CLEAN] Hiding: ${step.id}`);
  });
}

/**
 * ULTRA-MINIMAL: Show specific step (brute force)
 */
function showStep(stepIndex: number): void {
  if (stepIndex < 0 || stepIndex >= steps.length) {
    console.error('❌ [CLEAN] Invalid step index:', stepIndex);
    return;
  }
  
  const step = steps[stepIndex];
  
  // BRUTE FORCE: Hide all first
  hideAllSteps();
  
  // BRUTE FORCE: Show target step with !important
  step.element.style.setProperty('display', 'block', 'important');
  step.element.style.setProperty('visibility', 'visible', 'important');
  step.element.style.setProperty('opacity', '1', 'important');
  
  currentStepIndex = stepIndex;
  
  console.log(`✅ [CLEAN] Showing: ${step.id} at index ${stepIndex}`);
}

/**
 * ULTRA-MINIMAL: Go to step by ID
 */
export function goToStepByIdClean(stepId: string): void {
  console.log(`🎯 [CLEAN] Navigate to: ${stepId}`);
  
  const stepIndex = steps.findIndex(step => step.id === stepId);
  
  if (stepIndex === -1) {
    console.error('❌ [CLEAN] Step not found:', stepId);
    console.log('Available steps:', steps.map(s => s.id));
    return;
  }
  
  showStep(stepIndex);
}

/**
 * ULTRA-MINIMAL: Radio button handling
 */
function setupRadioListeners(root: Document | Element): void {
  const cleanup = delegateEvent(root, 'change', 'input[type="radio"][data-go-to]', (event, target) => {
    const radio = target as HTMLInputElement;
    
    if (!radio.checked) return;
    
    const goToValue = getAttrValue(radio, 'data-go-to');
    
    if (!goToValue) {
      console.warn('⚠️ [CLEAN] Radio missing data-go-to');
      return;
    }
    
    console.log(`🔘 [CLEAN] Radio clicked: ${radio.name} → ${goToValue}`);
    
    // Apply simple styling
    applyRadioStyling(radio);
    
    // Navigate
    goToStepByIdClean(goToValue);
  });
  
  console.log('✅ [CLEAN] Radio listeners setup');
}

/**
 * ULTRA-MINIMAL: Radio styling
 */
function applyRadioStyling(selectedRadio: HTMLInputElement): void {
  const groupName = selectedRadio.name;
  if (!groupName) return;
  
  const activeClass = 'is-active-inputactive';
  
  // Remove from all in group
  document.querySelectorAll(`input[type="radio"][name="${groupName}"]`).forEach(radio => {
    const r = radio as HTMLInputElement;
    const label = r.closest('label');
    r.classList.remove(activeClass);
    label?.classList.remove(activeClass);
  });
  
  // Add to selected
  selectedRadio.classList.add(activeClass);
  const parentLabel = selectedRadio.closest('label');
  parentLabel?.classList.add(activeClass);
  
  console.log(`🎨 [CLEAN] Styled radio: ${selectedRadio.name}`);
}

/**
 * ULTRA-MINIMAL: Get current state
 */
export function getCleanState(): Record<string, unknown> {
  return {
    initialized,
    currentStepIndex,
    currentStepId: steps[currentStepIndex]?.id || 'none',
    totalSteps: steps.length,
    stepIds: steps.map(s => s.id)
  };
} 