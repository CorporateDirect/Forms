/**
 * Check Library Version and Source
 * Determines what version of the library is actually loaded and from where
 */

console.log('📦 === LIBRARY VERSION & SOURCE CHECK ===');
console.log('📅 Check Date:', new Date().toISOString());

function checkLibraryVersion() {
  console.log('\n🔍 === CHECKING LOADED LIBRARY ===');
  
  // Check all script tags for form library sources
  const allScripts = Array.from(document.querySelectorAll('script[src]'));
  const formLibraryScripts = allScripts.filter(script => 
    script.src.includes('form') || 
    script.src.includes('Forms') ||
    script.src.includes('corporatedirect')
  );
  
  console.log('📜 Form library script tags found:', formLibraryScripts.length);
  
  formLibraryScripts.forEach((script, index) => {
    console.log(`${index + 1}. Script Source:`, script.src);
    console.log(`   - Integrity:`, script.integrity || 'none');
    console.log(`   - Crossorigin:`, script.crossOrigin || 'none');
  });
  
  // Check specifically for different CDN sources
  const npmCdnScripts = allScripts.filter(s => s.src.includes('jsdelivr.net/npm/form-functionality-library'));
  const unpkgScripts = allScripts.filter(s => s.src.includes('unpkg.com/form-functionality-library'));
  const githubScripts = allScripts.filter(s => s.src.includes('jsdelivr.net/gh/') && s.src.includes('Forms'));
  
  console.log('\n📊 CDN Source Analysis:');
  console.log('📦 NPM CDN (jsdelivr.net/npm):', npmCdnScripts.length, npmCdnScripts.map(s => s.src));
  console.log('📦 UNPKG CDN:', unpkgScripts.length, unpkgScripts.map(s => s.src));
  console.log('📦 GitHub CDN (jsdelivr.net/gh):', githubScripts.length, githubScripts.map(s => s.src));
  
  // Check what version is actually running
  console.log('\n🔍 === RUNTIME VERSION CHECK ===');
  
  if (window.FormLib) {
    console.log('✅ FormLib is loaded');
    
    // Try to determine version
    const version = window.FormLib.version || 'unknown';
    console.log('📊 Library Version:', version);
    
    // Check for version indicators in the code
    const formLibString = window.FormLib.toString();
    if (formLibString.includes('1.4.4')) {
      console.log('✅ Code contains v1.4.4 indicators');
    } else if (formLibString.includes('1.4.3')) {
      console.log('⚠️ Code contains v1.4.3 indicators');
    } else {
      console.log('❓ Cannot determine version from code');
    }
    
    // Check if our fix is present
    console.log('\n🔧 === CHECKING FOR FIX ===');
    
    // Try to access the multiStep module to see if our fix is there
    try {
      // Check if the console shows our new fix messages
      console.log('🔍 Looking for fix indicators in recent console logs...');
      
      // We can check if the handleDirectNavigation fix is working by seeing the log messages
      const expectedFixMessages = [
        '🛑 [MultiStep] Ignoring navigation from step wrapper',
        '🛑 [MultiStep] Ignoring navigation from non-navigation element'
      ];
      
      console.log('📋 Expected fix messages to look for:', expectedFixMessages);
      console.log('❗ If you see "🎯 [MultiStep] Direct navigation triggered" from step wrappers,');
      console.log('   then the old version is still running!');
      
    } catch (error) {
      console.log('❌ Error checking for fix:', error.message);
    }
    
  } else {
    console.log('❌ FormLib is not loaded');
  }
}

function checkBrowserCache() {
  console.log('\n🗄️ === BROWSER CACHE CHECK ===');
  console.log('⚠️ The site might be using cached versions of the library');
  console.log('');
  console.log('🔧 To force fresh library load:');
  console.log('1. Open DevTools (F12)');
  console.log('2. Right-click refresh button → "Empty Cache and Hard Reload"');
  console.log('3. Or disable cache in DevTools Network tab');
  console.log('4. Or try incognito/private browsing mode');
  console.log('');
  console.log('📝 Current expected URLs:');
  console.log('✅ NEW: https://cdn.jsdelivr.net/npm/form-functionality-library@1.4.4/dist/index.js');
  console.log('❌ OLD: https://unpkg.com/form-functionality-library@latest/dist/index.min.js');
}

function recommendedActions() {
  console.log('\n🎯 === RECOMMENDED ACTIONS ===');
  console.log('');
  console.log('1. 🔄 Update Webflow Project Settings:');
  console.log('   - Go to Webflow Project Settings → Custom Code');
  console.log('   - Replace old library URL with:');
  console.log('   https://cdn.jsdelivr.net/npm/form-functionality-library@1.4.4/dist/index.js');
  console.log('');
  console.log('2. 🚀 Publish Webflow Project:');
  console.log('   - Save and publish the Webflow project');
  console.log('   - This will update the live site with the new library');
  console.log('');
  console.log('3. 🧹 Clear Browser Cache:');
  console.log('   - Hard refresh or clear cache to ensure fresh library load');
  console.log('');
  console.log('4. 🧪 Re-test Navigation:');
  console.log('   - Run the navigation test again after library update');
  console.log('   - Should see new fix messages in console');
}

// Run all checks
console.log('🚀 Starting library version check...');
checkLibraryVersion();
checkBrowserCache();
recommendedActions();

console.log('\n📋 === CHECK COMPLETE ===');
console.log('🎯 The navigation fix (v1.4.4) exists but may not be loaded yet');
console.log('🔧 Update the Webflow library URL to use the latest version'); 