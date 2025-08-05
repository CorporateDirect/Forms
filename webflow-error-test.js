/**
 * Minimal test to understand Webflow's native error handling
 * Run this in browser console to see what Webflow expects
 */

(function() {
  console.log('=== WEBFLOW ERROR SYSTEM TEST ===');
  
  // Find all error message elements
  const errorElements = document.querySelectorAll('.form_error-message');
  console.log(`Found ${errorElements.length} error message elements`);
  
  errorElements.forEach((el, i) => {
    const computedStyle = window.getComputedStyle(el);
    console.log(`Error element ${i + 1}:`, {
      element: el,
      classes: el.className,
      defaultDisplay: computedStyle.display,
      defaultVisibility: computedStyle.visibility,
      defaultOpacity: computedStyle.opacity,
      textContent: el.textContent,
      parent: el.parentElement?.className
    });
  });
  
  // Test what happens when we add .active-error
  console.log('\n=== TESTING .active-error CLASS ===');
  
  if (errorElements.length > 0) {
    const testElement = errorElements[0];
    console.log('Before adding .active-error:', {
      display: window.getComputedStyle(testElement).display,
      visibility: window.getComputedStyle(testElement).visibility,
      classes: testElement.className
    });
    
    // Add the class
    testElement.classList.add('active-error');
    
    console.log('After adding .active-error:', {
      display: window.getComputedStyle(testElement).display,
      visibility: window.getComputedStyle(testElement).visibility,
      classes: testElement.className,
      isVisible: testElement.offsetParent !== null
    });
    
    // Remove it after test
    setTimeout(() => {
      testElement.classList.remove('active-error');
      console.log('Removed .active-error class');
    }, 5000);
  }
  
  // Check if Webflow has any built-in error CSS
  console.log('\n=== CHECKING FOR WEBFLOW ERROR CSS ===');
  const stylesheets = Array.from(document.styleSheets);
  stylesheets.forEach((sheet, i) => {
    try {
      const rules = Array.from(sheet.cssRules || sheet.rules || []);
      const errorRules = rules.filter(rule => 
        rule.selectorText && (
          rule.selectorText.includes('.active-error') ||
          rule.selectorText.includes('.form_error-message') ||
          rule.selectorText.includes('.error-field')
        )
      );
      if (errorRules.length > 0) {
        console.log(`Stylesheet ${i} error-related rules:`, errorRules.map(r => ({
          selector: r.selectorText,
          cssText: r.cssText
        })));
      }
    } catch (e) {
      console.log(`Could not read stylesheet ${i}:`, e.message);
    }
  });
})();