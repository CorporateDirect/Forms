/**
 * Test Navigation Fix
 * Verifies that the step wrapper navigation fix works correctly
 * Version 1.4.4 should prevent unwanted auto-navigation
 */

console.log('🧪 === TEST NAVIGATION FIX (v1.4.4) ===');
console.log('📅 Test Date:', new Date().toISOString());

function testNavigationFix() {
  console.log('\n🔧 === TESTING NAVIGATION FIX ===');
  
  // First, remove any previous temporary fixes
  if (window.removeAutoNavigationFix) {
    console.log('🗑️ Removing temporary auto-navigation fix...');
    window.removeAutoNavigationFix();
  }
  
  // Check current step
  const currentStep = document.querySelector('.step_wrapper.active-step, .step_wrapper[style*="display: flex"]');
  const currentStepId = currentStep?.getAttribute('data-answer');
  const currentGoTo = currentStep?.getAttribute('data-go-to');
  
  console.log('📍 Current step:', currentStepId);
  console.log('🎯 Current step data-go-to:', currentGoTo || 'none');
  
  if (!currentGoTo) {
    console.log('⚠️ Current step has no data-go-to, navigating to step-1 first...');
    if (window.FormLib?.goToStepById) {
      window.FormLib.goToStepById('step-1');
      setTimeout(() => {
        testNavigationBehavior();
      }, 1000);
    } else {
      console.log('❌ FormLib not available for testing');
    }
  } else {
    testNavigationBehavior();
  }
}

function testNavigationBehavior() {
  console.log('\n🎮 === TESTING NAVIGATION BEHAVIOR ===');
  
  const currentStep = document.querySelector('.step_wrapper.active-step, .step_wrapper[style*="display: flex"]');
  const currentStepId = currentStep?.getAttribute('data-answer');
  const currentGoTo = currentStep?.getAttribute('data-go-to');
  
  console.log('📊 Test Setup:', {
    currentStepId,
    currentGoTo,
    hasFormLib: !!window.FormLib,
    libVersion: '1.4.4'
  });
  
  // Test 1: Click directly on step wrapper (should NOT navigate)
  console.log('\n🧪 TEST 1: Click on step wrapper (should NOT auto-navigate)');
  let clickHandled = false;
  
  const testClickHandler = () => {
    clickHandled = true;
    console.log('❌ FAIL: Step wrapper click triggered navigation!');
  };
  
  // Add temporary listener to detect unwanted navigation
  const originalGoToStepById = window.FormLib?.goToStepById;
  if (originalGoToStepById) {
    window.FormLib.goToStepById = function(stepId) {
      console.log('🚨 Navigation triggered to:', stepId);
      testClickHandler();
      return originalGoToStepById.call(this, stepId);
    };
  }
  
  // Simulate click on step wrapper
  console.log('🖱️ Simulating click on step wrapper...');
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  
  currentStep.dispatchEvent(clickEvent);
  
  setTimeout(() => {
    if (!clickHandled) {
      console.log('✅ PASS: Step wrapper click did NOT trigger navigation');
    }
    
    // Restore original function
    if (originalGoToStepById) {
      window.FormLib.goToStepById = originalGoToStepById;
    }
    
    // Test 2: Test navigation buttons
    testNavigationButtons();
  }, 500);
}

function testNavigationButtons() {
  console.log('\n🧪 TEST 2: Navigation buttons (should work normally)');
  
  const nextBtn = document.querySelector('[data-form="next-btn"]');
  const backBtn = document.querySelector('[data-form="back-btn"]');
  
  console.log('🔍 Navigation buttons found:', {
    nextBtn: !!nextBtn,
    backBtn: !!backBtn
  });
  
  if (nextBtn) {
    console.log('✅ Next button available for testing');
    console.log('   - Click it to test forward navigation');
  }
  
  if (backBtn) {
    console.log('✅ Back button available for testing');
    console.log('   - Click it to test backward navigation');
  }
  
  // Test back button functionality specifically
  testBackButtonFunctionality();
}

function testBackButtonFunctionality() {
  console.log('\n🔙 === TESTING BACK BUTTON FUNCTIONALITY ===');
  
  const currentStep = document.querySelector('.step_wrapper.active-step, .step_wrapper[style*="display: flex"]');
  const currentStepId = currentStep?.getAttribute('data-answer');
  
  if (currentStepId === 'step-0') {
    console.log('📍 Currently on step-0, navigating forward first...');
    
    // Navigate to step-1 first
    if (window.FormLib?.goToStepById) {
      window.FormLib.goToStepById('step-1');
      
      setTimeout(() => {
        console.log('📍 Now on step-1, testing back button...');
        const backBtn = document.querySelector('[data-form="back-btn"]');
        
        if (backBtn) {
          console.log('🖱️ Clicking back button...');
          backBtn.click();
          
          setTimeout(() => {
            const newStep = document.querySelector('.step_wrapper.active-step, .step_wrapper[style*="display: flex"]');
            const newStepId = newStep?.getAttribute('data-answer');
            
            console.log('📍 After back button click:', newStepId);
            
            if (newStepId === 'step-0') {
              console.log('✅ PASS: Back button worked correctly!');
              
              // Test if we stay on step-0 (no auto-navigation)
              setTimeout(() => {
                const finalStep = document.querySelector('.step_wrapper.active-step, .step_wrapper[style*="display: flex"]');
                const finalStepId = finalStep?.getAttribute('data-answer');
                
                if (finalStepId === 'step-0') {
                  console.log('✅ PASS: Stayed on step-0, no unwanted auto-navigation!');
                } else {
                  console.log('❌ FAIL: Auto-navigated away from step-0 to:', finalStepId);
                }
                
                showTestSummary();
              }, 2000);
              
            } else {
              console.log('❌ FAIL: Back button did not work, still on:', newStepId);
              showTestSummary();
            }
          }, 1000);
        } else {
          console.log('❌ Back button not found');
          showTestSummary();
        }
      }, 1000);
    }
  } else {
    console.log('📍 Not on step-0, testing back button directly...');
    const backBtn = document.querySelector('[data-form="back-btn"]');
    
    if (backBtn) {
      console.log('🖱️ Clicking back button...');
      backBtn.click();
      
      setTimeout(() => {
        console.log('✅ Back button clicked - check if navigation worked');
        showTestSummary();
      }, 1000);
    } else {
      console.log('❌ Back button not found');
      showTestSummary();
    }
  }
}

function showTestSummary() {
  console.log('\n📋 === TEST SUMMARY ===');
  console.log('🔧 Navigation Fix v1.4.4 Testing Complete');
  console.log('');
  console.log('✅ Expected Results:');
  console.log('   1. Clicking step wrapper areas should NOT trigger navigation');
  console.log('   2. Clicking Next/Back buttons SHOULD trigger navigation');
  console.log('   3. Back button should work without auto-navigation interference');
  console.log('   4. Form fields should be clickable without triggering navigation');
  console.log('');
  console.log('🧪 Manual Testing:');
  console.log('   1. Try clicking in empty areas of the current step');
  console.log('   2. Try clicking form fields to ensure they work');
  console.log('   3. Try using Next/Back buttons for navigation');
  console.log('   4. Try the back button from different steps');
  console.log('');
  console.log('🎯 If all tests pass, the navigation fix is working correctly!');
}

// Run the test
console.log('🚀 Starting navigation fix test...');
testNavigationFix(); 