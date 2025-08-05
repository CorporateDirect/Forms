/**
 * COMPREHENSIVE .active-error CLASS DEBUG SCRIPT
 * Diagnoses why .form_error-message elements aren't getting .active-error class
 */

function debugActiveErrorClass() {
  console.log('🔍 DEBUGGING .active-error CLASS APPLICATION');
  console.log('============================================');
  
  const results = {
    fieldMapping: {},
    errorElements: {},
    libraryState: {},
    testResults: {},
    recommendations: []
  };

  // 1. CHECK FIELD NAME MAPPING
  console.log('\n📋 1. FIELD NAME MAPPING CHECK');
  console.log('-----------------------------');
  
  const allInputs = document.querySelectorAll('input, select, textarea');
  const fieldsWithNames = [];
  const fieldsWithoutNames = [];
  
  allInputs.forEach((input, index) => {
    const name = input.name || input.getAttribute('data-step-field-name');
    const fieldInfo = {
      index: index + 1,
      element: input,
      tagName: input.tagName,
      type: input.type || 'N/A',
      name: input.name || 'none',
      dataStepFieldName: input.getAttribute('data-step-field-name') || 'none',
      effectiveName: name || 'MISSING',
      id: input.id || 'none',
      required: input.hasAttribute('required') || input.hasAttribute('data-required')
    };
    
    if (name) {
      fieldsWithNames.push(fieldInfo);
    } else {
      fieldsWithoutNames.push(fieldInfo);
    }
  });
  
  results.fieldMapping = {
    totalFields: allInputs.length,
    fieldsWithNames: fieldsWithNames.length,
    fieldsWithoutNames: fieldsWithoutNames.length,
    fieldsWithNamesDetails: fieldsWithNames.map(f => ({
      name: f.effectiveName,
      type: f.type,
      required: f.required
    })),
    fieldsWithoutNamesDetails: fieldsWithoutNames.map(f => ({
      index: f.index,
      tagName: f.tagName,
      type: f.type,
      id: f.id
    }))
  };

  console.log('Field Mapping Results:', results.fieldMapping);
  
  if (fieldsWithoutNames.length > 0) {
    console.log('⚠️ Found fields without name attributes:', fieldsWithoutNames.length);
    results.recommendations.push('Add name attributes or data-step-field-name to fields without names');
  }

  // 2. CHECK ERROR ELEMENT DISCOVERY
  console.log('\n🎯 2. ERROR ELEMENT DISCOVERY CHECK');
  console.log('----------------------------------');
  
  const allErrorElements = document.querySelectorAll('.form_error-message');
  const errorElementDetails = [];
  
  allErrorElements.forEach((errorEl, index) => {
    // Try to find associated input field
    let associatedField = null;
    let discoveryMethod = 'none';
    
    // Method 1: Look in form-field_wrapper
    const wrapper = errorEl.closest('.form-field_wrapper');
    if (wrapper) {
      associatedField = wrapper.querySelector('input, select, textarea');
      if (associatedField) discoveryMethod = 'form-field_wrapper';
    }
    
    // Method 2: Look in parent element
    if (!associatedField) {
      const parent = errorEl.parentElement;
      if (parent) {
        associatedField = parent.querySelector('input, select, textarea');
        if (associatedField) discoveryMethod = 'parent_element';
      }
    }
    
    // Method 3: Look for data-field attribute
    if (!associatedField) {
      const dataField = errorEl.getAttribute('data-field');
      if (dataField) {
        associatedField = document.querySelector(`input[name="${dataField}"], select[name="${dataField}"], textarea[name="${dataField}"]`);
        if (associatedField) discoveryMethod = 'data-field_attribute';
      }
    }
    
    const fieldName = associatedField ? 
      (associatedField.name || associatedField.getAttribute('data-step-field-name')) : 
      'NO_FIELD_FOUND';
    
    const errorDetail = {
      index: index + 1,
      element: errorEl,
      text: errorEl.textContent?.trim() || '',
      hasWrapper: !!wrapper,
      discoveryMethod,
      associatedFieldName: fieldName,
      hasActiveError: errorEl.classList.contains('active-error'),
      isVisible: errorEl.offsetParent !== null,
      classes: Array.from(errorEl.classList),
      dataField: errorEl.getAttribute('data-field') || 'none'
    };
    
    errorElementDetails.push(errorDetail);
  });
  
  results.errorElements = {
    totalErrorElements: allErrorElements.length,
    elementsWithFields: errorElementDetails.filter(e => e.associatedFieldName !== 'NO_FIELD_FOUND').length,
    elementsWithoutFields: errorElementDetails.filter(e => e.associatedFieldName === 'NO_FIELD_FOUND').length,
    elementsWithActiveError: errorElementDetails.filter(e => e.hasActiveError).length,
    details: errorElementDetails.map(e => ({
      index: e.index,
      fieldName: e.associatedFieldName,
      discoveryMethod: e.discoveryMethod,
      hasActiveError: e.hasActiveError,
      isVisible: e.isVisible,
      text: e.text.substring(0, 50)
    }))
  };

  console.log('Error Element Discovery Results:', results.errorElements);

  // 3. CHECK LIBRARY STATE
  console.log('\n📚 3. LIBRARY STATE CHECK');
  console.log('-------------------------');
  
  const libraryAvailable = typeof window.FormLib !== 'undefined';
  const methodsAvailable = {};
  
  if (libraryAvailable) {
    methodsAvailable.showError = typeof window.FormLib.showError === 'function';
    methodsAvailable.clearError = typeof window.FormLib.clearError === 'function';
    methodsAvailable.initErrors = typeof window.FormLib.initErrors === 'function';
    methodsAvailable.hasError = typeof window.FormLib.hasError === 'function';
  }
  
  results.libraryState = {
    libraryAvailable,
    methodsAvailable,
    errorConfigsSize: 'unknown' // This would need to be exposed from the library
  };

  console.log('Library State:', results.libraryState);

  // 4. CONDUCT ERROR TRIGGER TESTS
  console.log('\n🧪 4. ERROR TRIGGER TESTS');
  console.log('-------------------------');
  
  if (libraryAvailable && methodsAvailable.showError) {
    const testResults = [];
    
    // Test with fields that have names and associated error elements
    const testableFields = errorElementDetails.filter(e => 
      e.associatedFieldName !== 'NO_FIELD_FOUND' && 
      e.associatedFieldName !== 'none'
    ).slice(0, 3);
    
    testableFields.forEach((errorDetail, index) => {
      const fieldName = errorDetail.associatedFieldName;
      console.log(`\nTesting field: ${fieldName}`);
      
      try {
        // Record initial state
        const initialState = {
          hasActiveError: errorDetail.element.classList.contains('active-error'),
          isVisible: errorDetail.element.offsetParent !== null
        };
        
        // Trigger error
        window.FormLib.showError(fieldName, `Test error for ${fieldName}`);
        
        // Check new state immediately
        const newState = {
          hasActiveError: errorDetail.element.classList.contains('active-error'),
          isVisible: errorDetail.element.offsetParent !== null,
          textChanged: errorDetail.element.textContent?.includes('Test error')
        };
        
        const testResult = {
          fieldName,
          initialState,
          newState,
          successfullyTriggered: newState.hasActiveError && !initialState.hasActiveError
        };
        
        testResults.push(testResult);
        console.log(`  Result:`, testResult);
        
        // Clean up after 1 second
        setTimeout(() => {
          if (window.FormLib.clearError) {
            window.FormLib.clearError(fieldName);
          }
        }, 1000);
        
      } catch (error) {
        testResults.push({
          fieldName,
          error: error.message,
          successfullyTriggered: false
        });
        console.log(`  ❌ Error testing ${fieldName}:`, error.message);
      }
    });
    
    results.testResults = {
      testsPerformed: testResults.length,
      successfulTests: testResults.filter(t => t.successfullyTriggered).length,
      failedTests: testResults.filter(t => !t.successfullyTriggered).length,
      details: testResults
    };
  } else {
    results.testResults = {
      error: 'FormLib not available or showError method missing'
    };
  }

  console.log('Test Results:', results.testResults);

  // 5. GENERATE RECOMMENDATIONS
  console.log('\n💡 5. RECOMMENDATIONS');
  console.log('--------------------');
  
  if (results.fieldMapping.fieldsWithoutNames > 0) {
    results.recommendations.push(`🔧 Add name attributes to ${results.fieldMapping.fieldsWithoutNames} fields without names`);
  }
  
  if (results.errorElements.elementsWithoutFields > 0) {
    results.recommendations.push(`🎯 ${results.errorElements.elementsWithoutFields} error elements can't find their associated input fields`);
  }
  
  if (!results.libraryState.libraryAvailable) {
    results.recommendations.push('📚 FormLib not found - ensure library is loaded');
  }
  
  if (results.testResults.failedTests > 0) {
    results.recommendations.push(`🧪 ${results.testResults.failedTests} error trigger tests failed`);
  }
  
  if (results.errorElements.totalErrorElements > 0 && results.errorElements.elementsWithActiveError === 0) {
    results.recommendations.push('🚨 No error elements currently have .active-error class - this is the main issue');
  }

  results.recommendations.forEach(rec => console.log(rec));

  // 6. SUMMARY
  console.log('\n📊 SUMMARY');
  console.log('----------');
  console.log({
    fieldsTotal: results.fieldMapping.totalFields,
    fieldsWithNames: results.fieldMapping.fieldsWithNames,
    errorElementsTotal: results.errorElements.totalErrorElements,
    errorElementsWithFields: results.errorElements.elementsWithFields,
    testsSuccessful: results.testResults.successfulTests || 0,
    mainIssues: results.recommendations.length
  });

  return results;
}

// Auto-run the debug when script is loaded
if (typeof window !== 'undefined') {
  // Wait for DOM and library to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(debugActiveErrorClass, 1000);
    });
  } else {
    setTimeout(debugActiveErrorClass, 1000);
  }
} 