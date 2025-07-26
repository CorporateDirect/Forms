/**
 * Library Version & Method Check
 * Checks what FormLib methods are available and diagnoses version issues
 */

console.log('🔍 === LIBRARY VERSION & METHODS CHECK ===');
console.log('📅 Check Date:', new Date().toISOString());

function checkFormLibMethods() {
  console.log('\n📚 === FORMLIB AVAILABILITY CHECK ===');
  
  if (typeof window.FormLib === 'undefined') {
    console.log('❌ window.FormLib is not available');
    return false;
  }
  
  console.log('✅ window.FormLib is available');
  console.log('📊 FormLib type:', typeof window.FormLib);
  
  // Check available methods
  const availableMethods = [];
  const expectedMethods = [
    'init',
    'isInitialized', 
    'getState',
    'debugStepSystem',
    'getNavigatedSteps',
    'goToStep',
    'goToStepById',
    'showError',
    'clearError',
    'clearAllErrors',
    'hasError',
    'getFieldsWithErrors'
  ];
  
  console.log('\n🔍 === METHOD AVAILABILITY CHECK ===');
  expectedMethods.forEach(method => {
    const isAvailable = typeof window.FormLib[method] === 'function';
    if (isAvailable) {
      availableMethods.push(method);
      console.log(`✅ ${method}: Available`);
    } else {
      console.log(`❌ ${method}: Missing`);
    }
  });
  
  console.log('\n📋 Summary:', {
    totalExpected: expectedMethods.length,
    totalAvailable: availableMethods.length,
    availableMethods: availableMethods,
    missingMethods: expectedMethods.filter(m => !availableMethods.includes(m))
  });
  
  return availableMethods.length > 0;
}

function checkInitializationStatus() {
  console.log('\n🚀 === INITIALIZATION STATUS CHECK ===');
  
  if (typeof window.FormLib?.isInitialized === 'function') {
    const isInit = window.FormLib.isInitialized();
    console.log('📊 Initialization Status:', isInit);
    
    if (!isInit) {
      console.log('⚠️ Library not initialized - attempting manual init...');
      if (typeof window.FormLib.init === 'function') {
        try {
          window.FormLib.init();
          console.log('✅ Manual initialization attempted');
        } catch (error) {
          console.log('❌ Manual initialization failed:', error.message);
        }
      }
    }
  } else {
    console.log('❌ Cannot check initialization - isInitialized method missing');
  }
}

function checkLibraryVersion() {
  console.log('\n📦 === LIBRARY VERSION CHECK ===');
  
  // Check for version information
  if (window.FormLib?.version) {
    console.log('📊 Library Version:', window.FormLib.version);
  } else {
    console.log('⚠️ No version information available');
  }
  
  // Check script tags for CDN URLs
  const scripts = Array.from(document.querySelectorAll('script[src*="form"]'));
  console.log('📜 Form-related script tags:', scripts.map(s => ({
    src: s.src,
    integrity: s.integrity,
    crossorigin: s.crossOrigin
  })));
  
  // Check for NPM CDN specifically
  const npmScripts = Array.from(document.querySelectorAll('script[src*="jsdelivr.net/npm/form-functionality-library"]'));
  console.log('📦 NPM CDN Scripts:', npmScripts.map(s => s.src));
  
  if (npmScripts.length === 0) {
    console.log('⚠️ No NPM CDN scripts found - library might be loaded differently');
    
    // Check all scripts for potential library sources
    const allScripts = Array.from(document.querySelectorAll('script[src]'));
    const potentialLibraryScripts = allScripts.filter(s => 
      s.src.includes('form') || 
      s.src.includes('Forms') || 
      s.src.includes('corporatedirect') ||
      s.src.includes('github')
    );
    
    console.log('🔍 Potential library scripts:', potentialLibraryScripts.map(s => s.src));
  }
}

function testBasicNavigation() {
  console.log('\n🧪 === BASIC NAVIGATION TEST ===');
  
  if (typeof window.FormLib?.goToStepById === 'function') {
    console.log('✅ goToStepById available - navigation should work');
    
    // Don't actually navigate, just test the method exists
    console.log('📝 Navigation methods available for back button functionality');
  } else {
    console.log('❌ goToStepById missing - back button will NOT work');
    console.log('🔧 This explains why clicking back button has no effect');
  }
}

// Run all checks
console.log('🚀 Starting comprehensive library check...\n');

const hasFormLib = checkFormLibMethods();
if (hasFormLib) {
  checkInitializationStatus();
  testBasicNavigation();
}
checkLibraryVersion();

console.log('\n🎯 === RECOMMENDED ACTIONS ===');
if (!hasFormLib || typeof window.FormLib?.getState !== 'function') {
  console.log('1. ❗ UPDATE LIBRARY: The current version is missing critical methods');
  console.log('2. 📦 Use latest NPM URL: https://cdn.jsdelivr.net/npm/form-functionality-library@latest/dist/index.js');
  console.log('3. 🔄 Republish Webflow project with updated library URL');
  console.log('4. 🧪 Test navigation functionality after update');
} else {
  console.log('1. ✅ Library version appears current');
  console.log('2. 🔍 Check initialization and navigation methods');
} 