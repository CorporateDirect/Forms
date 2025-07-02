const fs = require('fs');
const path = require('path');

// Read all the compiled JavaScript files
const configJs = fs.readFileSync('dist/config.js', 'utf8');
const utilsJs = fs.readFileSync('dist/modules/utils.js', 'utf8');
const formStateJs = fs.readFileSync('dist/modules/formState.js', 'utf8');
const branchingJs = fs.readFileSync('dist/modules/branching.js', 'utf8');
const multiStepJs = fs.readFileSync('dist/modules/multiStep.js', 'utf8');
const validationJs = fs.readFileSync('dist/modules/validation.js', 'utf8');
const errorsJs = fs.readFileSync('dist/modules/errors.js', 'utf8');
const summaryJs = fs.readFileSync('dist/modules/summary.js', 'utf8');
const indexJs = fs.readFileSync('dist/index.js', 'utf8');

// Function to clean up module code and rename conflicting variables
function cleanModuleCode(code, modulePrefix) {
  // Remove import statements
  code = code.replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '');
  
  // Remove all export statements
  code = code.replace(/export\s+{[^}]*};\s*/g, '');
  code = code.replace(/export\s+default\s+/g, '');
  code = code.replace(/export\s+/g, '');
  
  // Remove standalone export lines
  code = code.replace(/^\s*default\s+\w+;\s*$/gm, '');
  
  // Remove sourcemap comments
  code = code.replace(/\/\/# sourceMappingURL=.*$/gm, '');
  
  // Rename conflicting variables with module prefix
  if (modulePrefix) {
    code = code.replace(/let initialized/g, `let ${modulePrefix}Initialized`);
    code = code.replace(/initialized/g, `${modulePrefix}Initialized`);
  }
  
  // Remove any trailing empty lines
  code = code.trim();
  
  return code;
}

// Clean all modules with unique prefixes for conflicting variables
const cleanedConfig = cleanModuleCode(configJs);
const cleanedUtils = cleanModuleCode(utilsJs);
const cleanedFormState = cleanModuleCode(formStateJs);
const cleanedBranching = cleanModuleCode(branchingJs, 'branching');
const cleanedMultiStep = cleanModuleCode(multiStepJs, 'multiStep');
const cleanedValidation = cleanModuleCode(validationJs, 'validation');
const cleanedErrors = cleanModuleCode(errorsJs, 'errors');
const cleanedSummary = cleanModuleCode(summaryJs, 'summary');
const cleanedIndex = cleanModuleCode(indexJs);

// Create the browser bundle
const browserBundle = `/*!
 * Form Functionality Library v1.1.0
 * Browser-compatible bundle
 */
(function(window) {
  'use strict';
  
  ${cleanedConfig}
  
  ${cleanedUtils}
  
  ${cleanedFormState}
  
  ${cleanedBranching}
  
  ${cleanedMultiStep}
  
  ${cleanedValidation}
  
  ${cleanedErrors}
  
  ${cleanedSummary}
  
  ${cleanedIndex}
  
  // Expose to global scope
  if (typeof window !== 'undefined') {
    window.FormLibrary = FormLibrary;
    window.FormLib = FormLib;
  }
  
})(typeof window !== 'undefined' ? window : this);
`;

// Write the browser bundle
fs.writeFileSync('dist/index.browser.js', browserBundle);
console.log('Browser bundle created: dist/index.browser.js'); 