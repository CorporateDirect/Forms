# Step Item Branching Logic Fix Summary

## Issues Identified

### 1. CSS Class Mismatch
**Problem**: The JavaScript code was looking for step items using the CSS selector `.step-item` (with a hyphen), but the HTML markup uses the class `step_item` (with an underscore).

**Impact**: 
- Step items were never being found by the JavaScript
- Radio button selections couldn't trigger step_item visibility changes
- All step_items remained hidden regardless of user selection

**Files Affected**:
- `dist/modules/multiStep.js` - Line 59
- `dist/index.browser.js` - Line 1039  
- `dist/index.min.js` - Multiple locations

### 2. Missing Required Field Management
**Problem**: There was no logic to handle the `data-require-for-subtypes` attribute that controls which fields should be required based on the selected step_item subtype.

**Impact**:
- Required fields remained active even when their step_item was hidden
- Users could be blocked by validation errors for fields they couldn't see
- Form validation didn't properly adapt to the selected branch path

## Fixes Implemented

### 1. CSS Class Selector Fix
**Change**: Updated all instances of `.step-item` to `.step_item` in JavaScript files.

**Files Modified**:
```javascript
// Before:
const stepItemElements = parentStep.element.querySelectorAll('.step-item');

// After:
const stepItemElements = parentStep.element.querySelectorAll('.step_item');
```

**Locations**:
- `dist/modules/multiStep.js:59`
- `dist/index.browser.js:1039`
- `dist/index.min.js` (multiple locations)

### 2. Required Field Management Implementation
**Change**: Added `updateRequiredFields()` function to enable/disable required fields based on step_item visibility and subtype.

**New Function**:
```javascript
/**
 * Update required fields based on step_item subtype
 */
function updateRequiredFields(stepItemElement, enable = true) {
    const subtype = getAttrValue(stepItemElement, 'data-step-subtype');
    if (!subtype) return;
    
    console.log(`[FormLib] ${enable ? 'Enabling' : 'Disabling'} required fields for subtype: ${subtype}`);
    
    // Find all fields with data-require-for-subtypes attribute in this step_item
    const conditionalFields = stepItemElement.querySelectorAll('[data-require-for-subtypes]');
    
    conditionalFields.forEach(field => {
        const requiredForSubtypes = field.getAttribute('data-require-for-subtypes');
        const htmlField = field;
        
        if (requiredForSubtypes && requiredForSubtypes.split(',').map(s => s.trim()).includes(subtype)) {
            // This field should be required for this subtype
            if (enable) {
                htmlField.required = true;
                htmlField.disabled = false;
                console.log(`[FormLib] Enabled required field: ${htmlField.name || htmlField.id} for subtype: ${subtype}`);
            } else {
                htmlField.required = false;
                htmlField.disabled = true;
                htmlField.value = ''; // Clear the value when disabling
                console.log(`[FormLib] Disabled required field: ${htmlField.name || htmlField.id} for subtype: ${subtype}`);
            }
        }
    });
}
```

**Integration Points**:
- Called when showing a step_item: `updateRequiredFields(stepItem.element, true)`
- Called when hiding step_items: `updateRequiredFields(item.element, false)`

**Files Modified**:
- `dist/modules/multiStep.js` - Added function and integrated into showStepItem/hideStepItem
- `dist/index.browser.js` - Added function and integrated into showStepItem/hideStepItem

## How the Fix Works

### Radio Button Selection Flow
1. User clicks a radio button (e.g., "Individual", "Entity", "Trust")
2. Radio button has `data-go-to="individual-1"` attribute
3. Branching logic triggers `showStepItem("individual-1")`
4. JavaScript now correctly finds step_item with `data-answer="individual-1"` using `.step_item` selector
5. All step_items in the parent step are hidden and their required fields disabled
6. Target step_item is shown and its required fields enabled based on `data-step-subtype`

### Required Field Management
1. When a step_item is shown:
   - Find all fields with `data-require-for-subtypes` attribute
   - Check if the field's required subtypes include the current step_item's subtype
   - Enable and mark as required only the relevant fields
   
2. When step_items are hidden:
   - Disable all fields with `data-require-for-subtypes` 
   - Remove required attribute
   - Clear field values to prevent validation issues

## Testing

A test file `test_fix.html` was created to verify the fixes work correctly. The test includes:
- Radio buttons with proper `data-go-to` attributes
- Step_items with correct `data-answer` and `data-step-subtype` attributes  
- Form fields with `data-require-for-subtypes` attributes
- Visual styling to show/hide behavior
- Console logging for debugging

## Expected Behavior After Fix

1. **Radio Button Selection**: Clicking a radio button should immediately show the corresponding step_item and hide others
2. **Required Field Management**: Only fields relevant to the selected subtype should be required and enabled
3. **Form Validation**: Users should only be validated against fields in visible step_items
4. **Clean State**: Switching between options should clear values from hidden step_items

## Files Changed

1. `dist/modules/multiStep.js` - Fixed CSS selector and added required field management
2. `dist/index.browser.js` - Fixed CSS selector and added required field management  
3. `dist/index.min.js` - Fixed CSS selector (minified version)
4. `test_fix.html` - Created for testing the fixes
5. `BRANCHING_FIX_SUMMARY.md` - This documentation file

## Verification Steps

To verify the fix works:
1. Open the form in a browser
2. Select different radio button options
3. Confirm only the corresponding step_item is visible
4. Confirm only relevant fields are marked as required
5. Test form validation to ensure hidden fields don't block submission
6. Check browser console for proper logging of step_item visibility changes 