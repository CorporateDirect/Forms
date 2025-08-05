// UNPKG Cache Fix - Force unpkg.com to serve fresh v1.7.3 content
// Run this in browser console to test and fix unpkg caching issue

console.log('🚀 === UNPKG CACHE FIX TEST ===');
console.log('🕐 Test Date:', new Date().toISOString());

const testUrls = [
  {
    name: 'UNPKG v1.7.3 (Current)',
    url: 'https://unpkg.com/form-functionality-library@1.7.3/dist/index.min.js',
    reason: 'Your current URL - testing for cache issues'
  },
  {
    name: 'UNPKG with Cache Bust #1',
    url: 'https://unpkg.com/form-functionality-library@1.7.3/dist/index.min.js?cache-bust=' + Date.now(),
    reason: 'Timestamp cache buster'
  },
  {
    name: 'UNPKG with Cache Bust #2', 
    url: 'https://unpkg.com/form-functionality-library@1.7.3/dist/index.min.js?v=20250129-01',
    reason: 'Version-based cache buster'
  },
  {
    name: 'UNPKG latest (auto-updates)',
    url: 'https://unpkg.com/form-functionality-library@latest/dist/index.min.js',
    reason: 'Latest tag - may bypass version-specific cache'
  }
];

async function testUnpkgCaching() {
  console.log('\n📡 === TESTING UNPKG CONTENT ===');
  
  for (const test of testUrls) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`📎 URL: ${test.url}`);
    console.log(`💡 Reason: ${test.reason}`);
    
    try {
      // Add cache-busting headers
      const response = await fetch(test.url, {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      const content = await response.text();
      
      // Look for version identifiers
      const versionChecks = {
        hasV173: content.includes('v1.7.3'),
        hasRobustLookup: content.includes('ROBUST ELEMENT LOOKUP'),
        hasOldCache: content.includes('CACHE_BUST_2025') || content.includes('NUCLEAR_CSS_OVERRIDE'),
        contentLength: content.length
      };
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📏 Size: ${versionChecks.contentLength} characters`);
      console.log(`🔍 Contains v1.7.3: ${versionChecks.hasV173 ? '✅' : '❌'}`);
      console.log(`🔍 Contains "ROBUST ELEMENT LOOKUP": ${versionChecks.hasRobustLookup ? '✅' : '❌'}`);
      console.log(`🔍 Contains old cache markers: ${versionChecks.hasOldCache ? '❌ BAD' : '✅ GOOD'}`);
      
      // Show content preview
      console.log(`📄 Content Preview:`, content.substring(0, 150) + '...');
      
      // Determine if this is the correct version
      if (versionChecks.hasV173 && versionChecks.hasRobustLookup && !versionChecks.hasOldCache) {
        console.log('🎉 ✅ ✅ ✅ THIS IS CORRECT v1.7.3 CONTENT! ✅ ✅ ✅');
        console.log('🚀 USE THIS URL IN WEBFLOW:');
        console.log(`   <script src="${test.url}"></script>`);
        return test.url;
      } else if (versionChecks.hasOldCache) {
        console.log('💀 ❌ ❌ ❌ STILL ANCIENT CACHED CONTENT ❌ ❌ ❌');
      } else {
        console.log('❓ Unknown version - needs manual inspection');
      }
      
    } catch (error) {
      console.log(`❌ Error fetching: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }
  
  return null;
}

async function forceUnpkgRefresh() {
  console.log('\n🔄 === FORCE UNPKG CACHE REFRESH ===');
  
  // Try multiple cache-busting strategies
  const strategies = [
    'https://unpkg.com/form-functionality-library@1.7.3/dist/index.min.js?t=' + Date.now(),
    'https://unpkg.com/form-functionality-library@1.7.3/dist/index.min.js?cache=false&v=173',
    'https://unpkg.com/form-functionality-library@1.7.3/dist/index.min.js?refresh=true&build=' + Math.random().toString(36).substr(2, 9)
  ];
  
  for (const url of strategies) {
    console.log(`\n🧪 Testing cache-bust strategy: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        cache: 'reload', // Force reload from server
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'If-None-Match': '*', // Force fresh content
          'If-Modified-Since': 'Thu, 01 Jan 1970 00:00:00 GMT'
        }
      });
      
      const content = await response.text();
      
      if (content.includes('v1.7.3') && content.includes('ROBUST ELEMENT LOOKUP')) {
        console.log('🎉 SUCCESS! Cache-busting worked with this URL');
        return url;
      }
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
    }
  }
  
  return null;
}

// Main execution
async function fixUnpkgCache() {
  console.log('\n🎯 === UNPKG CACHE FIX PROCESS ===');
  
  // Step 1: Test current URLs
  const workingUrl = await testUnpkgCaching();
  
  if (workingUrl) {
    console.log('\n✅ === SOLUTION FOUND ===');
    console.log(`Working unpkg URL: ${workingUrl}`);
    console.log('\n📋 === WEBFLOW UPDATE STEPS ===');
    console.log('1. Go to Webflow Project Settings → Custom Code');
    console.log('2. Replace your current script tag with:');
    console.log(`   <script src="${workingUrl}"></script>`);
    console.log('3. Publish your Webflow project');
    console.log('4. Test form - error messages should appear!');
    return;
  }
  
  // Step 2: Try aggressive cache busting
  console.log('\n⚡ No working URL found. Trying aggressive cache busting...');
  const bustingUrl = await forceUnpkgRefresh();
  
  if (bustingUrl) {
    console.log('\n✅ === CACHE-BUSTING SOLUTION ===');
    console.log(`Use this cache-busted URL: ${bustingUrl}`);
    console.log('Note: You may need to update this URL periodically');
    return;
  }
  
  // Step 3: Alternative solutions
  console.log('\n🚨 === UNPKG CACHE STUCK - ALTERNATIVES ===');
  console.log('unpkg cache appears completely stuck. Options:');
  console.log('');
  console.log('📧 Option 1: Contact unpkg support');
  console.log('   Email: support@unpkg.com');
  console.log('   Request cache invalidation for form-functionality-library@1.7.3');
  console.log('');
  console.log('⏰ Option 2: Wait for natural cache expiry (24-48 hours)');
  console.log('');
  console.log('🔀 Option 3: Temporary workaround - use different CDN until unpkg fixes:');
  console.log('   https://cdn.jsdelivr.net/npm/form-functionality-library@1.7.3/dist/index.min.js');
  console.log('   (Switch back to unpkg once cache clears)');
}

// Run the fix
fixUnpkgCache();

// Also check what's currently loaded on this page
console.log('\n🔍 === CURRENT PAGE ANALYSIS ===');
const currentScripts = Array.from(document.querySelectorAll('script[src*="form"]'));
console.log('📜 Current form library scripts:', currentScripts.map(s => s.src));

if (window.FormLib?.version) {
  console.log('📊 Currently loaded version:', window.FormLib.version);
  if (window.FormLib.version.includes('v1.7.3') && window.FormLib.version.includes('ROBUST ELEMENT LOOKUP')) {
    console.log('✅ GOOD! Correct v1.7.3 is loaded');
  } else {
    console.log('❌ OLD VERSION LOADED - cache busting needed');
  }
} else {
  console.log('⚠️ No FormLib.version detected - library may not be loaded');
}