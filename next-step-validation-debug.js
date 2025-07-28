/**
 * NEXT STEP VALIDATION DEBUG SCRIPT
 * Comprehensive debugging for required field validation when advancing steps
 */

function debugNextStepValidation() {
  console.log('🔍 NEXT STEP VALIDATION DEBUG');
  console.log('============================');
  
  const results = {
    currentStep: {},
    requiredFields: {},
    validationFlow: {},
    errorDisplay: {},
    navigationButtons: {},
    libraryIntegration: {},
    recommendations: []
  };

  // 1. CURRENT STEP ANALYSIS
  console.log('\n📍 1. CURRENT STEP ANALYSIS');
  console.log('---------------------------');
  
  const currentStep = document.querySelector('.step_wrapper[data-answer]:not([style*="display: none"])');
  const allSteps = document.querySelectorAll('.step_wrapper[data-answer]');
  const visibleSteps = Array.from(allSteps).filter(step => step.offsetParent !== null);
  
  results.currentStep = {
    currentStepId: currentStep?.getAttribute('data-answer') || 'none',
    currentStepGoTo: currentStep?.getAttribute('data-go-to') || 'none',
    totalSteps: allSteps.length,
    visibleSteps: visibleSteps.length,
    currentStepElement: currentStep
  };

  console.log('Current Step:', results.currentStep);

  // 2. REQUIRED FIELDS ANALYSIS
  console.log('\n📋 2. REQUIRED FIELDS ANALYSIS');
  console.log('------------------------------');
  
  // Find required fields in current step
  const currentStepRequiredFields = currentStep ? 
    currentStep.querySelectorAll('input[data-required], select[data-required], textarea[data-required]') : [];
  
  const requiredFieldAnalysis = [];
  currentStepRequiredFields.forEach((field, index) => {
    const fieldName = field.name || field.getAttribute('data-step-field-name') || `field-${index}`;
    const value = field.value?.trim() || '';
    const isEmpty = !value;
    const associatedError = findAssociatedErrorElement(field);
    const hasActiveError = associatedError?.classList.contains('active-error') || false;
    
    const analysis = {
      index: index + 1,
      fieldName,
      fieldType: field.type || field.tagName.toLowerCase(),
      isEmpty,
      value: value.substring(0, 20) + (value.length > 20 ? '...' : ''),
      hasAssociatedError: !!associatedError,
      errorElementClass: associatedError?.className || 'none',
      hasActiveError,
      errorVisible: associatedError ? associatedError.offsetParent !== null : false,
      element: field
    };
    
    requiredFieldAnalysis.push(analysis);
    
    console.log(`Required Field ${index + 1} (${fieldName}):`, {
      empty: isEmpty,
      hasError: !!associatedError,
      errorActive: hasActiveError,
      errorVisible: analysis.errorVisible
    });
  });

  results.requiredFields = {
    totalInCurrentStep: currentStepRequiredFields.length,
    emptyFields: requiredFieldAnalysis.filter(f => f.isEmpty).length,
    fieldsWithErrors: requiredFieldAnalysis.filter(f => f.hasActiveError).length,
    fields: requiredFieldAnalysis
  };

  console.log('Required Fields Summary:', {
    total: results.requiredFields.totalInCurrentStep,
    empty: results.requiredFields.emptyFields,
    withErrors: results.requiredFields.fieldsWithErrors
  });

  // 3. VALIDATION FLOW TESTING
  console.log('\n🔧 3. VALIDATION FLOW TESTING');
  console.log('-----------------------------');
  
  const validationResults = [];
  
  // Test each empty required field
  const emptyFields = requiredFieldAnalysis.filter(f => f.isEmpty);
  
  console.log(`Testing validation for ${emptyFields.length} empty required fields...`);
  
  emptyFields.forEach((fieldData, index) => {
    console.log(`\n🧪 Testing field ${index + 1}: ${fieldData.fieldName}`);
    
    const testResult = {
      fieldName: fieldData.fieldName,
      beforeTest: {
        hasActiveError: fieldData.hasActiveError,
        errorVisible: fieldData.errorVisible
      },
      afterBlur: {},
      afterLibraryCall: {},
      manualTrigger: {}
    };

    // Test 1: Manual blur event
    try {
      fieldData.element.focus();
      fieldData.element.blur();
      
      setTimeout(() => {
        const errorAfterBlur = findAssociatedErrorElement(fieldData.element);
        testResult.afterBlur = {
          hasActiveError: errorAfterBlur?.classList.contains('active-error') || false,
          errorVisible: errorAfterBlur ? errorAfterBlur.offsetParent !== null : false
        };
        
        console.log(`   After blur: active=${testResult.afterBlur.hasActiveError}, visible=${testResult.afterBlur.errorVisible}`);
      }, 100);
      
    } catch (error) {
      testResult.afterBlur.error = error.message;
      console.log(`   ❌ Blur test failed: ${error.message}`);
    }

    // Test 2: Direct library call
    try {
      if (window.FormLib && typeof window.FormLib.validateField === 'function') {
        const isValid = window.FormLib.validateField(fieldData.fieldName);
        const errorAfterValidation = findAssociatedErrorElement(fieldData.element);
        
        testResult.afterLibraryCall = {
          validationResult: isValid,
          hasActiveError: errorAfterValidation?.classList.contains('active-error') || false,
          errorVisible: errorAfterValidation ? errorAfterValidation.offsetParent !== null : false
        };
        
        console.log(`   Library validation: valid=${isValid}, active=${testResult.afterLibraryCall.hasActiveError}, visible=${testResult.afterLibraryCall.errorVisible}`);
      } else {
        testResult.afterLibraryCall.error = 'validateField method not available';
        console.log(`   ❌ Library validation failed: validateField method not available`);
      }
    } catch (error) {
      testResult.afterLibraryCall.error = error.message;
      console.log(`   ❌ Library validation failed: ${error.message}`);
    }

    // Test 3: Manual showError call
    try {
      if (window.FormLib && typeof window.FormLib.showError === 'function') {
        window.FormLib.showError(fieldData.fieldName, 'Test error message');
        const errorAfterShow = findAssociatedErrorElement(fieldData.element);
        
        testResult.manualTrigger = {
          hasActiveError: errorAfterShow?.classList.contains('active-error') || false,
          errorVisible: errorAfterShow ? errorAfterShow.offsetParent !== null : false
        };
        
        console.log(`   Manual showError: active=${testResult.manualTrigger.hasActiveError}, visible=${testResult.manualTrigger.errorVisible}`);
        
        // Clean up
        if (window.FormLib.clearError) {
          setTimeout(() => window.FormLib.clearError(fieldData.fieldName), 1000);
        }
      } else {
        testResult.manualTrigger.error = 'showError method not available';
        console.log(`   ❌ Manual showError failed: showError method not available`);
      }
    } catch (error) {
      testResult.manualTrigger.error = error.message;
      console.log(`   ❌ Manual showError failed: ${error.message}`);
    }

    validationResults.push(testResult);
  });

  results.validationFlow = {
    emptyFieldsTested: emptyFields.length,
    validationResults
  };

  // 4. ERROR DISPLAY SYSTEM CHECK
  console.log('\n🚨 4. ERROR DISPLAY SYSTEM CHECK');
  console.log('--------------------------------');
  
  const allErrorElements = document.querySelectorAll('.form_error-message');
  const currentStepErrors = currentStep ? currentStep.querySelectorAll('.form_error-message') : [];
  
  const errorSystemStatus = {
    totalErrorElements: allErrorElements.length,
    currentStepErrors: currentStepErrors.length,
    visibleErrors: Array.from(currentStepErrors).filter(el => el.offsetParent !== null).length,
    activeErrors: Array.from(currentStepErrors).filter(el => el.classList.contains('active-error')).length,
    cssCheck: checkErrorCSS()
  };

  results.errorDisplay = errorSystemStatus;
  console.log('Error Display Status:', errorSystemStatus);

  // 5. NAVIGATION BUTTONS CHECK
  console.log('\n🧭 5. NAVIGATION BUTTONS CHECK');
  console.log('------------------------------');
  
  const nextButtons = currentStep ? currentStep.querySelectorAll('[data-form="next-btn"]') : [];
  const backButtons = currentStep ? currentStep.querySelectorAll('[data-form="back-btn"]') : [];
  
  results.navigationButtons = {
    nextButtons: nextButtons.length,
    backButtons: backButtons.length,
    nextButtonsFound: Array.from(nextButtons).map(btn => ({
      text: btn.textContent?.trim() || '',
      href: btn.getAttribute('href') || '',
      classes: Array.from(btn.classList)
    }))
  };

  console.log('Navigation Buttons:', results.navigationButtons);

  // Test next button click prevention
  if (nextButtons.length > 0) {
    console.log('\n🧪 Testing next button validation...');
    
    // Check if next button validation is implemented
    const nextButton = nextButtons[0];
    const hasValidationHandler = checkForValidationHandler(nextButton);
    
    console.log('Next button validation handler:', hasValidationHandler);
  }

  // 6. LIBRARY INTEGRATION CHECK
  console.log('\n🔗 6. LIBRARY INTEGRATION CHECK');
  console.log('-------------------------------');
  
  const libraryStatus = {
    formLibExists: typeof window.FormLib !== 'undefined',
    version: window.FormLib?.version || 'unknown',
    methods: {},
    currentStepTracking: null
  };

  if (window.FormLib) {
    libraryStatus.methods = {
      validateField: typeof window.FormLib.validateField === 'function',
      showError: typeof window.FormLib.showError === 'function',
      clearError: typeof window.FormLib.clearError === 'function',
      hasError: typeof window.FormLib.hasError === 'function',
      debugStepSystem: typeof window.FormLib.debugStepSystem === 'function'
    };

    // Test current step tracking
    try {
      if (window.FormLib.debugStepSystem) {
        console.log('\n🔍 Running debugStepSystem...');
        window.FormLib.debugStepSystem();
      }
    } catch (error) {
      console.log('❌ debugStepSystem failed:', error.message);
    }
  }

  results.libraryIntegration = libraryStatus;
  console.log('Library Integration:', libraryStatus);

  // 7. GENERATE RECOMMENDATIONS
  console.log('\n💡 7. RECOMMENDATIONS');
  console.log('---------------------');
  
  if (results.requiredFields.emptyFields > 0 && results.requiredFields.fieldsWithErrors === 0) {
    results.recommendations.push('🚨 CRITICAL: Empty required fields are not showing errors');
  }
  
  if (!results.errorDisplay.cssCheck.properlyHidden) {
    results.recommendations.push('🎨 Add CSS to hide .form_error-message by default');
  }
  
  if (results.navigationButtons.nextButtons === 0) {
    results.recommendations.push('🧭 No next buttons found in current step');
  }
  
  if (!libraryStatus.methods.validateField) {
    results.recommendations.push('🔧 Library validation methods not available');
  }
  
  if (results.validationFlow.emptyFieldsTested === 0) {
    results.recommendations.push('⚠️ No empty required fields to test');
  }

  if (results.recommendations.length === 0) {
    results.recommendations.push('✅ Ready to implement next button validation');
  }

  results.recommendations.forEach(rec => console.log(`   ${rec}`));

  // Store results globally
  window.nextStepValidationDebug = results;
  console.log('\n📁 Full results stored in: window.nextStepValidationDebug');
  
  return results;
}

// Helper functions
function findAssociatedErrorElement(inputElement) {
  // Look in form-field_wrapper
  const wrapper = inputElement.closest('.form-field_wrapper');
  if (wrapper) {
    return wrapper.querySelector('.form_error-message');
  }
  
  // Look in parent element
  const parent = inputElement.parentElement;
  return parent?.querySelector('.form_error-message') || null;
}

function checkErrorCSS() {
  // Create test element to check CSS
  const testError = document.createElement('div');
  testError.className = 'form_error-message';
  testError.textContent = 'Test';
  testError.style.position = 'absolute';
  testError.style.left = '-9999px';
  document.body.appendChild(testError);
  
  const styles = window.getComputedStyle(testError);
  const isHidden = styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0';
  
  document.body.removeChild(testError);
  
  return {
    properlyHidden: isHidden,
    display: styles.display,
    visibility: styles.visibility,
    opacity: styles.opacity
  };
}

function checkForValidationHandler(buttonElement) {
  // Check if button has validation event listeners
  const events = [];
  
  // Check common event types
  ['click', 'mousedown', 'touchstart'].forEach(eventType => {
    try {
      // This is a basic check - in practice, we can't easily detect all event listeners
      const hasHandler = buttonElement.onclick !== null || 
                         buttonElement.addEventListener !== undefined;
      if (hasHandler) {
        events.push(eventType);
      }
    } catch (error) {
      // Ignore errors
    }
  });
  
  return {
    hasHandlers: events.length > 0,
    eventTypes: events,
    note: 'Event listener detection is limited in browser environment'
  };
}

// Auto-run the debug
debugNextStepValidation(); 