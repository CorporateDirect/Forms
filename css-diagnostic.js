// CSS DIAGNOSTIC SCRIPT - Run this in console to check CSS issues
console.log('🔍 CSS DIAGNOSTIC FOR ERROR MESSAGES');
console.log('=====================================');

// 1. Check if error elements exist with active-error class
const activeErrors = document.querySelectorAll('.form_error-message.active-error');
console.log(`Found ${activeErrors.length} elements with .form_error-message.active-error`);

activeErrors.forEach((el, index) => {
  console.log(`\nError Element ${index + 1}:`);
  console.log('  Text:', el.textContent?.trim() || 'empty');
  console.log('  Classes:', Array.from(el.classList));
  console.log('  Computed display:', getComputedStyle(el).display);
  console.log('  Computed visibility:', getComputedStyle(el).visibility);
  console.log('  Computed opacity:', getComputedStyle(el).opacity);
  console.log('  offsetParent:', el.offsetParent);
  console.log('  Element HTML:', el.outerHTML.substring(0, 200));
});

// 2. Check if CSS was injected
const injectedStyles = document.querySelector('style[data-form-lib="error-styles"]');
console.log('\nInjected CSS Check:');
console.log('  CSS Injected:', !!injectedStyles);
if (injectedStyles) {
  console.log('  CSS Content Preview:', injectedStyles.textContent.substring(0, 300));
}

// 3. Test CSS rules manually
console.log('\nTesting CSS Rules:');
if (activeErrors.length > 0) {
  const testEl = activeErrors[0];
  
  // Try forcing display block
  testEl.style.display = 'block';
  testEl.style.opacity = '1';
  testEl.style.visibility = 'visible';
  
  console.log('  After forcing styles:');
  console.log('    Display:', getComputedStyle(testEl).display);
  console.log('    Visible now:', testEl.offsetParent !== null);
  
  // Reset
  testEl.style.display = '';
  testEl.style.opacity = '';
  testEl.style.visibility = '';
}

// 4. Check for conflicting CSS
console.log('\nChecking for conflicting styles...');
const allErrorElements = document.querySelectorAll('.form_error-message');
allErrorElements.forEach((el, index) => {
  const styles = getComputedStyle(el);
  const hasActiveError = el.classList.contains('active-error');
  
  console.log(`Element ${index + 1} (active: ${hasActiveError}):`);
  console.log(`  Display: ${styles.display}`);
  console.log(`  Visibility: ${styles.visibility}`);
  console.log(`  Opacity: ${styles.opacity}`);
  console.log(`  Height: ${styles.height}`);
  console.log(`  Max-height: ${styles.maxHeight}`);
}); 