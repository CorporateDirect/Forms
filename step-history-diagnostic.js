/**
 * Step History & Navigation Diagnostic Script
 * Diagnoses step tracking, history, and back button functionality
 * 
 * Run this in browser console to analyze step navigation issues
 */

console.log('📚 === STEP HISTORY & NAVIGATION DIAGNOSTIC ===');
console.log('📅 Diagnostic Date:', new Date().toISOString());

/**
 * SECTION 1: Step History Analysis
 */
function analyzeStepHistory() {
  console.log('\n📚 === STEP HISTORY ANALYSIS ===');
  
  if (!window.FormLib) {
    console.log('❌ FormLib not available for history analysis');
    return;
  }
  
  try {
    // Try to get current state
    const currentState = window.FormLib.getState();
    console.log('📊 Current FormLib State:', currentState);
    
    // Try to get navigated steps if available
    if (window.FormLib.getNavigatedSteps) {
      const navigatedSteps = window.FormLib.getNavigatedSteps();
      console.log('🗺️ Navigated Steps:', navigatedSteps);
    } else {
      console.log('⚠️ getNavigatedSteps method not available');
    }
    
    // Try to debug step system
    if (window.FormLib.debugStepSystem) {
      console.log('🔍 Running step system debug...');
      window.FormLib.debugStepSystem();
    } else {
      console.log('⚠️ debugStepSystem method not available');
    }
    
  } catch (error) {
    console.log('❌ Error accessing FormLib state:', error.message);
  }
}

/**
 * SECTION 2: Back Button Event Analysis
 */
function analyzeBackButtonEvents() {
  console.log('\n⬅️ === BACK BUTTON EVENT ANALYSIS ===');
  
  const backBtn = document.querySelector('[data-form="back-btn"]');
  
  if (!backBtn) {
    console.log('❌ Back button not found');
    return;
  }
  
  console.log('✅ Back button found:', {
    element: backBtn.tagName,
    className: backBtn.className,
    dataForm: backBtn.getAttribute('data-form'),
    innerHTML: backBtn.innerHTML.substring(0, 50) + '...',
    disabled: backBtn.disabled,
    pointerEvents: getComputedStyle(backBtn).pointerEvents,
    display: getComputedStyle(backBtn).display,
    visibility: getComputedStyle(backBtn).visibility
  });
  
  // Check for existing event listeners
  const listeners = getEventListeners ? getEventListeners(backBtn) : 'getEventListeners not available';
  console.log('🎧 Back button event listeners:', listeners);
  
  // Add test click listener to see if clicks are being captured
  const testClickHandler = (event) => {
    console.log('🖱️ BACK BUTTON CLICK CAPTURED:', {
      target: event.target,
      currentTarget: event.currentTarget,
      bubbles: event.bubbles,
      cancelable: event.cancelable,
      defaultPrevented: event.defaultPrevented,
      propagationStopped: event.cancelBubble,
      timestamp: event.timeStamp
    });
    
    // Don't interfere with the actual click
    console.log('📍 Event will continue to other handlers...');
  };
  
  // Add test listener in capture phase
  backBtn.addEventListener('click', testClickHandler, true);
  
  console.log('👂 Test click listener added to back button');
  
  // Store cleanup function
  window.removeBackButtonTest = () => {
    backBtn.removeEventListener('click', testClickHandler, true);
    console.log('🗑️ Back button test listener removed');
  };
}

/**
 * SECTION 3: Current Step Detection
 */
function analyzeCurrentStep() {
  console.log('\n📍 === CURRENT STEP ANALYSIS ===');
  
  // Find currently visible step
  const allSteps = document.querySelectorAll('.step_wrapper[data-answer]');
  const visibleSteps = [];
  const activeSteps = [];
  
  allSteps.forEach((step, index) => {
    const stepId = step.getAttribute('data-answer');
    const isVisible = getComputedStyle(step).display !== 'none' && 
                     getComputedStyle(step).visibility !== 'hidden';
    const hasActiveClass = step.classList.contains('active-step');
    
    if (isVisible) visibleSteps.push({ index, stepId, element: step });
    if (hasActiveClass) activeSteps.push({ index, stepId, element: step });
    
    if (index < 3) { // Log first 3 steps for reference
      console.log(`📝 Step ${index} (${stepId}):`, {
        isVisible,
        hasActiveClass,
        display: getComputedStyle(step).display,
        visibility: getComputedStyle(step).visibility
      });
    }
  });
  
  console.log('👁️ Currently visible steps:', visibleSteps.map(s => s.stepId));
  console.log('⭐ Steps with active-step class:', activeSteps.map(s => s.stepId));
  
  if (visibleSteps.length === 1) {
    console.log('✅ Proper progressive disclosure - only one step visible');
    return visibleSteps[0];
  } else if (visibleSteps.length === 0) {
    console.log('❌ No steps visible - major issue!');
    return null;
  } else {
    console.log('⚠️ Multiple steps visible - potential issue');
    return visibleSteps[0]; // Return first visible
  }
}

/**
 * SECTION 4: Step Navigation Simulation
 */
function simulateStepNavigation() {
  console.log('\n🎮 === STEP NAVIGATION SIMULATION ===');
  
  const currentStep = analyzeCurrentStep();
  if (!currentStep) {
    console.log('❌ Cannot simulate navigation - no current step detected');
    return;
  }
  
  console.log('📍 Current step:', currentStep.stepId);
  
  // Try to use FormLib navigation methods
  if (window.FormLib) {
    console.log('🧪 Testing FormLib navigation methods...');
    
    // Test if we can go to next step
    if (window.FormLib.goToStep) {
      console.log('➡️ goToStep method available');
    } else {
      console.log('❌ goToStep method not available');
    }
    
    if (window.FormLib.goToStepById) {
      console.log('🎯 goToStepById method available');
    } else {
      console.log('❌ goToStepById method not available');
    }
    
    // Check if there's a history tracking issue
    console.log('📚 Checking for step history tracking...');
    
    // Look for step history in the state
    try {
      const state = window.FormLib.getState();
      if (state && state.multiStep) {
        console.log('📊 MultiStep state:', state.multiStep);
      }
    } catch (error) {
      console.log('⚠️ Could not access multiStep state:', error.message);
    }
  }
}

/**
 * SECTION 5: Manual Back Navigation Test
 */
function testManualBackNavigation() {
  console.log('\n🔄 === MANUAL BACK NAVIGATION TEST ===');
  
  const currentStep = analyzeCurrentStep();
  if (!currentStep || currentStep.stepId === 'step-0') {
    console.log('ℹ️ Already at step-0 or no current step - cannot test back navigation');
    return;
  }
  
  console.log('🧪 Testing manual back navigation...');
  
  // Try to manually determine previous step
  const currentIndex = parseInt(currentStep.stepId.split('-')[1]);
  const previousStepId = `step-${currentIndex - 1}`;
  
  console.log('🔍 Attempting to navigate back:', {
    currentStepId: currentStep.stepId,
    previousStepId: previousStepId,
    currentIndex: currentIndex
  });
  
  // Try to use FormLib to go back
  if (window.FormLib && window.FormLib.goToStepById) {
    try {
      console.log('⬅️ Attempting FormLib.goToStepById(' + previousStepId + ')');
      window.FormLib.goToStepById(previousStepId);
      console.log('✅ Manual back navigation attempted');
      
      // Check if it worked
      setTimeout(() => {
        const newCurrentStep = analyzeCurrentStep();
        console.log('📍 After manual navigation, current step:', newCurrentStep?.stepId);
      }, 500);
      
    } catch (error) {
      console.log('❌ Manual back navigation failed:', error.message);
    }
  } else {
    console.log('❌ Cannot test manual navigation - FormLib methods not available');
  }
}

/**
 * SECTION 6: Back Button Click Simulation
 */
function simulateBackButtonClick() {
  console.log('\n🖱️ === BACK BUTTON CLICK SIMULATION ===');
  
  const backBtn = document.querySelector('[data-form="back-btn"]');
  if (!backBtn) {
    console.log('❌ Cannot simulate - back button not found');
    return;
  }
  
  console.log('🎯 Simulating back button click...');
  
  // Record current step before click
  const currentStepBefore = analyzeCurrentStep();
  console.log('📍 Current step before click:', currentStepBefore?.stepId);
  
  // Simulate click
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  
  console.log('🖱️ Dispatching click event on back button...');
  const result = backBtn.dispatchEvent(clickEvent);
  console.log('📤 Click event dispatched, result:', result);
  
  // Check result after a delay
  setTimeout(() => {
    const currentStepAfter = analyzeCurrentStep();
    console.log('📍 Current step after click:', currentStepAfter?.stepId);
    
    if (currentStepBefore?.stepId === currentStepAfter?.stepId) {
      console.log('❌ Back button click had no effect - step did not change');
    } else {
      console.log('✅ Back button click worked - step changed');
    }
  }, 500);
}

/**
 * MAIN DIAGNOSTIC RUNNER
 */
function runStepHistoryDiagnostic() {
  console.log('🚀 Starting Step History & Navigation Diagnostic...\n');
  
  try {
    analyzeStepHistory();
    analyzeBackButtonEvents();
    const currentStep = analyzeCurrentStep();
    simulateStepNavigation();
    
    if (currentStep && currentStep.stepId !== 'step-0') {
      testManualBackNavigation();
      
      // Give user option to test back button click
      console.log('\n🎯 To test back button click simulation, run:');
      console.log('stepHistoryDiagnostic.simulateBackButtonClick()');
    }
    
    console.log('\n📋 === DIAGNOSTIC SUMMARY ===');
    console.log('📚 Step history analysis: Complete');
    console.log('⬅️ Back button events: Analyzed');
    console.log('📍 Current step: Detected');
    console.log('🧪 Navigation methods: Tested');
    
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Click the back button and check console for event messages');
    console.log('2. Run stepHistoryDiagnostic.simulateBackButtonClick() to test programmatically');
    console.log('3. Check if step history is being properly maintained');
    
    return {
      status: 'completed',
      currentStep: currentStep,
      backButtonFound: !!document.querySelector('[data-form="back-btn"]')
    };
    
  } catch (error) {
    console.error('❌ Step history diagnostic failed:', error);
    return { error: error.message };
  }
}

// Export functions
window.stepHistoryDiagnostic = {
  runStepHistoryDiagnostic,
  analyzeStepHistory,
  analyzeBackButtonEvents,
  analyzeCurrentStep,
  simulateStepNavigation,
  testManualBackNavigation,
  simulateBackButtonClick
};

// Auto-run the diagnostic
console.log('🧪 Step History & Navigation Diagnostic Script Loaded');
console.log('📋 Run stepHistoryDiagnostic.runStepHistoryDiagnostic() to start analysis');

// Auto-run
runStepHistoryDiagnostic(); 