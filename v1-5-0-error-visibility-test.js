/**
 * V1.5.0 ERROR VISIBILITY TEST
 * Debug why .form_error-message elements aren't showing .active-error class
 */

function testErrorVisibility() {
  console.log('🔍 V1.5.0 ERROR VISIBILITY TEST');
  console.log('===============================');
  
  const results = {
    libraryStatus: {},
    errorElements: {},
    validationTests: {},
    fieldInteractionTests: {},
    nextButtonTests: {},
    recommendations: []
  };

  // 1. CHECK LIBRARY VERSION AND STATUS
  console.log('\n📚 1. LIBRARY VERSION CHECK');
  console.log('---------------------------');
  
  results.libraryStatus = {
    formLibExists: typeof window.FormLib !== 'undefined',
    version: window.FormLib?.version || 'unknown',
    showError: typeof window.FormLib?.showError === 'function',
    clearError: typeof window.FormLib?.clearError === 'function',
    hasError: typeof window.FormLib?.hasError === 'function',
    validateField: typeof window.FormLib?.validateField === 'function'
  };

  console.log('Library Status:', results.libraryStatus);
  
  // Check for version indicators in console or scripts
  const scripts = Array.from(document.scripts);
  const formLibScript = scripts.find(script => 
    script.src.includes('form-functionality-library') || 
    script.src.includes('unpkg.com')
  );
  
  if (formLibScript) {
    console.log('📦 FormLib Script Found:', formLibScript.src);
  }

  // 2. ERROR ELEMENTS ANALYSIS
  console.log('\n🚨 2. ERROR ELEMENTS ANALYSIS');
  console.log('-----------------------------');
  
  const allErrorElements = document.querySelectorAll('.form_error-message');
  const activeErrorElements = document.querySelectorAll('.form_error-message.active-error');
  const currentStep = document.querySelector('.step_wrapper:not([style*="display: none"])');
  const currentStepErrors = currentStep ? currentStep.querySelectorAll('.form_error-message') : [];
  
  results.errorElements = {
    totalErrorElements: allErrorElements.length,
    activeErrorElements: activeErrorElements.length,
    currentStepId: currentStep ? currentStep.getAttribute('data-answer') : 'none',
    currentStepErrors: currentStepErrors.length,
    errorElementsDetails: []
  };

  // Analyze each error element in current step
  currentStepErrors.forEach((errorEl, index) => {
    const associatedInput = findAssociatedInput(errorEl);
    const isHidden = errorEl.offsetParent === null;
    const hasActiveClass = errorEl.classList.contains('active-error');
    const customText = errorEl.textContent?.trim() || '';
    
    const details = {
      index: index + 1,
      hasActiveClass,
      isHidden,
      customText: customText.substring(0, 50) + (customText.length > 50 ? '...' : ''),
      associatedFieldName: associatedInput ? (associatedInput.name || associatedInput.getAttribute('data-step-field-name')) : 'none',
      associatedFieldType: associatedInput ? associatedInput.type || associatedInput.tagName : 'none',
      cssClasses: Array.from(errorEl.classList),
      computedDisplay: getComputedStyle(errorEl).display,
      computedVisibility: getComputedStyle(errorEl).visibility,
      computedOpacity: getComputedStyle(errorEl).opacity
    };
    
    results.errorElements.errorElementsDetails.push(details);
    
    console.log(`Error Element ${index + 1}:`, details);
  });

  // 3. FIELD INTERACTION TESTS
  console.log('\n📝 3. FIELD INTERACTION TESTS');
  console.log('-----------------------------');
  
  const requiredFields = currentStep ? 
    currentStep.querySelectorAll('input[data-required], select[data-required], textarea[data-required]') : [];
  
  results.fieldInteractionTests = {
    totalRequiredFields: requiredFields.length,
    fieldTests: []
  };

  console.log(`Found ${requiredFields.length} required fields in current step`);

  // Test first few required fields
  const fieldsToTest = Array.from(requiredFields).slice(0, 3);
  
  fieldsToTest.forEach((field, index) => {
    const fieldName = field.name || field.getAttribute('data-step-field-name') || `field-${index}`;
    const associatedError = findAssociatedErrorElement(field);
    
    console.log(`\n🧪 Testing field ${index + 1}: ${fieldName}`);
    
    const testResult = {
      fieldName,
      fieldType: field.type || field.tagName,
      hasAssociatedError: !!associatedError,
      isEmpty: !field.value?.trim(),
      beforeTest: {
        errorVisible: associatedError ? associatedError.offsetParent !== null : false,
        hasActiveClass: associatedError ? associatedError.classList.contains('active-error') : false
      },
      afterBlur: {},
      afterLibraryCall: {}
    };

    // Test 1: Focus and blur (simulate user interaction)
    try {
      console.log(`   📍 Focusing field...`);
      field.focus();
      setTimeout(() => {
        console.log(`   👋 Blurring field...`);
        field.blur();
        
        setTimeout(() => {
          testResult.afterBlur = {
            errorVisible: associatedError ? associatedError.offsetParent !== null : false,
            hasActiveClass: associatedError ? associatedError.classList.contains('active-error') : false
          };
          
          console.log(`   After blur test:`, testResult.afterBlur);
        }, 200);
      }, 100);
    } catch (error) {
      testResult.afterBlur.error = error.message;
      console.log(`   ❌ Blur test failed:`, error.message);
    }

    // Test 2: Direct library call
    try {
      if (window.FormLib && window.FormLib.showError) {
        console.log(`   🔧 Calling FormLib.showError...`);
        window.FormLib.showError(fieldName, 'Test validation error');
        
        setTimeout(() => {
          testResult.afterLibraryCall = {
            errorVisible: associatedError ? associatedError.offsetParent !== null : false,
            hasActiveClass: associatedError ? associatedError.classList.contains('active-error') : false
          };
          
          console.log(`   After library call:`, testResult.afterLibraryCall);
          
          // Clean up test
          if (window.FormLib.clearError) {
            setTimeout(() => window.FormLib.clearError(fieldName), 1000);
          }
        }, 200);
      } else {
        testResult.afterLibraryCall.error = 'showError method not available';
      }
    } catch (error) {
      testResult.afterLibraryCall.error = error.message;
      console.log(`   ❌ Library call failed:`, error.message);
    }

    results.fieldInteractionTests.fieldTests.push(testResult);
  });

  // 4. NEXT BUTTON VALIDATION TEST
  console.log('\n🔄 4. NEXT BUTTON VALIDATION TEST');
  console.log('--------------------------------');
  
  const nextButton = currentStep ? currentStep.querySelector('[data-form="next-btn"]') : null;
  
  results.nextButtonTests = {
    nextButtonFound: !!nextButton,
    nextButtonText: nextButton ? nextButton.textContent?.trim() : 'none'
  };

  if (nextButton && requiredFields.length > 0) {
    console.log('🧪 Testing next button validation with empty required fields...');
    
    // Clear any existing values
    requiredFields.forEach(field => {
      if (field.type !== 'radio' && field.type !== 'checkbox') {
        field.value = '';
      }
    });
    
    console.log('📍 Clicking next button with empty fields...');
    
    // Simulate next button click
    try {
      nextButton.click();
      
      setTimeout(() => {
        // Check if errors appeared after next button click
        const errorsAfterNext = currentStep.querySelectorAll('.form_error-message.active-error');
        
        results.nextButtonTests.errorsAfterNextClick = errorsAfterNext.length;
        results.nextButtonTests.navigationBlocked = currentStep.offsetParent !== null; // Still visible = blocked
        
        console.log('Next button test results:', {
          errorsShown: errorsAfterNext.length,
          navigationBlocked: results.nextButtonTests.navigationBlocked,
          errorElements: Array.from(errorsAfterNext).map(el => ({
            text: el.textContent?.trim(),
            visible: el.offsetParent !== null
          }))
        });
      }, 500);
      
    } catch (error) {
      results.nextButtonTests.error = error.message;
      console.log('❌ Next button test failed:', error.message);
    }
  } else {
    console.log('⚠️ Cannot test next button - no button or required fields found');
  }

  // 5. CSS DIAGNOSTICS
  console.log('\n🎨 5. CSS DIAGNOSTICS');
  console.log('---------------------');
  
  // Check if error CSS is properly applied
  const testErrorElement = document.createElement('div');
  testErrorElement.className = 'form_error-message';
  testErrorElement.textContent = 'Test';
  testErrorElement.style.position = 'absolute';
  testErrorElement.style.left = '-9999px';
  document.body.appendChild(testErrorElement);
  
  const defaultStyles = window.getComputedStyle(testErrorElement);
  
  testErrorElement.classList.add('active-error');
  const activeStyles = window.getComputedStyle(testErrorElement);
  
  const cssCheck = {
    defaultHidden: defaultStyles.display === 'none' || defaultStyles.visibility === 'hidden',
    activeVisible: activeStyles.display !== 'none' && activeStyles.visibility !== 'hidden',
    defaultDisplay: defaultStyles.display,
    activeDisplay: activeStyles.display,
    defaultVisibility: defaultStyles.visibility,
    activeVisibility: activeStyles.visibility,
    defaultOpacity: defaultStyles.opacity,
    activeOpacity: activeStyles.opacity
  };
  
  document.body.removeChild(testErrorElement);
  
  console.log('CSS Check Results:', cssCheck);

  // 6. RECOMMENDATIONS
  console.log('\n💡 6. RECOMMENDATIONS');
  console.log('---------------------');
  
  if (results.errorElements.activeErrorElements === 0 && requiredFields.length > 0) {
    results.recommendations.push('🚨 CRITICAL: No error elements have .active-error class');
  }
  
  if (!results.libraryStatus.showError) {
    results.recommendations.push('🔧 Library showError method not available');
  }
  
  if (!cssCheck.defaultHidden) {
    results.recommendations.push('🎨 Add CSS to hide .form_error-message by default');
  }
  
  if (!cssCheck.activeVisible) {
    results.recommendations.push('🎨 Add CSS to show .form_error-message.active-error');
  }
  
  if (results.recommendations.length === 0) {
    results.recommendations.push('✅ Ready for detailed debugging');
  }
  
  results.recommendations.forEach(rec => console.log(`   ${rec}`));

  // Store results globally
  window.errorVisibilityTestResults = results;
  console.log('\n📁 Full results stored in: window.errorVisibilityTestResults');
  
  return results;
}

// Helper functions
function findAssociatedInput(errorElement) {
  // Look in form-field_wrapper
  const wrapper = errorElement.closest('.form-field_wrapper');
  if (wrapper) {
    return wrapper.querySelector('input, select, textarea');
  }
  
  // Look in parent element
  const parent = errorElement.parentElement;
  return parent?.querySelector('input, select, textarea') || null;
}

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

// Auto-run the test
testErrorVisibility(); 