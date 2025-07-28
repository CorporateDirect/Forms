/**
 * AUTOMATIC ERROR STATE TEST
 * Tests the new automatic .active-error application to .form_error-message elements
 */

function testAutoErrorState() {
  console.log('🧪 AUTOMATIC ERROR STATE TEST');
  console.log('=============================');
  
  const results = {
    errorElements: {},
    validationBehavior: {},
    customMessages: {},
    recommendations: []
  };

  // 1. ERROR ELEMENT DETECTION
  console.log('\n📋 1. ERROR ELEMENT DETECTION');
  console.log('-----------------------------');
  
  const allErrorElements = document.querySelectorAll('.form_error-message');
  const visibleErrorElements = Array.from(allErrorElements).filter(el => el.offsetParent !== null);
  const hiddenErrorElements = Array.from(allErrorElements).filter(el => el.offsetParent === null);
  const activeErrorElements = document.querySelectorAll('.form_error-message.active-error');
  
  results.errorElements = {
    totalErrorElements: allErrorElements.length,
    visibleByDefault: visibleErrorElements.length,
    hiddenByDefault: hiddenErrorElements.length,
    currentlyActive: activeErrorElements.length,
    properlyHidden: hiddenErrorElements.length === allErrorElements.length - activeErrorElements.length
  };

  console.log('Error Element Status:', results.errorElements);
  
  if (results.errorElements.visibleByDefault > results.errorElements.currentlyActive) {
    console.log('⚠️ Some error messages are visible without .active-error class');
    results.recommendations.push('Add CSS to hide .form_error-message by default');
  } else {
    console.log('✅ Error messages properly hidden by default');
  }

  // 2. CUSTOM MESSAGE DETECTION
  console.log('\n📝 2. CUSTOM MESSAGE DETECTION');
  console.log('------------------------------');
  
  const customMessages = [];
  allErrorElements.forEach((element, index) => {
    const text = element.textContent?.trim() || '';
    const isCustom = text && !text.includes('This is some text inside of a div block');
    const associatedInput = findAssociatedInput(element);
    
    if (isCustom && associatedInput) {
      customMessages.push({
        index: index + 1,
        fieldName: associatedInput.name || associatedInput.getAttribute('data-step-field-name') || 'unnamed',
        customText: text,
        element,
        input: associatedInput
      });
    }
  });

  results.customMessages = {
    totalCustomMessages: customMessages.length,
    messages: customMessages.map(msg => ({
      fieldName: msg.fieldName,
      text: msg.customText.substring(0, 50) + (msg.customText.length > 50 ? '...' : '')
    }))
  };

  console.log('Custom Messages Found:', results.customMessages);

  // 3. TEST VALIDATION BEHAVIOR
  console.log('\n🔧 3. TESTING VALIDATION BEHAVIOR');
  console.log('----------------------------------');
  
  // Find some required fields to test
  const requiredFields = document.querySelectorAll('input[data-required], select[data-required], textarea[data-required]');
  const testableFields = Array.from(requiredFields).filter(field => field.offsetParent !== null).slice(0, 3);
  
  results.validationBehavior = {
    totalRequiredFields: requiredFields.length,
    testableFields: testableFields.length,
    validationTests: []
  };

  testableFields.forEach((field, index) => {
    const fieldName = field.name || field.getAttribute('data-step-field-name') || `field-${index}`;
    const associatedError = findAssociatedErrorElement(field);
    
    const testResult = {
      fieldName,
      hasAssociatedError: !!associatedError,
      errorElementClass: associatedError?.className || 'none',
      isCurrentlyVisible: associatedError ? associatedError.offsetParent !== null : false
    };

    // Test if we can trigger validation
    try {
      // Focus and blur to trigger validation
      field.focus();
      field.blur();
      
      // Check if error state changed
      setTimeout(() => {
        const isActiveAfterBlur = associatedError?.classList.contains('active-error') || false;
        testResult.activatedOnBlur = isActiveAfterBlur;
        
        console.log(`Field ${index + 1} (${fieldName}):`, {
          hasError: testResult.hasAssociatedError,
          activatedOnBlur: isActiveAfterBlur,
          errorVisible: associatedError ? associatedError.offsetParent !== null : false
        });
      }, 100);
      
    } catch (error) {
      testResult.testError = error.message;
      console.log(`❌ Error testing field ${fieldName}:`, error.message);
    }
    
    results.validationBehavior.validationTests.push(testResult);
  });

  // 4. LIBRARY INTEGRATION CHECK
  console.log('\n🔗 4. LIBRARY INTEGRATION CHECK');
  console.log('-------------------------------');
  
  const libraryMethods = {
    showError: typeof window.FormLib?.showError === 'function',
    clearError: typeof window.FormLib?.clearError === 'function',
    hasError: typeof window.FormLib?.hasError === 'function',
    validateField: typeof window.FormLib?.validateField === 'function'
  };

  console.log('Library Methods Available:', libraryMethods);

  // Test library error functions
  if (libraryMethods.showError && customMessages.length > 0) {
    const testMessage = customMessages[0];
    console.log(`\n🧪 Testing library showError with field: ${testMessage.fieldName}`);
    
    try {
      window.FormLib.showError(testMessage.fieldName, 'Test error message');
      
      setTimeout(() => {
        const isActive = testMessage.element.classList.contains('active-error');
        const isVisible = testMessage.element.offsetParent !== null;
        
        console.log('Library Error Test Result:', {
          fieldName: testMessage.fieldName,
          hasActiveClass: isActive,
          isVisible: isVisible,
          success: isActive && isVisible
        });
        
        // Clean up test
        if (libraryMethods.clearError) {
          window.FormLib.clearError(testMessage.fieldName);
        }
      }, 100);
      
    } catch (error) {
      console.log('❌ Library error test failed:', error.message);
    }
  }

  // 5. GENERATE RECOMMENDATIONS
  console.log('\n💡 5. RECOMMENDATIONS');
  console.log('---------------------');
  
  if (results.errorElements.visibleByDefault > 0) {
    results.recommendations.push('🎨 Add CSS to hide .form_error-message by default');
  }
  
  if (results.customMessages.totalCustomMessages === 0) {
    results.recommendations.push('📝 Consider adding custom error messages to .form_error-message elements');
  }
  
  if (!libraryMethods.showError) {
    results.recommendations.push('🔧 Ensure FormLib is loaded and initialized');
  }
  
  if (results.validationBehavior.testableFields === 0) {
    results.recommendations.push('⚠️ No testable required fields found in current step');
  }

  if (results.recommendations.length === 0) {
    results.recommendations.push('✅ Auto error state system appears to be working correctly!');
  }

  results.recommendations.forEach(rec => console.log(`   ${rec}`));

  // Store results globally
  window.autoErrorStateResults = results;
  console.log('\n📁 Full results stored in: window.autoErrorStateResults');
  
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
testAutoErrorState(); 