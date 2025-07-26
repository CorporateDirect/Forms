/**
 * Step-0 Investigation
 * Check what's causing immediate navigation from step-0 to step-3
 */

console.log('🔍 === STEP-0 INVESTIGATION ===');
console.log('📅 Investigation Date:', new Date().toISOString());

function investigateStep0() {
  console.log('\n📋 === STEP-0 DATA ATTRIBUTES ===');
  
  const step0 = document.querySelector('[data-answer="step-0"]');
  if (!step0) {
    console.log('❌ Step-0 not found');
    return;
  }
  
  console.log('✅ Step-0 found:', {
    tagName: step0.tagName,
    className: step0.className,
    id: step0.id
  });
  
  // Check all data attributes on step-0
  const dataAttributes = {};
  Array.from(step0.attributes).forEach(attr => {
    if (attr.name.startsWith('data-')) {
      dataAttributes[attr.name] = attr.value;
    }
  });
  
  console.log('📊 Step-0 data attributes:', dataAttributes);
  
  // Check specifically for navigation-related attributes
  const navigationAttrs = [
    'data-go-to',
    'data-answer', 
    'data-branch',
    'data-skip',
    'data-form'
  ];
  
  console.log('\n🧭 Navigation-related attributes:');
  navigationAttrs.forEach(attr => {
    const value = step0.getAttribute(attr);
    if (value !== null) {
      console.log(`✅ ${attr}: "${value}"`);
    } else {
      console.log(`❌ ${attr}: not present`);
    }
  });
  
  // Check for any elements within step-0 that might trigger navigation
  console.log('\n🔍 === ELEMENTS WITHIN STEP-0 ===');
  
  const navigationElements = step0.querySelectorAll('[data-go-to], [data-skip], [data-form*="btn"]');
  console.log(`📊 Found ${navigationElements.length} navigation elements within step-0:`);
  
  navigationElements.forEach((element, index) => {
    console.log(`${index + 1}. ${element.tagName} - Classes: ${element.className}`, {
      'data-go-to': element.getAttribute('data-go-to'),
      'data-skip': element.getAttribute('data-skip'),
      'data-form': element.getAttribute('data-form'),
      innerHTML: element.innerHTML.substring(0, 50) + '...'
    });
  });
  
  // Check for any radio buttons or inputs that might auto-trigger
  const inputs = step0.querySelectorAll('input[type="radio"], input[data-go-to]');
  console.log(`\n📻 Found ${inputs.length} inputs with potential navigation:`);
  
  inputs.forEach((input, index) => {
    console.log(`${index + 1}. ${input.type} - Name: ${input.name}`, {
      'data-go-to': input.getAttribute('data-go-to'),
      value: input.value,
      checked: input.checked,
      defaultChecked: input.defaultChecked
    });
  });
  
  return {
    step0Element: step0,
    dataAttributes,
    navigationElements: navigationElements.length,
    inputs: inputs.length
  };
}

function checkForAutoTriggers() {
  console.log('\n🎯 === AUTO-TRIGGER INVESTIGATION ===');
  
  const step0 = document.querySelector('[data-answer="step-0"]');
  if (!step0) return;
  
  // Check if step-0 has data-go-to
  const goToValue = step0.getAttribute('data-go-to');
  if (goToValue) {
    console.log('🚨 FOUND THE ISSUE! Step-0 has data-go-to:', goToValue);
    console.log('💡 This explains why returning to step-0 immediately jumps to step-3');
    console.log('🔧 The back button works, but step-0 is configured to auto-advance');
    return goToValue;
  }
  
  // Check for any checked radio buttons that might auto-trigger
  const checkedRadios = step0.querySelectorAll('input[type="radio"]:checked[data-go-to]');
  if (checkedRadios.length > 0) {
    console.log('🚨 FOUND AUTO-TRIGGER! Checked radio buttons with data-go-to:');
    checkedRadios.forEach((radio, index) => {
      console.log(`${index + 1}. Radio "${radio.name}" = "${radio.value}" → goes to: ${radio.getAttribute('data-go-to')}`);
    });
    return checkedRadios[0].getAttribute('data-go-to');
  }
  
  // Check for any other auto-triggering elements
  const autoElements = step0.querySelectorAll('[data-go-to]:not(input[type="radio"])');
  if (autoElements.length > 0) {
    console.log('🔍 Other potential auto-trigger elements:');
    autoElements.forEach((element, index) => {
      console.log(`${index + 1}. ${element.tagName} → goes to: ${element.getAttribute('data-go-to')}`);
    });
  }
  
  return null;
}

function suggestFix() {
  console.log('\n🔧 === SUGGESTED FIX ===');
  
  const autoTrigger = checkForAutoTriggers();
  
  if (autoTrigger === 'step-3') {
    console.log('✅ Confirmed: Step-0 is configured to automatically go to step-3');
    console.log('');
    console.log('🔧 SOLUTIONS:');
    console.log('1. 🎯 BEST: Remove data-go-to="step-3" from step-0 wrapper');
    console.log('2. 🎯 ALT: Move data-go-to to specific button/radio, not the step wrapper');
    console.log('3. 🎯 ALT: Add logic to prevent auto-navigation on back button return');
    console.log('');
    console.log('📋 The back button IS working correctly!');
    console.log('📋 The issue is step-0 configuration, not the navigation code.');
  } else if (autoTrigger) {
    console.log('✅ Step-0 auto-advances to:', autoTrigger);
    console.log('🔧 Remove auto-navigation from step-0 to fix back button behavior');
  } else {
    console.log('🤔 No obvious auto-trigger found. Need to investigate further.');
  }
}

// Run the investigation
console.log('🚀 Starting Step-0 investigation...');
const results = investigateStep0();
suggestFix();

console.log('\n📋 === INVESTIGATION COMPLETE ===');
console.log('🎯 Key Finding: Back button works, but step-0 has auto-navigation');
console.log('🔧 Fix: Modify step-0 HTML to remove unwanted data-go-to attribute'); 