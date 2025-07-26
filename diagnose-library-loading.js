/**
 * Diagnose Library Loading Issues
 * Find out why FormLib isn't initializing despite the script being loaded
 */

console.log('🔧 === LIBRARY LOADING DIAGNOSTIC ===');
console.log('📅 Diagnostic Date:', new Date().toISOString());

function checkScriptLoadingErrors() {
  console.log('\n❌ === CHECKING FOR SCRIPT ERRORS ===');
  
  // Check for JavaScript errors that might prevent library loading
  console.log('🔍 Looking for JavaScript errors...');
  
  // Check if there are any unhandled errors
  window.addEventListener('error', (event) => {
    console.log('🚨 JavaScript Error detected:', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error
    });
  });
  
  // Check for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.log('🚨 Unhandled Promise Rejection:', event.reason);
  });
  
  console.log('✅ Error listeners added - any new errors will be logged');
}

function checkGlobalScope() {
  console.log('\n🌐 === CHECKING GLOBAL SCOPE ===');
  
  // List all globals related to our library
  const libraryGlobals = [
    'FormLib',
    'window.FormLib',
    'FormLibrary'
  ];
  
  libraryGlobals.forEach(globalName => {
    try {
      const value = eval(globalName);
      console.log(`✅ ${globalName}:`, typeof value, value ? 'exists' : 'null/undefined');
    } catch (error) {
      console.log(`❌ ${globalName}: Error -`, error.message);
    }
  });
  
  // Check for other form-related globals
  const formGlobals = Object.keys(window).filter(key => 
    key.toLowerCase().includes('form') || 
    key.toLowerCase().includes('lib')
  );
  
  console.log('📋 Other form/lib related globals:', formGlobals);
}

function checkScriptExecution() {
  console.log('\n🏃 === CHECKING SCRIPT EXECUTION ===');
  
  // Try to manually load and execute the script content
  const scriptElement = document.querySelector('script[src*="form-functionality-library"]');
  
  if (scriptElement) {
    console.log('📜 Script element found:', {
      src: scriptElement.src,
      async: scriptElement.async,
      defer: scriptElement.defer,
      type: scriptElement.type,
      loaded: scriptElement.readyState || 'unknown'
    });
    
    // Check if script has loaded
    if (scriptElement.readyState) {
      console.log('📊 Script readyState:', scriptElement.readyState);
    }
    
    // Try to fetch the script content to see if it's valid
    console.log('🔍 Attempting to fetch script content...');
    fetch(scriptElement.src)
      .then(response => {
        console.log('📡 Script fetch response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: {
            contentType: response.headers.get('content-type'),
            contentLength: response.headers.get('content-length')
          }
        });
        
        if (response.ok) {
          return response.text();
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      })
      .then(scriptContent => {
        console.log('📝 Script content loaded:', {
          length: scriptContent.length,
          hasFormLib: scriptContent.includes('FormLib'),
          hasExports: scriptContent.includes('export'),
          hasWindow: scriptContent.includes('window'),
          firstLines: scriptContent.substring(0, 200) + '...'
        });
        
        // Try to detect what type of module this is
        if (scriptContent.includes('export')) {
          console.log('📦 Detected ES Module - might need different loading strategy');
        }
        if (scriptContent.includes('module.exports')) {
          console.log('📦 Detected CommonJS Module - might need different loading strategy');
        }
        if (scriptContent.includes('window.FormLib')) {
          console.log('🌐 Detected Global Assignment - should work with script tag');
        }
      })
      .catch(error => {
        console.log('❌ Error fetching script:', error.message);
      });
      
  } else {
    console.log('❌ Script element not found');
  }
}

function checkWebflowConflicts() {
  console.log('\n🌊 === CHECKING WEBFLOW CONFLICTS ===');
  
  // Check for Webflow-specific issues
  const webflowElements = [
    'window.Webflow',
    'window.$',
    'window.jQuery'
  ];
  
  webflowElements.forEach(element => {
    try {
      const value = eval(element);
      console.log(`${value ? '✅' : '❌'} ${element}:`, typeof value);
    } catch (error) {
      console.log(`❌ ${element}: Error -`, error.message);
    }
  });
  
  // Check document ready state
  console.log('📄 Document ready state:', document.readyState);
  
  // Check if we're in an iframe or preview mode
  console.log('🖼️ Frame context:', {
    isInFrame: window !== window.top,
    location: window.location.href,
    isPreview: window.location.href.includes('preview'),
    isEditor: window.location.href.includes('editor')
  });
}

function tryManualInitialization() {
  console.log('\n🔧 === ATTEMPTING MANUAL INITIALIZATION ===');
  
  // Try different ways to access/initialize the library
  const initAttempts = [
    () => window.FormLib,
    () => window.FormLibrary,
    () => eval('FormLib'),
    () => eval('FormLibrary')
  ];
  
  initAttempts.forEach((attempt, index) => {
    try {
      const result = attempt();
      console.log(`✅ Attempt ${index + 1}: Found`, typeof result);
      
      if (result && typeof result.init === 'function') {
        console.log('🚀 Found init function, attempting to call...');
        try {
          result.init();
          console.log('✅ Manual initialization successful!');
        } catch (initError) {
          console.log('❌ Manual initialization failed:', initError.message);
        }
      }
    } catch (error) {
      console.log(`❌ Attempt ${index + 1}: Failed -`, error.message);
    }
  });
}

function suggestSolutions() {
  console.log('\n💡 === SUGGESTED SOLUTIONS ===');
  console.log('');
  console.log('🔧 Possible solutions:');
  console.log('1. 📦 Module Format Issue:');
  console.log('   - The script might be an ES module needing type="module"');
  console.log('   - Try adding type="module" to the script tag');
  console.log('');
  console.log('2. 🕐 Timing Issue:');
  console.log('   - Script might be loading before DOM is ready');
  console.log('   - Try adding defer or async attributes');
  console.log('');
  console.log('3. 🌊 Webflow Conflict:');
  console.log('   - Webflow might be interfering with library loading');
  console.log('   - Try using a different version or different CDN');
  console.log('');
  console.log('4. 🗄️ Cache Issue:');
  console.log('   - Hard refresh the page (Ctrl+Shift+R)');
  console.log('   - Clear browser cache completely');
  console.log('   - Try incognito mode');
}

// Run all diagnostics
console.log('🚀 Starting library loading diagnostic...');
checkScriptLoadingErrors();
checkGlobalScope();
checkScriptExecution();
checkWebflowConflicts();
tryManualInitialization();
suggestSolutions();

console.log('\n📋 === DIAGNOSTIC COMPLETE ===');
console.log('🔍 Review the above output to identify why FormLib is not loading'); 