// Enhanced Webflow Custom Radio Button Styling Fix
// This script ensures the visual styling matches the actual radio button state

(function() {
    console.log('[RadioFix] Initializing enhanced custom radio button styling fix...');
    
    // Function to fix radio button visual styling
    function fixRadioButtonStyling() {
        // Find all radio inputs
        const radioInputs = document.querySelectorAll('input[type="radio"]');
        
        radioInputs.forEach((input, index) => {
            console.log(`[RadioFix] Checking radio input ${index}:`, {
                checked: input.checked,
                name: input.name,
                value: input.value,
                id: input.id,
                dataGoTo: input.getAttribute('data-go-to')
            });
            
            // Find the associated label and visual radio elements
            const label = input.closest('label') || input.parentElement?.closest('label');
            const radioVisual = label?.querySelector('.w-radio-input, .radio_button-skip-step, .w-form-formradioinput');
            
            if (label && radioVisual) {
                console.log(`[RadioFix] Found visual elements for radio ${index}:`, {
                    label: label.className,
                    radioVisual: radioVisual.className,
                    currentChecked: input.checked
                });
                
                if (input.checked) {
                    // Add visual styling classes for checked state
                    label.classList.add('is-active-inputactive', 'w--redirected-checked', 'selected');
                    radioVisual.classList.add('w--redirected-checked', 'is-active', 'checked');
                    
                    // Apply visual styling directly
                    radioVisual.style.backgroundColor = '#3898EC';
                    radioVisual.style.borderColor = '#3898EC';
                    radioVisual.style.position = 'relative';
                    
                    // Add checkmark if it doesn't exist
                    if (!radioVisual.querySelector('.checkmark')) {
                        const checkmark = document.createElement('div');
                        checkmark.className = 'checkmark';
                        checkmark.style.cssText = `
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            width: 6px;
                            height: 6px;
                            background-color: white;
                            border-radius: 50%;
                            display: block;
                        `;
                        radioVisual.appendChild(checkmark);
                    }
                    
                    console.log(`[RadioFix] Applied checked styling to radio ${index}`);
                    
                    // Uncheck other radios in the same group
                    if (input.name) {
                        const groupRadios = document.querySelectorAll(`input[type="radio"][name="${input.name}"]`);
                        groupRadios.forEach(otherRadio => {
                            if (otherRadio !== input) {
                                otherRadio.checked = false;
                                const otherLabel = otherRadio.closest('label');
                                const otherVisual = otherLabel?.querySelector('.w-radio-input, .radio_button-skip-step, .w-form-formradioinput');
                                if (otherLabel && otherVisual) {
                                    otherLabel.classList.remove('is-active-inputactive', 'w--redirected-checked', 'selected');
                                    otherVisual.classList.remove('w--redirected-checked', 'is-active', 'checked');
                                    otherVisual.style.backgroundColor = '';
                                    otherVisual.style.borderColor = '';
                                    const checkmark = otherVisual.querySelector('.checkmark');
                                    if (checkmark) {
                                        checkmark.remove();
                                    }
                                }
                            }
                        });
                    }
                } else {
                    // Remove checked styling from unchecked radios
                    label.classList.remove('is-active-inputactive', 'w--redirected-checked', 'selected');
                    radioVisual.classList.remove('w--redirected-checked', 'is-active', 'checked');
                    radioVisual.style.backgroundColor = '';
                    radioVisual.style.borderColor = '';
                    const checkmark = radioVisual.querySelector('.checkmark');
                    if (checkmark) {
                        checkmark.remove();
                    }
                }
            }
        });
    }
    
    // Enhanced monitoring for FormLib activities
    function monitorFormLibActivity() {
        // Listen for FormLib log messages
        const originalLog = console.log;
        console.log = function(...args) {
            originalLog.apply(console, args);
            
            // Check if this is a FormLib radio button update
            if (args[0] && typeof args[0] === 'string' && 
                (args[0].includes('[FormLib]') && 
                 (args[0].includes('Applied active class to radio') || 
                  args[0].includes('Triggering branch logic') ||
                  args[0].includes('Successfully found radio input')))) {
                console.log('[RadioFix] Detected FormLib radio button update, applying visual fix...');
                setTimeout(fixRadioButtonStyling, 50);
            }
        };
        
        // Listen for DOM mutations
        const observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    mutation.target.type === 'radio' && 
                    mutation.attributeName === 'checked') {
                    shouldUpdate = true;
                }
                if (mutation.type === 'childList' && 
                    mutation.target.querySelector && 
                    mutation.target.querySelector('input[type="radio"]')) {
                    shouldUpdate = true;
                }
            });
            
            if (shouldUpdate) {
                console.log('[RadioFix] DOM mutation detected, applying styling fix...');
                setTimeout(fixRadioButtonStyling, 50);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['checked', 'class']
        });
    }
    
    // Apply fixes immediately
    fixRadioButtonStyling();
    
    // Monitor for changes
    monitorFormLibActivity();
    
    // Handle radio button clicks directly
    document.addEventListener('click', function(event) {
        const target = event.target;
        
        // Check if click is on a radio button or its visual elements
        if (target.type === 'radio' || 
            target.classList.contains('w-radio-input') || 
            target.classList.contains('radio_button-skip-step') || 
            target.classList.contains('w-form-formradioinput') ||
            target.closest('.radio_field, label.w-radio')) {
            
            console.log('[RadioFix] Radio button click detected, applying styling fix...');
            setTimeout(fixRadioButtonStyling, 50);
        }
    });
    
    // Handle change events
    document.addEventListener('change', function(event) {
        if (event.target.type === 'radio') {
            console.log('[RadioFix] Radio button changed, applying styling fix...');
            setTimeout(fixRadioButtonStyling, 50);
        }
    });
    
    // Periodic check every 3 seconds as backup
    setInterval(fixRadioButtonStyling, 3000);
    
    console.log('[RadioFix] Enhanced radio button styling fix initialized successfully');
})();

// Enhanced CSS injection for better styling
const additionalCSS = `
<style>
/* Enhanced radio button styling */
.radio_field.is-active-inputactive .w-radio-input,
.w-radio.is-active-inputactive .w-radio-input,
.radio_field.selected .w-radio-input,
.w-radio.selected .w-radio-input,
.w-radio-input.w--redirected-checked,
.radio_button-skip-step.w--redirected-checked,
.w-form-formradioinput.w--redirected-checked {
    background-color: #3898EC !important;
    border-color: #3898EC !important;
    position: relative !important;
}

.radio_field.is-active-inputactive .w-radio-input::before,
.w-radio.is-active-inputactive .w-radio-input::before,
.radio_field.selected .w-radio-input::before,
.w-radio.selected .w-radio-input::before,
.w-radio-input.w--redirected-checked::before,
.radio_button-skip-step.w--redirected-checked::before,
.w-form-formradioinput.w--redirected-checked::before {
    content: '' !important;
    display: block !important;
    width: 6px !important;
    height: 6px !important;
    background-color: white !important;
    border-radius: 50% !important;
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
}

/* Fallback for different radio button structures */
input[type="radio"]:checked + .w-radio-input,
input[type="radio"]:checked ~ .w-radio-input,
input[type="radio"]:checked + .radio_button-skip-step,
input[type="radio"]:checked ~ .radio_button-skip-step,
input[type="radio"]:checked + .w-form-formradioinput,
input[type="radio"]:checked ~ .w-form-formradioinput {
    background-color: #3898EC !important;
    border-color: #3898EC !important;
}

/* Ensure visual consistency */
.checkmark {
    position: absolute !important;
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%, -50%) !important;
    width: 6px !important;
    height: 6px !important;
    background-color: white !important;
    border-radius: 50% !important;
    display: block !important;
}

/* Hover states */
.radio_field:hover .w-radio-input,
.w-radio:hover .w-radio-input {
    border-color: #3898EC !important;
}
</style>
`;

// Inject the enhanced CSS
document.head.insertAdjacentHTML('beforeend', additionalCSS); 