/**
 * Quick Version Check for v1.5.7
 */

console.log('🔍 VERSION CHECK STARTING...');

// Check script sources
const scripts = Array.from(document.querySelectorAll('script'));
const formLibScript = scripts.find(s => s.src && s.src.includes('form-functionality-library'));

if (formLibScript) {
  console.log('📦 FormLib Script Found:', formLibScript.src);
  
  // Check if it's v1.5.7
  const isV157 = formLibScript.src.includes('1.5.7');
  console.log('✅ Is v1.5.7:', isV157);
  
  if (!isV157) {
    console.warn('⚠️ Version mismatch! Update Webflow to use:');
    console.log('🔗 https://unpkg.com/form-functionality-library@1.5.7/dist/index.browser.min.js');
  }
} else {
  console.error('❌ FormLib script not found in page!');
  console.log('📜 All scripts:', scripts.map(s => s.src).filter(Boolean));
}

// Check console logs for version identifier
console.log('👀 Look for "CACHE_BUST_2025_01_28_22_45_VISUAL_ERROR_FIX" in console logs above');

// Check FormLib global
if (typeof FormLib !== 'undefined') {
  console.log('✅ FormLib global available');
  
  // Try to get state to see if it's working
  try {
    const state = FormLib.getState();
    console.log('📊 FormLib state accessible:', !!state);
  } catch (e) {
    console.error('❌ FormLib state error:', e);
  }
} else {
  console.error('❌ FormLib global not available');
}

console.log('🔍 VERSION CHECK COMPLETE'); 