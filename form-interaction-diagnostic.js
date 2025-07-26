/**
 * Form Interaction Diagnostic Script
 * Diagnoses and fixes form field click event conflicts
 * 
 * Run this in browser console to identify the click event issue
 */

console.log('🔧 === FORM INTERACTION DIAGNOSTIC ===');
console.log('📅 Diagnostic Date:', new Date().toISOString());

// Global diagnostic results
const interactionDiagnostic = {
  eventListeners: {},
  conflicts: [],
  solutions: []
};

/**
 * SECTION 1: Event Listener Analysis
 */
function analyzeEventListeners() {
  console.log('\n🎯 === EVENT LISTENER ANALYSIS ===');
  
  // Check form fields
  const formFields = document.querySelectorAll('input, select, textarea');
  console.log('📝 Total form fields found:', formFields.length);
  
  // Check what elements have click listeners
  const elementsWithClickListeners = [];
  
  // Check form field containers
  const fieldContainers = document.querySelectorAll('.form-field_wrapper, .multi-form_field-wrapper');
  fieldContainers.forEach((container, index) => {
    if (index < 5) { // Check first 5
      const clickListeners = getEventListeners ? getEventListeners(container) : 'getEventListeners not available';
      console.log(`🔍 Field Container ${index}:`, {
        className: container.className,
        hasClickListener: clickListeners && clickListeners.click ? clickListeners.click.length : 'unknown',
        clickListeners: clickListeners
      });
    }
  });
  
  // Check step wrappers for click listeners
  const stepWrappers = document.querySelectorAll('.step_wrapper[data-answer]');
  stepWrappers.forEach((wrapper, index) => {
    if (index < 3) { // Check first 3 steps
      const stepId = wrapper.getAttribute('data-answer');
      const clickListeners = getEventListeners ? getEventListeners(wrapper) : 'getEventListeners not available';
      console.log(`🎭 Step ${stepId}:`, {
        hasClickListener: clickListeners && clickListeners.click ? clickListeners.click.length : 'unknown',
        clickListeners: clickListeners
      });
    }
  });
  
  // Check document-level event listeners
  const docListeners = getEventListeners ? getEventListeners(document) : 'getEventListeners not available';
  console.log('📄 Document event listeners:', docListeners);
}

/**
 * SECTION 2: Click Event Path Analysis
 */
function analyzeClickPath() {
  console.log('\n🛤️ === CLICK PATH ANALYSIS ===');
  
  // Add temporary click listener to analyze event path
  const testClickHandler = (event) => {
    console.log('🖱️ CLICK EVENT DETECTED:', {
      target: event.target,
      currentTarget: event.currentTarget,
      eventPath: event.composedPath ? event.composedPath().map(el => ({
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        dataAttributes: el.dataset
      })) : 'composedPath not available',
      bubbles: event.bubbles,
      cancelable: event.cancelable,
      defaultPrevented: event.defaultPrevented
    });
    
    // Don't interfere with the actual event
    // event.stopPropagation();
  };
  
  // Add listener to document to catch all clicks
  document.addEventListener('click', testClickHandler, true);
  
  console.log('👂 Click path analyzer added - click on a form field to see the event path');
  
  // Store the handler for removal
  window.removeClickAnalyzer = () => {
    document.removeEventListener('click', testClickHandler, true);
    console.log('🗑️ Click analyzer removed');
  };
}

/**
 * SECTION 3: Form Field Focus Analysis
 */
function analyzeFocusEvents() {
  console.log('\n👁️ === FOCUS EVENT ANALYSIS ===');
  
  const formFields = document.querySelectorAll('input, select, textarea');
  
  formFields.forEach((field, index) => {
    if (index < 5) { // First 5 fields
      const focusListeners = getEventListeners ? getEventListeners(field) : 'getEventListeners not available';
      console.log(`📝 Field ${index} (${field.type || field.tagName}):`, {
        name: field.name,
        id: field.id,
        className: field.className,
        focusListeners: focusListeners && focusListeners.focus ? focusListeners.focus.length : 'unknown',
        clickListeners: focusListeners && focusListeners.click ? focusListeners.click.length : 'unknown'
      });
    }
  });
  
  // Add focus event analyzer
  const focusHandler = (event) => {
    console.log('🎯 FOCUS EVENT:', {
      target: event.target,
      type: event.type,
      fieldName: event.target.name,
      fieldValue: event.target.value
    });
  };
  
  document.addEventListener('focus', focusHandler, true);
  document.addEventListener('focusin', focusHandler, true);
  
  window.removeFocusAnalyzer = () => {
    document.removeEventListener('focus', focusHandler, true);
    document.removeEventListener('focusin', focusHandler, true);
    console.log('🗑️ Focus analyzer removed');
  };
}

/**
 * SECTION 4: Step Progression Trigger Detection
 */
function detectStepProgressionTriggers() {
  console.log('\n🚨 === STEP PROGRESSION TRIGGER DETECTION ===');
  
  // Monitor FormLib methods if available
  if (window.FormLib) {
    // Try to intercept navigation calls
    const originalGoToStep = window.FormLib.goToStep;
    const originalGoToStepById = window.FormLib.goToStepById;
    
    if (originalGoToStep) {
      window.FormLib.goToStep = function(...args) {
        console.log('🚨 STEP PROGRESSION TRIGGERED - goToStep:', args);
        console.trace('Call stack:');
        return originalGoToStep.apply(this, args);
      };
    }
    
    if (originalGoToStepById) {
      window.FormLib.goToStepById = function(...args) {
        console.log('🚨 STEP PROGRESSION TRIGGERED - goToStepById:', args);
        console.trace('Call stack:');
        return originalGoToStepById.apply(this, args);
      };
    }
    
    console.log('🔍 Step progression monitoring enabled');
  }
  
  // Look for radio button changes that might trigger progression
  const radioButtons = document.querySelectorAll('input[type="radio"]');
  console.log('📻 Radio buttons found:', radioButtons.length);
  
  radioButtons.forEach((radio, index) => {
    if (index < 10) { // First 10
      console.log(`📻 Radio ${index}:`, {
        name: radio.name,
        value: radio.value,
        checked: radio.checked,
        dataAnswer: radio.getAttribute('data-answer'),
        hasChangeListener: getEventListeners ? 
          (getEventListeners(radio).change ? getEventListeners(radio).change.length : 0) : 'unknown'
      });
    }
  });
}

/**
 * SECTION 5: Potential Fix Implementation
 */
function implementPotentialFix() {
  console.log('\n🔧 === IMPLEMENTING POTENTIAL FIX ===');
  
  // Stop event propagation on form fields to prevent unwanted step progression
  const formFields = document.querySelectorAll('input, select, textarea');
  
  const fieldClickHandler = (event) => {
    // Only stop propagation for form interactions, not navigation
    if (event.target.matches('input, select, textarea')) {
      console.log('🛡️ Protecting form field interaction:', event.target.name || event.target.id);
      event.stopPropagation();
    }
  };
  
  // Add protective click handler
  formFields.forEach(field => {
    field.addEventListener('click', fieldClickHandler, true);
    field.addEventListener('focus', fieldClickHandler, true);
  });
  
  console.log('🛡️ Form field protection applied to', formFields.length, 'fields');
  
  // Store cleanup function
  window.removeFieldProtection = () => {
    formFields.forEach(field => {
      field.removeEventListener('click', fieldClickHandler, true);
      field.removeEventListener('focus', fieldClickHandler, true);
    });
    console.log('🗑️ Form field protection removed');
  };
}

/**
 * SECTION 6: Navigation Button Isolation
 */
function isolateNavigationButtons() {
  console.log('\n🧭 === NAVIGATION BUTTON ISOLATION ===');
  
  // Ensure navigation buttons work properly
  const nextBtn = document.querySelector('[data-form="next-btn"]');
  const backBtn = document.querySelector('[data-form="back-btn"]');
  const skipBtns = document.querySelectorAll('[data-skip]');
  
  if (nextBtn) {
    console.log('➡️ Next button found:', nextBtn.className);
  }
  
  if (backBtn) {
    console.log('⬅️ Back button found:', backBtn.className);
  }
  
  console.log('⏭️ Skip buttons found:', skipBtns.length);
  
  // Make sure navigation buttons aren't affected by our fix
  [nextBtn, backBtn, ...skipBtns].forEach(btn => {
    if (btn) {
      btn.style.pointerEvents = 'auto';
      btn.style.zIndex = '1000';
    }
  });
}

/**
 * MAIN DIAGNOSTIC RUNNER
 */
function runInteractionDiagnostic() {
  console.log('🚀 Starting Form Interaction Diagnostic...\n');
  
  try {
    analyzeEventListeners();
    analyzeClickPath();
    analyzeFocusEvents();
    detectStepProgressionTriggers();
    
    console.log('\n🔧 === APPLYING PROTECTIVE MEASURES ===');
    implementPotentialFix();
    isolateNavigationButtons();
    
    console.log('\n📋 === DIAGNOSTIC SUMMARY ===');
    console.log('🔍 Event analysis complete');
    console.log('🛡️ Form field protection applied');
    console.log('🧭 Navigation buttons isolated');
    console.log('👂 Click and focus analyzers active');
    
    console.log('\n🧪 TEST INSTRUCTIONS:');
    console.log('1. Try clicking on a form field - it should NOT trigger step progression');
    console.log('2. Try typing in the form field - it should work normally');
    console.log('3. Try clicking next/back buttons - they should still work');
    console.log('4. Check console for event logs');
    
    console.log('\n🗑️ CLEANUP FUNCTIONS:');
    console.log('- window.removeClickAnalyzer() - Remove click path analyzer');
    console.log('- window.removeFocusAnalyzer() - Remove focus analyzer');
    console.log('- window.removeFieldProtection() - Remove field protection');
    
    return {
      status: 'completed',
      protectionApplied: true,
      analyzersActive: true
    };
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return { error: error.message };
  }
}

// Export functions for manual use
window.interactionDiagnostic = {
  runInteractionDiagnostic,
  analyzeEventListeners,
  analyzeClickPath,
  analyzeFocusEvents,
  detectStepProgressionTriggers,
  implementPotentialFix,
  isolateNavigationButtons
};

// Auto-run the diagnostic
console.log('🧪 Form Interaction Diagnostic Script Loaded');
console.log('📋 Run interactionDiagnostic.runInteractionDiagnostic() to start analysis');

// Auto-run
runInteractionDiagnostic(); 