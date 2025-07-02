# Form Functionality

## Project Goals

I want to build a modular, flexible library to add functionality to webflow forms. The user should have the ability to use this with a single step form, a multi-step form, and a multi-step form with logic branching. 

Because this project is modular, and it utilizes webflow, I will require specific elements be built and assigned a data-attribute to connect functionality. 


## Project Structure

/forms-lib
 ├── /modules
 │   ├── branching.ts (handles all branching logic)
 │   ├── multiStep.ts (handles step visiblity and step progression)
 │   ├── validation.ts (handles all form field validation and interacts with branching and multi-step funcitons to ensure proper form validation.)
 │   ├── errors.ts (handles custom form-field errors)
 │   └── utils.ts
 ├── index.ts
 ├── config.ts
 ├── tsconfig.json
 ├── console-logs.txt
 ├── index.html
 ├── README.md
 └── instructions.md

 ## Instructions

 1. Build a functional modular form functionality library that handles single-step forms, multi-step forms, and branch logic, manages validation (branch logic will require validation logic that listens to the path the user takes and disables validation when inactive branches are present)

 2. We will utilize data-attributes to bind our functionality to webflow webform elements, as well as additional third-party plugins. DO NOT assing functionality to html classes or IDs. Classes and IDs will vary accross project so only use our defined data-attributes to bind funcitonality.

 3. We will build a summary module that will allow us to listen to inputs with defined data-attributes, store them in the browser, and output them to their corresponding data-attributes on the defined summary step. 

 3. Keep all files modular. Our goal is to create a flexible, re-usable library that we can utilize for all our forms (not just a single form). 

 4. Review the definitions of all modules and ensure functionality meets and exceeds these specifications.

 5. Always review the entire codebase before modifying a file ensuring full functionality, optimizing for efficiency in code. 

 6. If testing is required, ensure that once the test is complete, the file is removed, the goal being a clean, tidy codebase.

 7. We are a team. Let's move step, by step, to building and testing this functionailty. I would like to go step-by-step through our functionality building each feature, testing, providing feedback, adjusting (if needed) and verifying before we move onto a new step. 

8. tryformly.com is an example library with similar functionality. Review their docs to get an understanding of how they are building their library. I would use them, but their functionality is limited and it's an unmaintained project. 

9. Ensure that as we build, console logs are added to the code so that when we test, we have verbose logs of what is occuring so we can ensure funcitonality is accurate. 

10. We will use a file "console-logs.txt" where I will paste the full console from each test so that you can have maximum visibilty into what's occuring with the form as we test.

11. I will upload a file "index.html" which I will add our exported webflow code so that you can look at the structure and nature of the form so that we can apply functionality. 

12. It is important that what we build follows our guidelines that this code must be able to be applied across multiple projects, and websites so the functinality that we build needs to be modular, repeatable and easy for the end user to program in webflow.

13. On every commit, please output the newest jsdelivry URL using a version that is development friendly (using the commit for a unique url)

14. @index.html is added for context. this is from a webflow project export where the acutal script will be used. Do not add any code to this file! If there is a need to modify html, please let me know and I will update it in webflow, then I will export the newest html and add it here. 

15. before each commit, the URL that we use for jsdelivr must always use a minified form.


 ## Data Attributes

 We've identified various data-attributes that should be utilized for functionality:

 ### Form Block

 Webflow's form wrapper.

 Data attribute:

 [data-form="multistep"]: defines the form as a multi-step and envokes all multi-step form funcitonality, navigation, hiding steps until called, etc. 

 [data-logic="true"]: defines branch logic, allowing users to build multiple paths based on user-selected inputs. 

 ### Step Wrapper

 [data-form="step"]: defines a step wrapper.

 ### Form Targetting

 [data-go-to=""]: defines what the next step is. it is paired with data-answer to create a target. This can be used for linear multi-step forms or forms with branch logic. As long as the values match between data-go-to and data-answer, the user should follow that path.

 [data-answer""]: defines the target of data-go-to. data-go-to and data-answer can be any data-attribute value, but they must match in order advance from the origin to the target.


 ### Form navigation

 [data-form="next-btn"]: defines the button that will enable the user to go from one-step to another.

 [data-form="back-btn"]: defines the button that will enable the user to go back one step.

 [data-skip=""]: using the same logic as data-go-to and data-answer, data-skip="" allows a user to skip a step and navigate to the step that is defined in the data attribute's value. For example, if we're on "step-3" and we have a data-skip="step-7", data-skip will take you to the step with data-answer="step=7".

 [data-form="submit"]: controls the webfow form's submit 


 ### Step Categorization

 Each step will be able to be defined according to a categorization scheme. This will be most beneficial for organizing the output and if there is a summary component.

 [data-step-type=""]: Defines the top-level category of a group of inputs. For example: [data-step-type="manager] indicates that the step of inputs in that step are asscociated with a Manager output. 

 [data-step-subtype=""]: defines a secondary-level category of a group of inputs. For example if you already have [data-step-type="mamanger"], but you want to further categorize the manager as an assistant manager, you would be able to add [data-step-subtype="assistant"] to the same step wrapper to further define the step inputs. 

 [data-step-number=""]: defines an order to a step if branch logic is being used and you have multiple branches to define a particular group of data. For example, if we have three steps with of [data-step-type="manager"] and we need to know how to order them in a summary, we could number them, the first "manager" would have [data-step-number="1"], the second "manager" would have [data-step-number="2"], etc. 


 ### Summary Component

### Summary Data Fields
 [data-form-summary=""]: Defines the step wrapper with the summary. 

 [data-step-field-name=""]: Defines a unique field input name that will be used in the summary.

 [data-summary-field=""]: Defines the target of a unique field input. multiple [data-step-field-name] values can be added to this data attribute by introducing a "|".
  
  Example: when an input field has a data-attribute [data-step-field-name="firstName"], we can assign an empty text element in the summary with [data-summary-field="firstName"] and the value that the user input into the text field will be populated. 

 Adding multiple [data-step-field-name] data attributes to one [data-summary-field]s, is done by adding a pipe between the two values. [data-step-field-name="firstName|lastName]. The user can then define if it's comma separated or there should be a space by adding one of the following: [data-join="space"] or [data-join="comma"].

 [data-join=""]: allows a user to dictate formatting when a [data-summary-field] has two or more values.

#### Summary component and categorization structure
To create segments for dynamic summaries, it's important that we create a data-attiribute to define the type and subtype and what data-step the values originate. 

[data-summary-type=""]: Defines the summary output of a particular step's [data-step-type=""]

[data-summary-subtype=""]: Defines the summary output of a particular step's [data-step-subtype=""]

[data-summary-number=""]: Defines the summary output of a particular step's [data-step-number=""]

For example, if a step has [data-step-type="manager"], [data-step-subtype="assistant"] and [data-step-number="1"] we will know what step inputs we should add to the summary with the corresponding [data-summary-type="manager"], [data-summary-subtype="assistant"], and [data-summary-number="1"].





 



