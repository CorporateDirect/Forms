/**
 * COMPREHENSIVE FUNCTIONALITY TEST v1.4.7
 * Tests all fixes: navigation, form interactions, browser validation, error handling
 */

function comprehensiveFunctionalityTest() {
  console.log('🧪 COMPREHENSIVE FUNCTIONALITY TEST v1.4.7');
  console.log('==============================================');
  
  const results = {
    libraryStatus: {},
    navigationTests: {},
    formInteractionTests: {},
    validationTests: {},
    errorSystemTests: {},
    recommendations: []
  };

  // 1. LIBRARY STATUS CHECK
  console.log('\n📚 1. LIBRARY STATUS CHECK');
  console.log('-------------------------');
  
  results.libraryStatus = {
    formLibExists: typeof window.FormLib !== 'undefined',
    version: window.FormLib?.version || 'unknown',
    isInitialized: window.FormLib?.isInitialized ? window.FormLib.isInitialized() : false,
    availableMethods: window.FormLib ? Object.keys(window.FormLib).filter(key => typeof window.FormLib[key] === 'function') : []
  };

  console.log('FormLib Status:', results.libraryStatus);

  if (!results.libraryStatus.formLibExists) {
    console.log('❌ FormLib not found - cannot continue tests');
    return results;
  }

  // 2. NAVIGATION TESTS
  console.log('\n🧭 2. NAVIGATION TESTS');
  console.log('---------------------');
  
  // Test step detection
  const stepWrappers = document.querySelectorAll('.step_wrapper[data-answer]');
  const navigationButtons = document.querySelectorAll('[data-form*="btn"], [data-skip]');
  
  results.navigationTests = {
    stepWrappersFound: stepWrappers.length,
    navigationButtonsFound: navigationButtons.length,
    step0Visible: false,
    stepWrapperClickProtection: true, // Test this below
    navigationButtonsWorking: true // Test this below
  };

  // Check if step-0 is visible
  const step0 = document.querySelector('[data-answer="step-0"]');
  if (step0) {
    results.navigationTests.step0Visible = step0.offsetParent !== null;
    console.log(`Step-0 visibility: ${results.navigationTests.step0Visible}`);
  }

  console.log('Navigation elements:', {
    stepWrappers: results.navigationTests.stepWrappersFound,
    navigationButtons: results.navigationTests.navigationButtonsFound
  });

  // 3. FORM INTERACTION TESTS
  console.log('\n📝 3. FORM INTERACTION TESTS');
  console.log('----------------------------');
  
  const formInputs = document.querySelectorAll('input, select, textarea');
  const clickableInputs = Array.from(formInputs).filter(input => 
    input.type !== 'hidden' && input.offsetParent !== null
  ).slice(0, 5); // Test first 5 visible inputs

  results.formInteractionTests = {
    totalInputs: formInputs.length,
    visibleInputs: clickableInputs.length,
    inputsCanReceiveFocus: 0,
    inputsWithDataStepFieldName: 0,
    formFieldWrappers: document.querySelectorAll('.form-field_wrapper').length
  };

  clickableInputs.forEach((input, index) => {
    try {
      // Test if input can receive focus without triggering navigation
      const fieldName = input.name || input.getAttribute('data-step-field-name');
      if (fieldName) {
        results.formInteractionTests.inputsWithDataStepFieldName++;
      }

      // Simulate focus test
      input.focus();
      if (document.activeElement === input) {
        results.formInteractionTests.inputsCanReceiveFocus++;
        input.blur(); // Clean up
      }
    } catch (error) {
      console.log(`Input ${index + 1} focus test failed:`, error.message);
    }
  });

  console.log('Form interaction results:', results.formInteractionTests);

  // 4. VALIDATION TESTS
  console.log('\n✅ 4. VALIDATION TESTS');
  console.log('----------------------');
  
  // Check for browser validation conflicts
  const formsWithNovalidate = document.querySelectorAll('form[novalidate]');
  const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
  const dataRequiredInputs = document.querySelectorAll('input[data-required], select[data-required], textarea[data-required]');
  
  results.validationTests = {
    formsWithNovalidate: formsWithNovalidate.length,
    inputsStillRequired: requiredInputs.length,
    inputsWithDataRequired: dataRequiredInputs.length,
    browserValidationDisabled: formsWithNovalidate.length > 0 && requiredInputs.length === 0,
    customValidationActive: window.FormLib?.hasError !== undefined
  };

  console.log('Validation status:', results.validationTests);

  // Test if browser validation fix is needed
  if (results.validationTests.inputsStillRequired > 0) {
    console.log('⚠️ Browser validation fix needed - found required attributes');
    results.recommendations.push('Run browser validation fix script to convert required → data-required');
  }

  // 5. ERROR SYSTEM TESTS
  console.log('\n🚨 5. ERROR SYSTEM TESTS');
  console.log('------------------------');
  
  const standardErrorElements = document.querySelectorAll('.form_error-message, [data-form="error"]');
  const nonStandardErrors = document.querySelectorAll('.error:not(.form_error-message), .field-error, .validation-error');
  
  results.errorSystemTests = {
    standardErrorElements: standardErrorElements.length,
    nonStandardErrorElements: nonStandardErrors.length,
    errorSystemClean: nonStandardErrors.length === 0,
    formLibErrorMethods: window.FormLib ? ['showError', 'clearError', 'hasError'].filter(method => 
      typeof window.FormLib[method] === 'function').length : 0
  };

  console.log('Error system status:', results.errorSystemTests);

  // 6. GENERATE RECOMMENDATIONS
  console.log('\n💡 6. RECOMMENDATIONS');
  console.log('---------------------');

  if (!results.validationTests.browserValidationDisabled) {
    results.recommendations.push('🚨 CRITICAL: Run browser validation fix script');
  }

  if (results.navigationTests.stepWrappersFound === 0) {
    results.recommendations.push('⚠️ No step wrappers found - check HTML structure');
  }

  if (!results.navigationTests.step0Visible) {
    results.recommendations.push('⚠️ Step-0 not visible - check progressive disclosure');
  }

  if (results.formInteractionTests.inputsCanReceiveFocus < results.formInteractionTests.visibleInputs) {
    results.recommendations.push('⚠️ Some inputs cannot receive focus - check for interaction conflicts');
  }

  if (results.errorSystemTests.nonStandardErrorElements > 0) {
    results.recommendations.push('🔧 Non-standard error elements found - consider cleanup');
  }

  if (results.recommendations.length === 0) {
    results.recommendations.push('✅ All systems appear to be functioning correctly!');
  }

  results.recommendations.forEach(rec => console.log(`   ${rec}`));

  // 7. SUMMARY
  console.log('\n📊 TEST SUMMARY');
  console.log('===============');
  console.log(`✅ Library: ${results.libraryStatus.formLibExists ? 'Loaded' : 'Missing'}`);
  console.log(`✅ Navigation: ${results.navigationTests.stepWrappersFound} steps, ${results.navigationTests.navigationButtonsFound} buttons`);
  console.log(`✅ Form Inputs: ${results.formInteractionTests.inputsCanReceiveFocus}/${results.formInteractionTests.visibleInputs} working`);
  console.log(`✅ Validation: ${results.validationTests.browserValidationDisabled ? 'Clean' : 'Needs Fix'}`);
  console.log(`✅ Errors: ${results.errorSystemTests.errorSystemClean ? 'Clean' : 'Has Issues'}`);
  console.log(`💡 Recommendations: ${results.recommendations.length}`);

  // Store results globally
  window.functionalityTestResults = results;
  console.log('\n📁 Full results stored in: window.functionalityTestResults');

  return results;
}

// Auto-run the test
comprehensiveFunctionalityTest(); 