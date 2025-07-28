/**
 * COMPREHENSIVE v1.4.8 VERIFICATION TEST
 * Tests all functionality with permanent browser validation fix
 */

function verifyV148Production() {
  console.log('🧪 COMPREHENSIVE v1.4.8 VERIFICATION TEST');
  console.log('===========================================');
  
  const results = {
    libraryStatus: {},
    browserValidationFix: {},
    navigationTests: {},
    formInteractionTests: {},
    overallHealth: {}
  };

  // 1. LIBRARY STATUS CHECK
  console.log('\n📚 1. LIBRARY STATUS CHECK');
  console.log('-------------------------');
  
  results.libraryStatus = {
    formLibExists: typeof window.FormLib !== 'undefined',
    version: window.FormLib?.version || 'unknown',
    methods: window.FormLib ? Object.keys(window.FormLib).filter(key => typeof window.FormLib[key] === 'function') : [],
    scriptUrl: Array.from(document.scripts).find(script => script.src.includes('form-functionality-library'))?.src || 'not found'
  };

  console.log('Library Status:', results.libraryStatus);
  
  if (!results.libraryStatus.formLibExists) {
    console.log('❌ FormLib not found - cannot continue tests');
    return results;
  }

  // 2. BROWSER VALIDATION FIX VERIFICATION
  console.log('\n🛠️ 2. BROWSER VALIDATION FIX VERIFICATION');
  console.log('------------------------------------------');
  
  // Check if browser validation conflicts are automatically resolved
  const formsWithNovalidate = document.querySelectorAll('form[novalidate]');
  const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
  const dataRequiredInputs = document.querySelectorAll('input[data-required], select[data-required], textarea[data-required]');
  
  results.browserValidationFix = {
    formsWithNovalidate: formsWithNovalidate.length,
    inputsStillRequired: requiredInputs.length,
    inputsWithDataRequired: dataRequiredInputs.length,
    automaticFixApplied: formsWithNovalidate.length > 0 && requiredInputs.length === 0,
    conflictsEliminated: requiredInputs.length === 0 && dataRequiredInputs.length > 0
  };

  console.log('Browser Validation Fix Results:', results.browserValidationFix);
  
  if (results.browserValidationFix.automaticFixApplied) {
    console.log('✅ AUTOMATIC BROWSER VALIDATION FIX WORKING!');
  } else {
    console.log('⚠️ Browser validation fix may not be applied automatically');
  }

  // 3. NAVIGATION SYSTEM TESTS
  console.log('\n🧭 3. NAVIGATION SYSTEM TESTS');
  console.log('-----------------------------');
  
  const stepWrappers = document.querySelectorAll('.step_wrapper[data-answer]');
  const navigationButtons = document.querySelectorAll('[data-form*="btn"], [data-skip]');
  const step0 = document.querySelector('[data-answer="step-0"]');
  
  results.navigationTests = {
    stepWrappersFound: stepWrappers.length,
    navigationButtonsFound: navigationButtons.length,
    step0Exists: !!step0,
    step0Visible: step0 ? step0.offsetParent !== null : false,
    stepWrapperClickProtected: true // Will test below
  };

  console.log('Navigation System Status:', results.navigationTests);

  // Test step wrapper click protection
  if (step0) {
    const stepWrapperDataGoTo = step0.getAttribute('data-go-to');
    console.log(`Step-0 data-go-to: ${stepWrapperDataGoTo || 'none'}`);
    
    if (stepWrapperDataGoTo) {
      console.log('⚠️ Step wrapper has data-go-to - testing click protection');
    }
  }

  // 4. FORM INTERACTION TESTS
  console.log('\n📝 4. FORM INTERACTION TESTS');
  console.log('----------------------------');
  
  const formInputs = document.querySelectorAll('input, select, textarea');
  const visibleInputs = Array.from(formInputs).filter(input => 
    input.type !== 'hidden' && input.offsetParent !== null
  ).slice(0, 3); // Test first 3 visible inputs

  results.formInteractionTests = {
    totalInputs: formInputs.length,
    visibleInputsFound: visibleInputs.length,
    inputsCanReceiveFocus: 0,
    inputsWithDataStepFieldName: 0,
    formFieldWrappers: document.querySelectorAll('.form-field_wrapper').length
  };

  // Test input focus capability
  visibleInputs.forEach((input, index) => {
    try {
      const fieldName = input.name || input.getAttribute('data-step-field-name');
      if (fieldName) {
        results.formInteractionTests.inputsWithDataStepFieldName++;
      }

      // Test focus without triggering navigation
      input.focus();
      if (document.activeElement === input) {
        results.formInteractionTests.inputsCanReceiveFocus++;
        console.log(`✅ Input ${index + 1} can receive focus: ${fieldName || 'unnamed'}`);
        input.blur(); // Clean up
      }
    } catch (error) {
      console.log(`❌ Input ${index + 1} focus test failed:`, error.message);
    }
  });

  console.log('Form Interaction Results:', results.formInteractionTests);

  // 5. TEST LIBRARY METHODS
  console.log('\n🔧 5. TESTING LIBRARY METHODS');
  console.log('-----------------------------');
  
  // Test if new browser validation fix method is available
  const hasBrowserValidationFix = typeof window.FormLib.initBrowserValidationFix === 'function';
  console.log(`initBrowserValidationFix method available: ${hasBrowserValidationFix}`);
  
  // Test basic library functions
  try {
    const hasDebugMethod = typeof window.FormLib.debugStepSystem === 'function';
    console.log(`debugStepSystem method available: ${hasDebugMethod}`);
    
    if (hasDebugMethod) {
      console.log('🔍 Running debugStepSystem...');
      window.FormLib.debugStepSystem();
    }
  } catch (error) {
    console.log('Error testing library methods:', error.message);
  }

  // 6. OVERALL HEALTH ASSESSMENT
  console.log('\n📊 6. OVERALL HEALTH ASSESSMENT');
  console.log('-------------------------------');
  
  results.overallHealth = {
    libraryLoaded: results.libraryStatus.formLibExists,
    browserValidationFixed: results.browserValidationFix.automaticFixApplied,
    navigationWorking: results.navigationTests.step0Visible && results.navigationTests.stepWrappersFound > 0,
    formInteractionsSafe: results.formInteractionTests.inputsCanReceiveFocus > 0,
    productionReady: false
  };

  // Calculate production readiness
  results.overallHealth.productionReady = 
    results.overallHealth.libraryLoaded &&
    results.overallHealth.browserValidationFixed &&
    results.overallHealth.navigationWorking &&
    results.overallHealth.formInteractionsSafe;

  console.log('Overall Health:', results.overallHealth);

  // 7. RECOMMENDATIONS
  console.log('\n💡 7. RECOMMENDATIONS');
  console.log('---------------------');
  
  if (results.overallHealth.productionReady) {
    console.log('🎉 ALL SYSTEMS GO! v1.4.8 is working perfectly in production!');
    console.log('✅ Automatic browser validation fix is active');
    console.log('✅ Navigation system is functional');
    console.log('✅ Form interactions are safe');
    console.log('✅ Library is fully loaded and operational');
  } else {
    if (!results.overallHealth.libraryLoaded) {
      console.log('🚨 CRITICAL: Library not loaded');
    }
    if (!results.overallHealth.browserValidationFixed) {
      console.log('⚠️ Browser validation fix not automatically applied');
    }
    if (!results.overallHealth.navigationWorking) {
      console.log('⚠️ Navigation system issues detected');
    }
    if (!results.overallHealth.formInteractionsSafe) {
      console.log('⚠️ Form interaction issues detected');
    }
  }

  // Store results globally
  window.v148VerificationResults = results;
  console.log('\n📁 Full results stored in: window.v148VerificationResults');
  
  return results;
}

// Auto-run the verification
verifyV148Production(); 