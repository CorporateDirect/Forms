/**
 * DIAGNOSTIC Multi-step navigation - ULTRA-VERBOSE LOGGING
 * This version logs EVERYTHING to help diagnose the persistent visibility issues
 */

import { SELECTORS } from '../config.js';
import { logVerbose, queryAllByAttr, getAttrValue, delegateEvent } from './utils.js';

interface DiagnosticStep {
  element: HTMLElement;
  id: string;
  index: number;
}

let initialized = false;
let steps: DiagnosticStep[] = [];
let currentStepIndex = 0;
let debugMode = true;

function log(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  console.log(`🔍 [DIAGNOSTIC ${timestamp}] ${message}`, data || '');
}

function logError(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  console.error(`❌ [DIAGNOSTIC ${timestamp}] ${message}`, data || '');
}

function logDOM(element: HTMLElement, action: string): void {
  const computedStyle = getComputedStyle(element);
  log(`DOM ${action}:`, {
    element: element.tagName,
    id: element.id,
    className: element.className,
    inlineStyles: {
      display: element.style.display,
      visibility: element.style.visibility,
      opacity: element.style.opacity
    },
    computedStyles: {
      display: computedStyle.display,
      visibility: computedStyle.visibility,
      opacity: computedStyle.opacity,
      position: computedStyle.position,
      zIndex: computedStyle.zIndex
    },
    dimensions: {
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight
    },
    parentInfo: {
      tagName: element.parentElement?.tagName,
      id: element.parentElement?.id,
      className: element.parentElement?.className
    }
  });
}

/**
 * DIAGNOSTIC: Initialize with maximum logging
 */
export function initMultiStepDiagnostic(root: Document | Element = document): void {
  log('=== DIAGNOSTIC INITIALIZATION START ===');
  log('Root element:', {
    isDocument: root === document,
    elementType: root.constructor.name,
    hasQuerySelector: typeof root.querySelector === 'function'
  });

  // Check for existing form libraries
  log('Checking for existing form libraries:', {
    window_FormLib: typeof (window as any).FormLib,
    window_formLibrary: typeof (window as any).formLibrary,
    existing_scripts: Array.from(document.scripts).map(s => s.src).filter(s => s.includes('form'))
  });

  // Find all steps with detailed analysis
  log('Searching for steps with selector:', SELECTORS.STEP);
  const stepElements = queryAllByAttr(SELECTORS.STEP, root);
  
  log('Step search results:', {
    selector: SELECTORS.STEP,
    foundCount: stepElements.length,
    allElementsWithDataForm: Array.from(document.querySelectorAll('[data-form]')).map(el => ({
      tagName: el.tagName,
      id: el.id,
      className: el.className,
      dataForm: el.getAttribute('data-form')
    }))
  });

  if (stepElements.length === 0) {
    logError('No steps found - detailed analysis:', {
      searchRoot: root === document ? 'document' : 'custom element',
      allDataFormElements: document.querySelectorAll('[data-form]').length,
      allStepWrappers: document.querySelectorAll('.step_wrapper').length,
      allMultiFormSteps: document.querySelectorAll('.multi-form_step').length,
      possibleStepElements: Array.from(document.querySelectorAll('div')).filter(el => 
        el.className.includes('step') || el.id.includes('step')
      ).map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className
      }))
    });
    return;
  }
  
  // Analyze each step in detail
  steps = Array.from(stepElements).map((element, index) => {
    log(`Analyzing step ${index}:`);
    logDOM(element as HTMLElement, `STEP_${index}_INITIAL`);
    
    const stepWrapper = element.querySelector('.step_wrapper[data-answer]');
    const dataAnswer = stepWrapper ? 
      getAttrValue(stepWrapper, 'data-answer') : 
      getAttrValue(element, 'data-answer');
    
    log(`Step ${index} data-answer analysis:`, {
      hasStepWrapper: !!stepWrapper,
      stepWrapperDataAnswer: stepWrapper ? getAttrValue(stepWrapper, 'data-answer') : null,
      directDataAnswer: getAttrValue(element, 'data-answer'),
      finalDataAnswer: dataAnswer || `step-${index}`,
      allAttributes: Array.from(element.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      }))
    });
    
    return {
      element: element as HTMLElement,
      id: dataAnswer || `step-${index}`,
      index
    };
  });
  
  log('All steps registered:', {
    totalSteps: steps.length,
    stepMapping: steps.map((s, i) => ({
      index: i,
      id: s.id,
      element: {
        tagName: s.element.tagName,
        id: s.element.id,
        className: s.element.className
      }
    }))
  });
  
  // Check for potential conflicts
  checkForConflicts();
  
  // Initial hiding with detailed logging
  log('=== INITIAL STEP HIDING ===');
  hideAllStepsDiagnostic();
  
  // Show first step
  log('=== SHOWING FIRST STEP ===');
  showStepDiagnostic(0);
  
  // Setup radio listeners with detailed logging
  setupRadioListenersDiagnostic(root);
  
  initialized = true;
  log('=== DIAGNOSTIC INITIALIZATION COMPLETE ===', {
    initialized,
    totalSteps: steps.length,
    currentStepIndex,
    currentStepId: steps[currentStepIndex]?.id
  });
}

function checkForConflicts(): void {
  log('=== CHECKING FOR CONFLICTS ===');
  
  // Check for multiple event listeners
  const radioButtons = document.querySelectorAll('input[type="radio"][data-go-to]');
  log('Radio buttons found:', {
    count: radioButtons.length,
    details: Array.from(radioButtons).map((radio, i) => {
      const htmlRadio = radio as HTMLInputElement;
      return {
        index: i,
        name: htmlRadio.name,
        value: htmlRadio.value,
        dataGoTo: radio.getAttribute('data-go-to'),
        hasListeners: htmlRadio.onclick !== null || htmlRadio.onchange !== null
      };
    })
  });
  
  // Check for CSS conflicts
  const hiddenSteps = document.querySelectorAll('[data-form="step"]');
  hiddenSteps.forEach((step, i) => {
    const computed = getComputedStyle(step as HTMLElement);
    if (computed.display === 'none' || computed.visibility === 'hidden') {
      log(`Step ${i} already hidden by CSS:`, {
        element: step,
        computedDisplay: computed.display,
        computedVisibility: computed.visibility,
        possibleCSSRules: 'Check for conflicting CSS'
      });
    }
  });
  
  // Check for other form libraries
  log('Window object analysis:', {
    FormLib: typeof (window as any).FormLib,
    formLibrary: typeof (window as any).formLibrary,
    jQuery: typeof (window as any).$,
    webflow: typeof (window as any).Webflow,
    allFormLibKeys: Object.keys(window as any).filter((key: string) => key.toLowerCase().includes('form'))
  });
}

function hideAllStepsDiagnostic(): void {
  log('Hiding all steps - BEFORE state:');
  steps.forEach((step, i) => {
    logDOM(step.element, `BEFORE_HIDE_${i}`);
  });
  
  steps.forEach((step, i) => {
    log(`Hiding step ${i} (${step.id}):`);
    
    // Record before state
    const beforeState = {
      display: step.element.style.display,
      visibility: step.element.style.visibility,
      computedDisplay: getComputedStyle(step.element).display,
      isVisible: step.element.offsetHeight > 0
    };
    
    // Apply hiding
    step.element.style.setProperty('display', 'none', 'important');
    step.element.style.setProperty('visibility', 'hidden', 'important');
    
    // Record after state
    const afterState = {
      display: step.element.style.display,
      visibility: step.element.style.visibility,
      computedDisplay: getComputedStyle(step.element).display,
      isVisible: step.element.offsetHeight > 0
    };
    
    log(`Step ${i} hide result:`, {
      stepId: step.id,
      before: beforeState,
      after: afterState,
      hideSuccessful: afterState.isVisible === false
    });
    
    logDOM(step.element, `AFTER_HIDE_${i}`);
  });
}

function showStepDiagnostic(stepIndex: number): void {
  if (stepIndex < 0 || stepIndex >= steps.length) {
    logError('Invalid step index:', { stepIndex, totalSteps: steps.length });
    return;
  }
  
  const step = steps[stepIndex];
  log(`=== SHOWING STEP ${stepIndex} (${step.id}) ===`);
  
  // Hide all others first
  log('Hiding all other steps first...');
  hideAllStepsDiagnostic();
  
  // Record before state
  logDOM(step.element, `BEFORE_SHOW_${stepIndex}`);
  
  // Apply showing with maximum force
  log(`Applying show styles to step ${stepIndex}:`);
  step.element.style.setProperty('display', 'block', 'important');
  step.element.style.setProperty('visibility', 'visible', 'important');
  step.element.style.setProperty('opacity', '1', 'important');
  
  // Force layout recalculation
  step.element.offsetHeight; // Force reflow
  
  // Record after state
  logDOM(step.element, `AFTER_SHOW_${stepIndex}`);
  
  // Verify visibility
  const isNowVisible = step.element.offsetHeight > 0 && step.element.offsetWidth > 0;
  log(`Step ${stepIndex} show result:`, {
    stepId: step.id,
    isVisible: isNowVisible,
    offsetHeight: step.element.offsetHeight,
    offsetWidth: step.element.offsetWidth,
    computedDisplay: getComputedStyle(step.element).display,
    computedVisibility: getComputedStyle(step.element).visibility
  });
  
  if (!isNowVisible) {
    logError(`STEP ${stepIndex} FAILED TO SHOW!`, {
      stepId: step.id,
      possibleCauses: [
        'CSS override with higher specificity',
        'Parent element hidden',
        'JavaScript interference',
        'Layout engine issue'
      ]
    });
    
    // Check parent elements
    let parent = step.element.parentElement;
    let parentLevel = 0;
    while (parent && parentLevel < 5) {
      logDOM(parent, `PARENT_${parentLevel}`);
      parent = parent.parentElement;
      parentLevel++;
    }
  }
  
  currentStepIndex = stepIndex;
}

export function goToStepByIdDiagnostic(stepId: string): void {
  log(`=== NAVIGATION REQUEST: ${stepId} ===`);
  
  const stepIndex = steps.findIndex(step => step.id === stepId);
  
  if (stepIndex === -1) {
    logError('Step not found:', {
      searchedFor: stepId,
      availableSteps: steps.map(s => s.id),
      totalSteps: steps.length,
      suggestion: 'Check data-answer attributes match exactly'
    });
    return;
  }
  
  log(`Found step ${stepId} at index ${stepIndex}, navigating...`);
  showStepDiagnostic(stepIndex);
}

function setupRadioListenersDiagnostic(root: Document | Element): void {
  log('=== SETTING UP RADIO LISTENERS ===');
  
  const radioButtons = document.querySelectorAll('input[type="radio"][data-go-to]');
  log('Found radio buttons:', {
    count: radioButtons.length,
    buttons: Array.from(radioButtons).map((radio, i) => ({
      index: i,
      name: (radio as HTMLInputElement).name,
      value: (radio as HTMLInputElement).value,
      dataGoTo: radio.getAttribute('data-go-to'),
      id: radio.id,
      className: radio.className
    }))
  });
  
  const cleanup = delegateEvent(root, 'change', 'input[type="radio"][data-go-to]', (event, target) => {
    log('=== RADIO BUTTON EVENT TRIGGERED ===');
    const radio = target as HTMLInputElement;
    
    log('Radio button analysis:', {
      eventType: event.type,
      radioName: radio.name,
      radioValue: radio.value,
      isChecked: radio.checked,
      dataGoTo: getAttrValue(radio, 'data-go-to'),
      eventTarget: event.target,
      eventCurrentTarget: event.currentTarget,
      timestamp: new Date().toISOString()
    });
    
    if (!radio.checked) {
      log('Radio not checked, ignoring event');
      return;
    }
    
    const goToValue = getAttrValue(radio, 'data-go-to');
    
    if (!goToValue) {
      logError('Radio button missing data-go-to attribute');
      return;
    }
    
    log('Processing radio navigation:', {
      from: steps[currentStepIndex]?.id,
      to: goToValue,
      radioGroup: radio.name
    });
    
    // Apply radio styling
    applyRadioStylingDiagnostic(radio);
    
    // Navigate
    log('About to navigate...');
    goToStepByIdDiagnostic(goToValue);
    
    log('=== RADIO BUTTON EVENT COMPLETE ===');
  });
  
  log('Radio listeners setup complete');
}

function applyRadioStylingDiagnostic(selectedRadio: HTMLInputElement): void {
  log('=== APPLYING RADIO STYLING ===');
  const groupName = selectedRadio.name;
  if (!groupName) return;
  
  const activeClass = 'is-active-inputactive';
  
  // Remove from all in group
  const groupRadios = document.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
  log('Radio group styling:', {
    groupName,
    groupSize: groupRadios.length,
    activeClass
  });
  
  groupRadios.forEach((radio, i) => {
    const r = radio as HTMLInputElement;
    const label = r.closest('label');
    const wasActive = r.classList.contains(activeClass);
    
    r.classList.remove(activeClass);
    label?.classList.remove(activeClass);
    
    if (r === selectedRadio) {
      r.classList.add(activeClass);
      label?.classList.add(activeClass);
      log(`Applied active class to radio ${i}`);
    } else if (wasActive) {
      log(`Removed active class from radio ${i}`);
    }
  });
}

export function getDiagnosticState(): Record<string, unknown> {
  return {
    initialized,
    currentStepIndex,
    currentStepId: steps[currentStepIndex]?.id || 'none',
    totalSteps: steps.length,
    stepIds: steps.map(s => s.id),
    allStepsVisible: steps.map(s => ({
      id: s.id,
      isVisible: s.element.offsetHeight > 0,
      computedDisplay: getComputedStyle(s.element).display,
      computedVisibility: getComputedStyle(s.element).visibility
    }))
  };
}

// Expose diagnostic functions globally for manual testing
if (typeof window !== 'undefined') {
  (window as any).FormLibDiagnostic = {
    showStep: showStepDiagnostic,
    hideAll: hideAllStepsDiagnostic,
    goToStep: goToStepByIdDiagnostic,
    getState: getDiagnosticState,
    checkConflicts: checkForConflicts,
    logAllSteps: () => steps.forEach((s, i) => logDOM(s.element, `MANUAL_CHECK_${i}`))
  };
} 