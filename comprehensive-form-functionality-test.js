/**
 * COMPREHENSIVE FORM FUNCTIONALITY TEST
 * Complete diagnostic script for all form behaviors and interactions
 */

function comprehensiveFormTest() {
  console.log('🔬 COMPREHENSIVE FORM FUNCTIONALITY TEST');
  console.log('========================================');
  
  const results = {
    libraryStatus: {},
    currentStep: {},
    fieldAnalysis: {},
    validationBehavior: {},
    errorDisplay: {},
    focusBehavior: {},
    navigationTests: {},
    userInteractionTests: {},
    issuesFound: [],
    recommendations: []
  };

  // 1. LIBRARY STATUS & VERSION CHECK
  console.log('\n📚 1. LIBRARY STATUS & VERSION CHECK');
  console.log('-----------------------------------');
  
  results.libraryStatus = {
    formLibExists: typeof window.FormLib !== 'undefined',
    version: window.FormLib?.version || 'unknown',
    availableMethods: window.FormLib ? Object.keys(window.FormLib).filter(key => typeof window.FormLib[key] === 'function') : [],
    scriptUrl: Array.from(document.scripts).find(script => 
      script.src.includes('form-functionality-library') || 
      script.src.includes('unpkg.com')
    )?.src || 'not found'
  };

  console.log('Library Status:', results.libraryStatus);
  
  // Check for CSS injection
  const injectedCSS = document.querySelector('style[data-form-lib="error-styles"]');
  results.libraryStatus.cssAutoInjected = !!injectedCSS;
  console.log('CSS Auto-Injected:', results.libraryStatus.cssAutoInjected);

  // 2. CURRENT STEP ANALYSIS
  console.log('\n📍 2. CURRENT STEP ANALYSIS');
  console.log('---------------------------');
  
  const currentStep = document.querySelector('.step_wrapper:not([style*="display: none"])');
  const allSteps = document.querySelectorAll('.step_wrapper[data-answer]');
  const visibleSteps = Array.from(allSteps).filter(step => step.offsetParent !== null);

  results.currentStep = {
    currentStepId: currentStep?.getAttribute('data-answer') || 'none',
    currentStepGoTo: currentStep?.getAttribute('data-go-to') || 'none',
    totalSteps: allSteps.length,
    visibleSteps: visibleSteps.length,
    isCurrentStepVisible: currentStep ? currentStep.offsetParent !== null : false
  };

  console.log('Current Step:', results.currentStep);

  // 3. COMPREHENSIVE FIELD ANALYSIS
  console.log('\n📋 3. COMPREHENSIVE FIELD ANALYSIS');
  console.log('----------------------------------');
  
  if (currentStep) {
    const allFields = currentStep.querySelectorAll('input, select, textarea');
    const requiredFields = currentStep.querySelectorAll('input[data-required], select[data-required], textarea[data-required]');
    const fieldsWithValues = Array.from(allFields).filter(field => field.value?.trim());
    const emptyRequiredFields = Array.from(requiredFields).filter(field => !field.value?.trim());

    results.fieldAnalysis = {
      totalFields: allFields.length,
      requiredFields: requiredFields.length,
      fieldsWithValues: fieldsWithValues.length,
      emptyRequiredFields: emptyRequiredFields.length,
      fieldDetails: []
    };

    // Analyze each field in detail
    allFields.forEach((field, index) => {
      const fieldName = field.name || field.getAttribute('data-step-field-name') || `field-${index}`;
      const isRequired = field.hasAttribute('data-required');
      const hasValue = !!field.value?.trim();
      const associatedError = findAssociatedErrorElement(field);
      const wrapper = field.closest('.form-field_wrapper');

      const details = {
        index: index + 1,
        fieldName,
        fieldType: field.type || field.tagName.toLowerCase(),
        isRequired,
        hasValue,
        value: hasValue ? field.value.substring(0, 20) + (field.value.length > 20 ? '...' : '') : '',
        hasAssociatedError: !!associatedError,
        errorHasActiveClass: associatedError ? associatedError.classList.contains('active-error') : false,
        errorIsVisible: associatedError ? associatedError.offsetParent !== null : false,
        hasWrapper: !!wrapper,
        wrapperClasses: wrapper ? Array.from(wrapper.classList) : [],
        fieldClasses: Array.from(field.classList),
        isFocusable: !field.disabled && field.tabIndex !== -1,
        element: field
      };

      results.fieldAnalysis.fieldDetails.push(details);
      
      if (isRequired || hasValue || associatedError) {
        console.log(`Field ${index + 1} (${fieldName}):`, {
          type: details.fieldType,
          required: isRequired,
          hasValue: hasValue,
          errorActive: details.errorHasActiveClass,
          errorVisible: details.errorIsVisible
        });
      }
    });

    console.log('Field Analysis Summary:', {
      total: results.fieldAnalysis.totalFields,
      required: results.fieldAnalysis.requiredFields,
      filled: results.fieldAnalysis.fieldsWithValues,
      emptyRequired: results.fieldAnalysis.emptyRequiredFields
    });
  }

  // 4. VALIDATION BEHAVIOR TESTING
  console.log('\n🔧 4. VALIDATION BEHAVIOR TESTING');
  console.log('---------------------------------');
  
  results.validationBehavior = {
    libraryMethods: {
      validateField: typeof window.FormLib?.validateField === 'function',
      showError: typeof window.FormLib?.showError === 'function',
      clearError: typeof window.FormLib?.clearError === 'function'
    },
    fieldValidationTests: []
  };

  // Test validation on first few empty required fields
  const emptyRequiredFields = results.fieldAnalysis.fieldDetails?.filter(f => f.isRequired && !f.hasValue).slice(0, 3) || [];
  
  console.log(`Testing validation on ${emptyRequiredFields.length} empty required fields...`);

  emptyRequiredFields.forEach((fieldData, index) => {
    console.log(`\n🧪 Testing validation: ${fieldData.fieldName}`);
    
    const testResult = {
      fieldName: fieldData.fieldName,
      beforeTest: {
        hasActiveError: fieldData.errorHasActiveClass,
        errorVisible: fieldData.errorIsVisible
      },
      afterValidation: {},
      focusBehavior: {}
    };

    // Test library validation
    try {
      if (window.FormLib?.validateField) {
        const validationResult = window.FormLib.validateField(fieldData.fieldName);
        const errorAfter = findAssociatedErrorElement(fieldData.element);
        
        testResult.afterValidation = {
          validationPassed: validationResult,
          hasActiveError: errorAfter ? errorAfter.classList.contains('active-error') : false,
          errorVisible: errorAfter ? errorAfter.offsetParent !== null : false
        };
        
        console.log(`   Validation result: ${validationResult ? 'PASS' : 'FAIL'}`);
        console.log(`   Error active: ${testResult.afterValidation.hasActiveError}`);
        console.log(`   Error visible: ${testResult.afterValidation.errorVisible}`);
      }
    } catch (error) {
      testResult.afterValidation.error = error.message;
      console.log(`   ❌ Validation failed: ${error.message}`);
    }

    results.validationBehavior.fieldValidationTests.push(testResult);
  });

  // 5. ERROR DISPLAY SYSTEM TEST
  console.log('\n🚨 5. ERROR DISPLAY SYSTEM TEST');
  console.log('-------------------------------');
  
  const allErrorElements = document.querySelectorAll('.form_error-message');
  const activeErrors = document.querySelectorAll('.form_error-message.active-error');
  const visibleErrors = Array.from(allErrorElements).filter(el => el.offsetParent !== null);
  const currentStepErrors = currentStep ? currentStep.querySelectorAll('.form_error-message') : [];

  results.errorDisplay = {
    totalErrorElements: allErrorElements.length,
    currentStepErrors: currentStepErrors.length,
    activeErrors: activeErrors.length,
    visibleErrors: visibleErrors.length,
    cssStatus: checkErrorCSS(),
    errorElementDetails: []
  };

  currentStepErrors.forEach((errorEl, index) => {
    const associatedField = findAssociatedInput(errorEl);
    const details = {
      index: index + 1,
      hasActiveClass: errorEl.classList.contains('active-error'),
      isVisible: errorEl.offsetParent !== null,
      customText: errorEl.textContent?.trim().substring(0, 50) || '',
      associatedFieldName: associatedField ? (associatedField.name || associatedField.getAttribute('data-step-field-name')) : 'none',
      cssDisplay: getComputedStyle(errorEl).display,
      cssVisibility: getComputedStyle(errorEl).visibility,
      cssOpacity: getComputedStyle(errorEl).opacity
    };
    
    results.errorDisplay.errorElementDetails.push(details);
  });

  console.log('Error Display Status:', {
    total: results.errorDisplay.totalErrorElements,
    currentStep: results.errorDisplay.currentStepErrors,
    active: results.errorDisplay.activeErrors,
    visible: results.errorDisplay.visibleErrors,
    cssWorking: results.errorDisplay.cssStatus.defaultHidden && results.errorDisplay.cssStatus.activeVisible
  });

  // 6. FOCUS BEHAVIOR ANALYSIS
  console.log('\n👁️ 6. FOCUS BEHAVIOR ANALYSIS');
  console.log('-----------------------------');
  
  const activeElement = document.activeElement;
  const focusableElements = currentStep ? 
    currentStep.querySelectorAll('input, select, textarea, button, a[href]') : [];
  
  results.focusBehavior = {
    currentlyFocused: {
      tagName: activeElement?.tagName || 'none',
      type: activeElement?.type || 'none',
      name: activeElement?.name || activeElement?.getAttribute('data-step-field-name') || 'none',
      classList: activeElement ? Array.from(activeElement.classList) : []
    },
    focusableElementsCount: focusableElements.length,
    scrollBehaviorTests: []
  };

  console.log('Currently focused element:', results.focusBehavior.currentlyFocused);

  // Test focus behavior on first empty required field
  if (emptyRequiredFields.length > 0) {
    const testField = emptyRequiredFields[0];
    console.log(`\n🧪 Testing focus behavior on: ${testField.fieldName}`);
    
    const scrollBefore = window.pageYOffset;
    const elementRect = testField.element.getBoundingClientRect();
    
    try {
      // Test programmatic focus
      testField.element.focus();
      
      setTimeout(() => {
        const scrollAfter = window.pageYOffset;
        const newActiveElement = document.activeElement;
        
        const focusTest = {
          fieldName: testField.fieldName,
          scrollBefore,
          scrollAfter,
          scrollDifference: scrollAfter - scrollBefore,
          elementRect: {
            top: elementRect.top,
            bottom: elementRect.bottom,
            inViewport: elementRect.top >= 0 && elementRect.bottom <= window.innerHeight
          },
          focusSuccessful: newActiveElement === testField.element,
          autoScrollOccurred: Math.abs(scrollAfter - scrollBefore) > 10
        };
        
        results.focusBehavior.scrollBehaviorTests.push(focusTest);
        
        console.log('Focus test result:', {
          focused: focusTest.focusSuccessful,
          scrolled: focusTest.autoScrollOccurred,
          scrollDistance: focusTest.scrollDifference
        });
        
        // Restore focus
        if (newActiveElement && newActiveElement !== testField.element) {
          newActiveElement.focus();
        }
      }, 100);
      
    } catch (error) {
      console.log(`   ❌ Focus test failed: ${error.message}`);
    }
  }

  // 7. NAVIGATION BUTTON TESTS
  console.log('\n🧭 7. NAVIGATION BUTTON TESTS');
  console.log('-----------------------------');
  
  const nextButton = currentStep ? currentStep.querySelector('[data-form="next-btn"]') : null;
  const backButton = currentStep ? currentStep.querySelector('[data-form="back-btn"]') : null;
  
  results.navigationTests = {
    nextButton: {
      found: !!nextButton,
      text: nextButton?.textContent?.trim() || 'none',
      href: nextButton?.getAttribute('href') || 'none',
      classes: nextButton ? Array.from(nextButton.classList) : []
    },
    backButton: {
      found: !!backButton,
      text: backButton?.textContent?.trim() || 'none',
      href: backButton?.getAttribute('href') || 'none',
      classes: backButton ? Array.from(backButton.classList) : []
    },
    nextButtonValidationTest: null
  };

  console.log('Navigation buttons:', {
    next: results.navigationTests.nextButton.found,
    back: results.navigationTests.backButton.found
  });

  // Test next button validation behavior
  if (nextButton && results.fieldAnalysis.emptyRequiredFields > 0) {
    console.log('\n🧪 Testing next button validation with empty required fields...');
    
    const beforeClick = {
      currentStep: results.currentStep.currentStepId,
      activeErrors: document.querySelectorAll('.form_error-message.active-error').length,
      focusedElement: document.activeElement?.name || 'none'
    };
    
    // Simulate next button click
    try {
      console.log('   Clicking next button...');
      nextButton.click();
      
      setTimeout(() => {
        const afterClick = {
          currentStep: document.querySelector('.step_wrapper:not([style*="display: none"])')?.getAttribute('data-answer') || 'none',
          activeErrors: document.querySelectorAll('.form_error-message.active-error').length,
          focusedElement: document.activeElement?.name || document.activeElement?.tagName || 'none',
          navigationBlocked: beforeClick.currentStep === afterClick.currentStep
        };
        
        results.navigationTests.nextButtonValidationTest = {
          beforeClick,
          afterClick,
          validationWorking: afterClick.navigationBlocked && afterClick.activeErrors > beforeClick.activeErrors,
          focusChanged: beforeClick.focusedElement !== afterClick.focusedElement,
          errorsShown: afterClick.activeErrors - beforeClick.activeErrors
        };
        
        console.log('Next button test result:', {
          navigationBlocked: afterClick.navigationBlocked,
          errorsShown: results.navigationTests.nextButtonValidationTest.errorsShown,
          focusChanged: results.navigationTests.nextButtonValidationTest.focusChanged,
          newFocus: afterClick.focusedElement
        });
        
      }, 300);
      
    } catch (error) {
      results.navigationTests.nextButtonValidationTest = { error: error.message };
      console.log(`   ❌ Next button test failed: ${error.message}`);
    }
  }

  // 8. USER INTERACTION SIMULATION
  console.log('\n👤 8. USER INTERACTION SIMULATION');
  console.log('---------------------------------');
  
  results.userInteractionTests = {
    fieldBlurTests: [],
    formFillSequence: []
  };

  // Test blur behavior on fields
  if (results.fieldAnalysis.fieldDetails && results.fieldAnalysis.fieldDetails.length > 0) {
    const testFields = results.fieldAnalysis.fieldDetails.filter(f => f.isRequired).slice(0, 2);
    
    testFields.forEach((fieldData, index) => {
      console.log(`\n🧪 Testing blur behavior: ${fieldData.fieldName}`);
      
      const blurTest = {
        fieldName: fieldData.fieldName,
        beforeBlur: {
          hasValue: fieldData.hasValue,
          errorActive: fieldData.errorHasActiveClass
        },
        afterBlur: {}
      };
      
      try {
        const field = fieldData.element;
        
        // Focus, then blur without value
        field.focus();
        setTimeout(() => {
          field.blur();
          
          setTimeout(() => {
            const errorAfter = findAssociatedErrorElement(field);
            blurTest.afterBlur = {
              errorActive: errorAfter ? errorAfter.classList.contains('active-error') : false,
              errorVisible: errorAfter ? errorAfter.offsetParent !== null : false,
              focusChanged: document.activeElement !== field
            };
            
            console.log(`   Blur test: errorActive=${blurTest.afterBlur.errorActive}, visible=${blurTest.afterBlur.errorVisible}`);
            
          }, 100);
        }, 100);
        
      } catch (error) {
        blurTest.afterBlur.error = error.message;
        console.log(`   ❌ Blur test failed: ${error.message}`);
      }
      
      results.userInteractionTests.fieldBlurTests.push(blurTest);
    });
  }

  // 9. ISSUE DETECTION & RECOMMENDATIONS
  console.log('\n🔍 9. ISSUE DETECTION & RECOMMENDATIONS');
  console.log('--------------------------------------');
  
  // Detect issues
  if (!results.libraryStatus.formLibExists) {
    results.issuesFound.push('🚨 CRITICAL: FormLib not loaded');
  }
  
  if (!results.libraryStatus.cssAutoInjected) {
    results.issuesFound.push('🎨 CSS not auto-injected');
  }
  
  if (results.fieldAnalysis.emptyRequiredFields > 0 && results.errorDisplay.activeErrors === 0) {
    results.issuesFound.push('🔧 Empty required fields not showing errors');
  }
  
  if (results.navigationTests.nextButtonValidationTest?.validationWorking === false) {
    results.issuesFound.push('🚫 Next button validation not working');
  }
  
  if (results.focusBehavior.scrollBehaviorTests.some(test => test.autoScrollOccurred)) {
    results.issuesFound.push('👁️ ISSUE: Auto-focus/scroll interfering with user experience');
  }
  
  // Generate recommendations
  if (results.issuesFound.length === 0) {
    results.recommendations.push('✅ All systems appear to be working correctly');
  } else {
    results.issuesFound.forEach(issue => {
      if (issue.includes('Auto-focus')) {
        results.recommendations.push('🔧 Remove or modify auto-scroll behavior in validation');
      } else if (issue.includes('CSS')) {
        results.recommendations.push('🎨 Ensure CSS injection is working in initErrors()');
      } else if (issue.includes('errors')) {
        results.recommendations.push('🚨 Check error display logic and .active-error application');
      } else if (issue.includes('validation')) {
        results.recommendations.push('🔍 Debug next button validation in multiStep.ts');
      }
    });
  }
  
  console.log('\n📋 ISSUES FOUND:');
  results.issuesFound.forEach(issue => console.log(`   ${issue}`));
  
  console.log('\n💡 RECOMMENDATIONS:');
  results.recommendations.forEach(rec => console.log(`   ${rec}`));

  // Store comprehensive results
  window.comprehensiveFormTestResults = results;
  console.log('\n📁 Complete test results stored in: window.comprehensiveFormTestResults');
  console.log('\n🔬 COMPREHENSIVE TEST COMPLETE');
  
  return results;
}

// Helper functions
function findAssociatedInput(errorElement) {
  const wrapper = errorElement.closest('.form-field_wrapper');
  if (wrapper) {
    return wrapper.querySelector('input, select, textarea');
  }
  const parent = errorElement.parentElement;
  return parent?.querySelector('input, select, textarea') || null;
}

function findAssociatedErrorElement(inputElement) {
  const wrapper = inputElement.closest('.form-field_wrapper');
  if (wrapper) {
    return wrapper.querySelector('.form_error-message');
  }
  const parent = inputElement.parentElement;
  return parent?.querySelector('.form_error-message') || null;
}

function checkErrorCSS() {
  const testError = document.createElement('div');
  testError.className = 'form_error-message';
  testError.style.position = 'absolute';
  testError.style.left = '-9999px';
  document.body.appendChild(testError);
  
  const defaultStyles = window.getComputedStyle(testError);
  testError.classList.add('active-error');
  const activeStyles = window.getComputedStyle(testError);
  
  const result = {
    defaultHidden: defaultStyles.display === 'none',
    activeVisible: activeStyles.display !== 'none'
  };
  
  document.body.removeChild(testError);
  return result;
}

// Auto-run the comprehensive test
comprehensiveFormTest(); 