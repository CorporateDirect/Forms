// CDN Cache Fix Test - Testing jsdelivr alternatives to unpkg
// Run this in browser console to test different CDN options

console.log('🚀 === CDN CACHE FIX TEST ===');
console.log('🕐 Test Date:', new Date().toISOString());

const testUrls = [
  {
    name: 'jsDelivr NPM (v1.7.3)',
    url: 'https://cdn.jsdelivr.net/npm/form-functionality-library@1.7.3/dist/index.min.js',
    reason: 'Primary alternative to unpkg - should have latest content'
  },
  {
    name: 'jsDelivr NPM (latest)',
    url: 'https://cdn.jsdelivr.net/npm/form-functionality-library@latest/dist/index.min.js',
    reason: 'Latest version through jsDelivr npm mirror'
  },
  {
    name: 'UNPKG (problematic)',
    url: 'https://unpkg.com/form-functionality-library@1.7.3/dist/index.min.js',
    reason: 'Current problematic URL for comparison'
  }
];

async function testCdnContent() {
  console.log('\n📡 === TESTING CDN CONTENT ===');
  
  for (const test of testUrls) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`📎 URL: ${test.url}`);
    console.log(`💡 Reason: ${test.reason}`);
    
    try {
      const response = await fetch(test.url);
      const content = await response.text();
      
      // Look for version identifiers in the content
      const versionMatches = [
        content.match(/v1\.7\.3/g),
        content.match(/ROBUST ELEMENT LOOKUP/g),
        content.match(/CACHE_BUST_2025/g),
        content.match(/NUCLEAR_CSS_OVERRIDE/g)
      ];
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📏 Size: ${content.length} characters`);
      console.log(`🔍 Contains v1.7.3: ${versionMatches[0] ? versionMatches[0].length : 0} times`);
      console.log(`🔍 Contains "ROBUST ELEMENT LOOKUP": ${versionMatches[1] ? versionMatches[1].length : 0} times`);
      console.log(`🔍 Contains "CACHE_BUST_2025": ${versionMatches[2] ? versionMatches[2].length : 0} times`);
      console.log(`🔍 Contains "NUCLEAR_CSS_OVERRIDE": ${versionMatches[3] ? versionMatches[3].length : 0} times`);
      
      // Show first 200 chars to identify the content
      console.log(`📄 Content Preview:`, content.substring(0, 200) + '...');
      
      // Check if this looks like the correct v1.7.3 content
      if (content.includes('v1.7.3') && content.includes('ROBUST ELEMENT LOOKUP')) {
        console.log('✅ ✅ ✅ THIS APPEARS TO BE CORRECT v1.7.3 CONTENT! ✅ ✅ ✅');
      } else if (content.includes('CACHE_BUST_2025') || content.includes('NUCLEAR_CSS_OVERRIDE')) {
        console.log('❌ ❌ ❌ THIS IS ANCIENT CACHED CONTENT ❌ ❌ ❌');
      } else {
        console.log('❓ Unknown content - manual inspection needed');
      }
      
    } catch (error) {
      console.log(`❌ Error fetching: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }
}

async function createWorkingScript() {
  console.log('\n🔧 === CREATING WORKING SCRIPT TAG ===');
  
  // Test the primary jsDelivr URL first
  const workingUrl = 'https://cdn.jsdelivr.net/npm/form-functionality-library@1.7.3/dist/index.min.js';
  
  try {
    const response = await fetch(workingUrl);
    const content = await response.text();
    
    if (content.includes('v1.7.3') && content.includes('ROBUST ELEMENT LOOKUP')) {
      console.log('✅ Verified jsDelivr has correct v1.7.3 content!');
      console.log('\n📋 === WORKING SOLUTION ===');
      console.log('Replace your current script tag with:');
      console.log(`<script src="${workingUrl}"></script>`);
      console.log('\n🎯 === WEBFLOW IMPLEMENTATION ===');
      console.log('1. Go to Webflow Project Settings > Custom Code');
      console.log('2. In Footer Code, replace the unpkg.com URL with:');
      console.log(`   <script src="${workingUrl}"></script>`);
      console.log('3. Publish your Webflow project');
      console.log('4. Test the form - error messages should now appear!');
      
      return workingUrl;
    } else {
      console.log('❌ jsDelivr also has stale content. Trying GitHub raw URL...');
      
      // Fallback to GitHub raw URL
      const githubUrl = 'https://raw.githubusercontent.com/CorporateDirect/Forms/main/dist/index.min.js';
      console.log('\n📋 === GITHUB RAW FALLBACK ===');
      console.log('Use this temporary GitHub raw URL:');
      console.log(`<script src="${githubUrl}"></script>`);
      console.log('Note: This bypasses all CDN caches but may be slower');
      
      return githubUrl;
    }
  } catch (error) {
    console.log(`❌ Error testing jsDelivr: ${error.message}`);
    return null;
  }
}

// Run the tests
testCdnContent().then(() => {
  return createWorkingScript();
}).then((workingUrl) => {
  if (workingUrl) {
    console.log('\n🎉 === SUCCESS PLAN ===');
    console.log('1. ✅ Working URL identified');
    console.log('2. 🔄 Update Webflow with new URL');
    console.log('3. 🚀 Publish and test');
    console.log('4. 🎯 Error messages should appear!');
  } else {
    console.log('\n⚠️ === MANUAL ACTION NEEDED ===');
    console.log('All CDNs may have stale content. Consider:');
    console.log('1. Contacting unpkg/jsDelivr support');
    console.log('2. Using GitHub raw URL temporarily');
    console.log('3. Waiting for natural cache expiry (24-48 hours)');
  }
});

// Also check current page
console.log('\n🔍 === CURRENT PAGE ANALYSIS ===');
const currentScripts = Array.from(document.querySelectorAll('script[src*="form"]'));
console.log('📜 Current form library scripts:', currentScripts.map(s => s.src));

if (window.FormLib?.version) {
  console.log('📊 Currently loaded version:', window.FormLib.version);
} else {
  console.log('⚠️ No FormLib.version detected');
}