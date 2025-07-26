/**
 * Direct Back Button Test
 * Since goToStepById is available, let's test back navigation directly
 */

console.log('🔙 === DIRECT BACK BUTTON TEST ===');
console.log('📅 Test Date:', new Date().toISOString());

// First, let's advance to step-1 so we can test going back
function setupBackButtonTest() {
  console.log('\n🚀 === SETUP BACK BUTTON TEST ===');
  
  // Check current step
  const currentStep = document.querySelector('.step_wrapper.active-step, .step_wrapper[style*="display: flex"], .step_wrapper[style*="display: block"]');
  const currentStepId = currentStep?.getAttribute('data-answer');
  
  console.log('📍 Current step:', currentStepId);
  
  if (currentStepId === 'step-0') {
    console.log('▶️ Advancing to step-1 first to test back navigation...');
    
    // Use FormLib to go to step-1
    try {
      window.FormLib.goToStepById('step-1');
      console.log('✅ Advanced to step-1');
      
      // Wait a moment then test back button
      setTimeout(() => {
        testBackButtonDirectly();
      }, 1000);
      
    } catch (error) {
      console.log('❌ Failed to advance to step-1:', error.message);
      return;
    }
  } else {
    console.log('✅ Already on step:', currentStepId, '- can test back navigation');
    testBackButtonDirectly();
  }
}

function testBackButtonDirectly() {
  console.log('\n🔙 === DIRECT BACK BUTTON TEST ===');
  
  // Find back button
  const backBtn = document.querySelector('[data-form="back-btn"]');
  if (!backBtn) {
    console.log('❌ Back button not found');
    return;
  }
  
  // Check current step before clicking
  const stepBefore = document.querySelector('.step_wrapper.active-step, .step_wrapper[style*="display: flex"], .step_wrapper[style*="display: block"]');
  const stepIdBefore = stepBefore?.getAttribute('data-answer');
  
  console.log('📍 Step before back click:', stepIdBefore);
  
  // Add our own click listener to see what happens
  const testListener = (event) => {
    console.log('🖱️ Back button click intercepted:', {
      target: event.target,
      currentTarget: event.currentTarget,
      bubbles: event.bubbles,
      defaultPrevented: event.defaultPrevented,
      propagationStopped: event.cancelBubble
    });
    
    // Let the click continue
    console.log('📍 Allowing click to proceed...');
  };
  
  backBtn.addEventListener('click', testListener, true);
  
  console.log('👂 Test listener added, now manually clicking back button...');
  
  // Simulate the click
  setTimeout(() => {
    console.log('🖱️ Programmatically clicking back button...');
    backBtn.click();
    
    // Check result after a delay
    setTimeout(() => {
      const stepAfter = document.querySelector('.step_wrapper.active-step, .step_wrapper[style*="display: flex"], .step_wrapper[style*="display: block"]');
      const stepIdAfter = stepAfter?.getAttribute('data-answer');
      
      console.log('📍 Step after back click:', stepIdAfter);
      
      if (stepIdBefore === stepIdAfter) {
        console.log('❌ Back navigation FAILED - no step change');
        diagnoseMissingBackFunctionality();
      } else {
        console.log('✅ Back navigation WORKED - step changed');
      }
      
      // Clean up
      backBtn.removeEventListener('click', testListener, true);
      
    }, 1000);
  }, 500);
}

function diagnoseMissingBackFunctionality() {
  console.log('\n🔍 === DIAGNOSING BACK FUNCTIONALITY ===');
  
  // Check if there's a step history being maintained somewhere
  console.log('🔍 Checking for step history...');
  
  // Try different ways to access step history
  const possibleHistoryLocations = [
    'window.FormLib.stepHistory',
    'window.FormLib.history', 
    'window.FormLib.navigationHistory',
    'window.FormLib.getHistory',
    'window.stepHistory',
    'window.navigationHistory'
  ];
  
  possibleHistoryLocations.forEach(location => {
    try {
      const value = eval(location);
      if (value !== undefined) {
        console.log(`📚 Found history at ${location}:`, value);
      }
    } catch (e) {
      // Ignore eval errors
    }
  });
  
  // Test manual navigation to previous step
  console.log('\n🧪 Testing manual navigation to step-0...');
  try {
    window.FormLib.goToStepById('step-0');
    console.log('✅ Manual navigation to step-0 attempted');
    
    setTimeout(() => {
      const currentStep = document.querySelector('.step_wrapper.active-step, .step_wrapper[style*="display: flex"], .step_wrapper[style*="display: block"]');
      const currentStepId = currentStep?.getAttribute('data-answer');
      console.log('📍 After manual navigation:', currentStepId);
    }, 500);
    
  } catch (error) {
    console.log('❌ Manual navigation failed:', error.message);
  }
}

// Start the test
console.log('🚀 Starting back button direct test...');
setupBackButtonTest(); 