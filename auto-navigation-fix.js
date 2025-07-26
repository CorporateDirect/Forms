/**
 * Auto-Navigation Fix
 * Prevents step wrappers from auto-triggering navigation on any click
 * 
 * This is a temporary fix for the widespread auto-navigation issue
 */

console.log('🔧 === AUTO-NAVIGATION FIX ===');
console.log('📅 Fix Date:', new Date().toISOString());

function applyAutoNavigationFix() {
  console.log('\n🛠️ Applying auto-navigation fix...');
  
  // Find all step wrappers with data-go-to
  const stepWrappersWithGoTo = document.querySelectorAll('.step_wrapper[data-go-to]');
  console.log(`🔍 Found ${stepWrappersWithGoTo.length} step wrappers with data-go-to`);
  
  stepWrappersWithGoTo.forEach((stepWrapper, index) => {
    const stepId = stepWrapper.getAttribute('data-answer');
    const goToValue = stepWrapper.getAttribute('data-go-to');
    
    console.log(`${index + 1}. Step ${stepId} → auto-goes to: ${goToValue}`);
    
    // Add a click handler that stops propagation for the step wrapper itself
    const preventAutoNav = (event) => {
      // Only prevent if the click is directly on the step wrapper
      // and not on a specific navigation element
      if (event.target === stepWrapper) {
        console.log(`🛑 Preventing auto-navigation from step wrapper: ${stepId}`);
        event.stopImmediatePropagation();
        event.preventDefault();
      }
      
      // Allow clicks on actual navigation elements
      const target = event.target;
      const isNavigationElement = 
        target.hasAttribute('data-form') && 
        (target.getAttribute('data-form').includes('btn') ||
         target.getAttribute('data-form') === 'next' ||
         target.getAttribute('data-form') === 'back') ||
        target.hasAttribute('data-skip') ||
        (target.type === 'radio' && target.hasAttribute('data-go-to')) ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A';
      
      if (isNavigationElement) {
        console.log(`✅ Allowing navigation element click: ${target.tagName} with ${target.getAttribute('data-form') || target.getAttribute('data-skip') || target.getAttribute('data-go-to')}`);
      }
    };
    
    // Add the prevention handler with high priority
    stepWrapper.addEventListener('click', preventAutoNav, true);
    
    // Store cleanup function
    if (!window.autoNavCleanup) {
      window.autoNavCleanup = [];
    }
    window.autoNavCleanup.push(() => {
      stepWrapper.removeEventListener('click', preventAutoNav, true);
    });
  });
  
  console.log('✅ Auto-navigation fix applied to step wrappers');
  
  // Create global cleanup function
  window.removeAutoNavigationFix = () => {
    if (window.autoNavCleanup) {
      window.autoNavCleanup.forEach(cleanup => cleanup());
      window.autoNavCleanup = [];
      console.log('🗑️ Auto-navigation fix removed');
    }
  };
  
  return {
    stepWrappersFixed: stepWrappersWithGoTo.length,
    status: 'applied'
  };
}

function testAutoNavigationFix() {
  console.log('\n🧪 === TESTING AUTO-NAVIGATION FIX ===');
  
  const currentStep = document.querySelector('.step_wrapper.active-step, .step_wrapper[style*="display: flex"]');
  const currentStepId = currentStep?.getAttribute('data-answer');
  const currentGoTo = currentStep?.getAttribute('data-go-to');
  
  console.log('📍 Current step:', currentStepId);
  console.log('🎯 Current step data-go-to:', currentGoTo || 'none');
  
  if (currentGoTo) {
    console.log('⚠️ Current step has auto-navigation configured');
    console.log('🧪 Try clicking in an empty area of the form to test if auto-navigation is prevented');
    console.log('✅ Try clicking navigation buttons to ensure they still work');
  } else {
    console.log('✅ Current step does not have auto-navigation');
  }
  
  // Test back button functionality
  const backBtn = document.querySelector('[data-form="back-btn"]');
  if (backBtn) {
    console.log('🔙 Back button found - test clicking it to ensure it still works');
  }
}

// Apply the fix
console.log('🚀 Starting auto-navigation fix...');
const results = applyAutoNavigationFix();
testAutoNavigationFix();

console.log('\n📋 === FIX SUMMARY ===');
console.log('🔧 Fixed step wrappers:', results.stepWrappersFixed);
console.log('🎯 Auto-navigation from step wrappers should now be prevented');
console.log('✅ Navigation buttons should continue to work normally');
console.log('🔙 Back button should work without unwanted auto-navigation');

console.log('\n🧪 TESTING INSTRUCTIONS:');
console.log('1. Click in empty areas of the current step - should NOT auto-navigate');
console.log('2. Click Next/Back buttons - SHOULD work normally');
console.log('3. Click radio buttons - SHOULD trigger branching navigation');
console.log('4. Run removeAutoNavigationFix() to undo this fix if needed'); 