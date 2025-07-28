# Easy Form Rollout Guide

This guide shows you how to quickly set up forms using the standardized `data-form` attribute system for easy deployment across projects.

## 🎯 **Quick Setup (3 Steps)**

### **Step 1: Form Container**
Add `data-form="multistep"` to your form container:

```html
<div data-form="multistep" class="form_wrapper">
  <!-- Your form content -->
</div>
```

### **Step 2: Required Fields**  
Add standard HTML `required` attribute to fields that need validation:

```html
<div class="form-field_wrapper">
  <label for="firstName">First Name*</label>
  <input 
    type="text" 
    name="firstName" 
    id="firstName" 
    required 
    class="form_input"
  >
  <!-- Error message element below -->
</div>
```

### **Step 3: Custom Error Messages**
Add `data-form="required"` to elements that should show custom error messages:

```html
<div class="form-field_wrapper">
  <label for="firstName">First Name*</label>
  <input 
    type="text" 
    name="firstName" 
    id="firstName" 
    required 
    class="form_input"
  >
  <div data-form="required" class="form_error-message">
    Please enter your first name
  </div>
</div>
```

## ✅ **Complete Example**

```html
<!-- Form Container with multistep attribute -->
<div data-form="multistep" class="form_wrapper">
  
  <!-- Required field with custom error message -->
  <div class="form-field_wrapper">
    <label for="firstName">First Name*</label>
    <input 
      type="text" 
      name="firstName" 
      id="firstName" 
      required 
      class="form_input"
    >
    <div data-form="required" class="form_error-message">
      Please enter your first name
    </div>
  </div>

  <!-- Email field with custom validation message -->
  <div class="form-field_wrapper">
    <label for="email">Email Address*</label>
    <input 
      type="email" 
      name="email" 
      id="email" 
      required 
      class="form_input"
    >
    <div data-form="required" class="form_error-message">
      Please enter a valid email address
    </div>
  </div>

  <!-- Navigation buttons -->
  <button type="button" data-form="next-btn" class="btn">Next</button>
</div>
```

## 🎨 **Webflow Designer Setup**

### **In Webflow Designer:**

1. **Create your form structure** with proper classes
2. **Add `required` attribute** to inputs in the element settings
3. **Add custom attributes** to form container:
   - Attribute: `data-form`
   - Value: `multistep`
4. **Add custom attributes** to error message elements:
   - Attribute: `data-form`
   - Value: `required`
5. **Set error message styling:**
   - Default state: `display: none`
   - (The JavaScript will show them with inline styles)

### **CSS Classes to Use:**
- Form container: `.form_wrapper`
- Field wrapper: `.form-field_wrapper` 
- Input fields: `.form_input`
- Error messages: `.form_error-message`
- Navigation: `.btn`

## 🔧 **How It Works**

1. **Automatic Detection:** The library automatically finds elements with `data-form="required"`
2. **Custom Messages:** Text content in these elements becomes the error message
3. **Inline Styling:** Library uses inline styles for guaranteed visibility (overrides Webflow defaults)
4. **Fallback Support:** Still works with legacy `.form_error-message` approach

## 🚀 **Benefits**

- ✅ **Simple Setup:** Just add 3 data attributes
- ✅ **No CSS Conflicts:** Uses inline styles for reliability  
- ✅ **Custom Messages:** Each field can have unique error text
- ✅ **Webflow Friendly:** Works with Webflow's constraints
- ✅ **Easy Rollout:** Copy-paste structure for new forms

## 📋 **Deployment Checklist**

- [ ] Form container has `data-form="multistep"`
- [ ] Required fields have `required` attribute
- [ ] Error elements have `data-form="required"`
- [ ] Error elements have descriptive text content
- [ ] CSS classes follow naming convention
- [ ] JavaScript library is loaded
- [ ] Test validation by submitting empty form
- [ ] Verify error messages appear and disappear correctly

## 🔄 **Migration from Legacy**

If you have existing forms with `.form_error-message` elements:

1. **Keep existing structure** (library supports both)
2. **Add `data-form="required"`** to error elements for priority
3. **Update text content** to your custom messages
4. **Test both approaches** work together

The new `data-form="required"` elements take priority, but legacy `.form_error-message` elements still work as fallback. 