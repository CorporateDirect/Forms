// ERROR MESSAGE VISIBILITY DEBUG SCRIPT
// Comprehensive debugging for .form_error-message visibility issues

console.log('🔍 ERROR MESSAGE VISIBILITY DEBUG STARTING...');

// Helper function to get computed styles
function getComputedStyleInfo(element) {
  if (!element) return { error: 'Element not found' };
  
  const computed = window.getComputedStyle(element);
  return {
    display: computed.display,
    visibility: computed.visibility,
    opacity: computed.opacity,
    height: computed.height,
    maxHeight: computed.maxHeight,
    overflow: computed.overflow,
    position: computed.position,
    zIndex: computed.zIndex,
    transform: computed.transform,
    clip: computed.clip,
    clipPath: computed.clipPath,
    width: computed.width,
    minHeight: computed.minHeight,
    backgroundColor: computed.backgroundColor,
    color: computed.color,
    fontSize: computed.fontSize
  };
}

// Test all form fields with errors
const fieldsToTest = ['Last-Name', 'email-address', 'address', 'City', 'Contact-Country', 'State', 'Postal-Code', 'Contact-Phone-Number'];

console.log('📊 Testing', fieldsToTest.length, 'fields for error message visibility...');

fieldsToTest.forEach((fieldName, index) => {
  console.log(`\n🔍 [${index + 1}/${fieldsToTest.length}] Testing field: ${fieldName}`);
  
  // Find the input field
  const input = document.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"], textarea[name="${fieldName}"]`);
  if (!input) {
    console.log(`❌ Input field not found: ${fieldName}`);
    return;
  }
  
  // Find the form wrapper
  const wrapper = input.closest('.form-field_wrapper');
  if (!wrapper) {
    console.log(`❌ Form wrapper not found for: ${fieldName}`);
    return;
  }
  
  // Find the error message element
  const errorElement = wrapper.querySelector('.form_error-message');
  if (!errorElement) {
    console.log(`❌ Error message element not found for: ${fieldName}`);
    return;
  }
  
  console.log(`✅ Found all elements for: ${fieldName}`);
  
  // Check current states
  const inputHasErrorClass = input.classList.contains('error-field');
  const errorHasActiveClass = errorElement.classList.contains('active-error');
  const errorText = errorElement.textContent || errorElement.innerText;
  
  console.log(`📊 Current State:`, {
    fieldName,
    inputHasErrorClass,
    errorHasActiveClass,
    errorText: errorText.trim(),
    errorTextLength: errorText.trim().length
  });
  
  // Get computed styles for error element
  const errorStyles = getComputedStyleInfo(errorElement);
  console.log(`🎨 Error Element Computed Styles:`, errorStyles);
  
  // Check if element is actually visible
  const rect = errorElement.getBoundingClientRect();
  const isVisible = rect.width > 0 && rect.height > 0 && errorStyles.opacity !== '0' && errorStyles.visibility !== 'hidden' && errorStyles.display !== 'none';
  
  console.log(`👁️ Visibility Check:`, {
    boundingRect: {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left
    },
    isActuallyVisible: isVisible,
    hasContent: errorText.trim().length > 0
  });
  
  // Check for conflicting CSS rules
  const allRules = [];
  const sheets = Array.from(document.styleSheets);
  
  try {
    sheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || sheet.rules || []);
        rules.forEach(rule => {
          if (rule.selectorText && rule.selectorText.includes('.form_error-message')) {
            allRules.push({
              selector: rule.selectorText,
              cssText: rule.cssText,
              href: sheet.href || 'inline'
            });
          }
        });
      } catch (e) {
        // Skip CORS-protected stylesheets
      }
    });
  } catch (e) {
    console.log('Could not analyze all CSS rules due to CORS restrictions');
  }
  
  if (allRules.length > 0) {
    console.log(`📝 CSS Rules affecting .form_error-message:`, allRules);
  }
});

// Test FormLib error functions
console.log('\n🧪 Testing FormLib Error Functions...');

if (window.FormLib) {
  // Test if FormLib recognizes any errors
  const testField = 'Last-Name';
  console.log(`🔍 Testing FormLib functions on: ${testField}`);
  
  try {
    const hasError = FormLib.hasError(testField);
    console.log(`📊 FormLib.hasError('${testField}'):`, hasError);
  } catch (e) {
    console.log(`❌ FormLib.hasError error:`, e.message);
  }
  
  // Try manually showing an error
  try {
    console.log(`🧪 Manually showing error for: ${testField}`);
    FormLib.showError(testField, 'TEST ERROR MESSAGE');
    
    // Check state after manual showError
    setTimeout(() => {
      const input = document.querySelector(`input[name="${testField}"]`);
      const wrapper = input?.closest('.form-field_wrapper');
      const errorElement = wrapper?.querySelector('.form_error-message');
      
      if (errorElement) {
        console.log(`📊 After manual showError:`, {
          hasActiveClass: errorElement.classList.contains('active-error'),
          textContent: errorElement.textContent,
          computedStyles: getComputedStyleInfo(errorElement),
          boundingRect: errorElement.getBoundingClientRect()
        });
      }
    }, 100);
    
  } catch (e) {
    console.log(`❌ FormLib.showError error:`, e.message);
  }
  
} else {
  console.log('❌ FormLib not available');
}

// Test CSS injection status
console.log('\n🎨 CSS Injection Check...');
const styleElements = document.querySelectorAll('style');
let formLibStyleFound = false;

styleElements.forEach((style, index) => {
  const content = style.textContent || style.innerHTML;
  if (content.includes('Form Library Error Message Styles')) {
    formLibStyleFound = true;
    console.log(`✅ Found FormLib CSS injection in style element ${index + 1}:`, {
      content: content.substring(0, 200) + '...',
      fullLength: content.length
    });
  }
});

if (!formLibStyleFound) {
  console.log('❌ FormLib CSS injection not found in any style elements');
}

// Final summary
console.log('\n📋 SUMMARY:');
console.log('1. Check if error messages have .active-error class when validation fails');
console.log('2. Check if computed styles show correct visibility properties');
console.log('3. Check if CSS injection is present and not being overridden');
console.log('4. Check if error elements have actual content/text');
console.log('5. Look for conflicting Webflow CSS rules');

console.log('\n🔍 ERROR MESSAGE VISIBILITY DEBUG COMPLETE');

// Return a summary object for easy access
window.errorDebugSummary = {
  fieldsToTest,
  getComputedStyleInfo,
  timestamp: new Date().toISOString()
}; 