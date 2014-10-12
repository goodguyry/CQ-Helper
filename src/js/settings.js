cqHelper.settings = {};

/**
 * Set the options for opening the database
 */
var init = {
  cursor: {
    // Cursor through all objects
    bound: false
  },
  // Initialized as a counter
  counter: 0,
  onsuccess: function(e) {
    // this = result.value
    if (init.counter === 0) {
      // For the first environment, fill the form with saved values
      cqHelper.settings.fill(this, true);
    } else if (init.counter > 0) {
      // For each environment after the first, add a selector
      cqHelper.settings.selector('inactive', this.timeStamp, this.title);
    }
    init.counter++;
  },
  oncomplete: function(e) {
    var restore = new FormElements();
    if (this.counter === 0) {
      // There are no saved environments
      // Set the titles...
      restore.formHeading.innerHTML = 'Site';
      restore.selectors[0].innerHTML = 'Site';
      // ... and generate a data-key for the form and selector
      cqHelper.settings.newDataKey(new Date().getTime());
    }
  }
};


/**
* Collect most-used form elements
*/
function FormElements() {
  this.form = document.getElementsByTagName('form')[0];
  this.formHeading = document.getElementsByTagName('h2')[0];
  this.inputs = this.form.getElementsByTagName('input');
  this.selectors = document.getElementsByTagName('li');
  this.statusMessage = document.getElementById('status');
}


// Add event listeners
document.addEventListener('DOMContentLoaded', function () {
  cqHelper.settings.eventListeners();
}, false);


/**
* Create a list item for saved environments
* Only called if more than one saved environment exists
*
* @method save
* @param {Event} e
* @param {Function} action The callback to be run by the oncomplete handler
* @param {Function} validated cqHelper.settings.validate passed as a callback
*/
cqHelper.settings.save = function(e, action, validated) {
  // Display a message if any required fields are left blank
  if (validated()) {

    // Gather the form values
    var environment = cqHelper.settings.formValues(new FormElements());

    // Write the update/save to the database
    var addOptions = {
      data: environment,
      onsuccess: function(e) {
        console.log(addOptions.data.title, 'added/updated');
      },
      oncomplete: action,
      onerror: function(e) {
        alert('Error adding environment', this.data.title);
      }
    };

    // IndexedJS `add` method
    cqHelperDB.add(addOptions);
    /**
     * Place the localStorage import into the queue
     * in case the environment being saved is the lone environment
     * otherwise the db query in the import is run while/before the environment is saved
     * which results in nothing actually being imported into localStorage
     */
    window.setTimeout(cqHelper.common.copyActiveEnvironment, 100);

  } else { // Not validated

    console.error('Not validated: Highlighted fields are required');

    // Display a notification to let the user know there are unfilled fields
    cqHelper.settings.feedback('failure', 'Highlighted fields are required.');
  }
};


/**
* Remove an environment
*
* @method remove
*/
cqHelper.settings.remove = function() {
  // Confirm intent to remove this fieldset
  var deleteThisItem = confirm('Are you sure you want to remove this item');

  // If confirmed
  if (deleteThisItem) {

    // Get the form's data-key value
    var dataKey = cqHelper.settings.formDataKey();

    /**
      * Remove the selector and reset the form values
      *
      * @function removeSelectorAndValues
      * @param {Event} e
      * @param {Object} store The objectStore
      * @param {Number} formDataKey The form's data-key attribute value
      */
    var removeSelectorAndValues = function(e, store, formDataKey) {
      var remove = new FormElements();

      if (remove.selectors.length > 1) {
        // There's more than one environment selector
        // Remove the active selector

        // Set up the cqHelperDB.query options
        var fillOptions = {
          onsuccess: function(e) {
            cqHelper.settings.fill(this, false);
          }
        };

        for (var t = 0; t < remove.selectors.length; t++) {
          // Grab the selector's status and check for 'active'
          var selectorDataKey = remove.selectors[t].getAttribute('data-key');
          var selectorSibling, siblingDataKey;
          if (Number(selectorDataKey) === formDataKey) {
            // Get the selector's sibling; previous is preferred
            if (remove.selectors[t].previousElementSibling) {
              selectorSibling = remove.selectors[t].previousElementSibling;
              siblingDataKey = selectorSibling.getAttribute('data-key');
            } else {
              selectorSibling = remove.selectors[t].nextElementSibling;
              siblingDataKey = selectorSibling.getAttribute('data-key');
            }
            // Remove the selector and set it's sibling to active
            remove.selectors[t].remove();
            selectorSibling.setAttribute('data-status', 'active');
            var newKey = Number(siblingDataKey);

            // Fill the form with the sibling's values
            fillOptions.key = newKey;
            cqHelperDB.query(fillOptions);
          }
        }
      } else {
        // There's only one environment selector
        // Clear/reset the form
        cqHelper.settings.clearForm();
        cqHelper.settings.newDataKey(new Date().getTime());
      }
      // Remove validator highlighting
      // In case an empty form is being cleared
      // This keeps the highlighting and feeback from persisting
      for (var i = 0; i < remove.inputs.length; i++) {
        var input = remove.inputs[i];
        // Remove the highlight upon validation
        input.classList.remove('highlight');
      }
      remove.statusMessage.innerHTML = '';

      // If the active key is this environment's key, remove it
      if (Number(localStorage.getItem('active_key')) === formDataKey) {
        localStorage.removeItem('active_key');
      }
    };

    // Interact with the database
    var deleteOptions = {
      key: dataKey,
      onsuccess: function(e) {
        // Display a successful feedback message
        cqHelper.settings.feedback('success', result.title + ' deleted');
      },
      oncomplete: function(e) {
        // Clear the form and remove the environment's selector
        removeSelectorAndValues(e, IndexedJS.store, this.key);
      },
      onerror: function(e) {
        alert('Error deleting environment', result.title);
      }
    };

    // IndexedJS `delete` method
    cqHelperDB.delete(deleteOptions);
  }
};


/**
* Get the form data-key attribute value
*
* @method formDataKey
* @return {Number}
*/
cqHelper.settings.formDataKey = function() {
  var settingsForm = document.getElementsByTagName('form')[0];
  var dataKey = settingsForm.getAttribute('data-key');
  return Number(dataKey);
};


/**
* Collect form values into environment object
*
* @method formValues
* @param {Object} collect A newly instantiated FormElements() object
* @return {Object}
*/
cqHelper.settings.formValues = function(collect) {
  // Clear the environment object
  environment = {};

  // Get the environment title form the h2
  var title = collect.formHeading.innerHTML;
  environment.title = title;

  // Add the value from each input
  for (var i = 0; i < collect.inputs.length; i++) {
    var field = collect.inputs[i];
    var fieldName = field.name;
    var fieldValue;
    if (field.value.trim() === '') {
      // The trimmed value is empty
      // Set the variable value to an empty string
      fieldValue = '';
    } else {
      fieldValue = field.value;
    }
    // Format the object key based on the input field's name attribute
    var storageName = fieldName.split('-').join('_');
    environment[storageName] = fieldValue;
  }
  // Add the data-key attribute from the form
  environment.timeStamp = Number(collect.form.getAttribute('data-key'));
  return environment;
};


/**
* Fill the form values from the environment object
*
* @method fill
* @param {Object} environment The saved environment object
* @param {Boolean} selector Whether or not the selector title should be filled
*/
cqHelper.settings.fill = function(environment, selector) {
  // Instantiate a new FormElements object
  var fill = new FormElements();

  // Restore the first selector title and data-key
  // Only run when restoring the values on page load
  if (selector) {
    // The first selector is active by default on page load
    fill.selectors[0].innerHTML = environment.title;
    // Set the first selector's data-key
    fill.selectors[0].setAttribute('data-key', environment.timeStamp);
  }

  // Fill the form with saved values
  for (var field in environment) {
    if (field === 'title') {
      // Add the title to the form h2
      // The selector has already been set, either from restore or newEnvironment
      fill.formHeading.innerHTML = environment[field];
    } else if (field === 'timeStamp') {
      // Set the form's data-key
      fill.form.setAttribute('data-key', environment[field]);
    } else {
      // Format the key to match the input's name
      var dbField = field.split('_').join('-');
      // Fill the appropriate input by matching the name
      var fieldName = document.getElementsByName(dbField)[0];
      if (fieldName) {
        fieldName.value = environment[field];
      }
    }
  }
};


/**
* Validate the active form's values
*
* @method validate
* @return {Boolean}
*/
cqHelper.settings.validate = function() {
  // Instantiate a new FormElements object
  var validate = new FormElements();
  // validated set to true until it's not
  var validated = true, input, theValue;

  for (var i = 0; i < validate.inputs.length; i++) {
    input = validate.inputs[i];
    // Only validate required fields
    if (input.required) {
      if (input.value.trim() === '') {
        // The trimmed value is empty
        // Reset the value to an empty string
        input.value = '';
        // highlight invalid fields
        input.classList.add('highlight');
        validated = false;
      } else {
        // Remove the highlight upon validation
        input.classList.remove('highlight');
      }
    }
  }
  return validated;
};


/**
 * Format paths to work with cqHelper
 *
 * @method cleanPathEnd
 * @oaram {String} path The input value
 * @return {String} Returns modified path, if affected
 */
cqHelper.settings.cleanPathEnd = function(path) {
  if (path !== '') {
    // Remove a trailing slash
    if (path.substring(path.length -1) === '/') {
      path = path.substring(0, path.length -1);
    }
    // Add a slash at the beginning if it's not there
    if (path.substring(0, 1) !== '/') {
      path = '/' + path;
    }
  }
  return path;
};


/**
 * Clean up URLs if they're formatted incorrectly
 *
 * @method cleanUrlEntry
 * @oaram {String} url The input value
 * @return {String} Returns modified url, if affected
 */
cqHelper.settings.cleanUrlEntry = function(url) {
  if (url !== '') {
    urlArray = url.split('/');
    // Remove the protocol, if present
    if (urlArray[0] === 'http:' || urlArray[0] === 'https:') {
      url = urlArray[2];
    }
    // Remove a trailing slash
    if (url.substring(url.length -1) === '/') {
      url = url.substring(0, url.length -1);
    }
  }
  return url;
};


/**
 * Routes input values to the appropriate clean-up function
 *
 * @method routeInputValues
 * @param {Event} e
 */
cqHelper.settings.routeInputValues = function(e) {
  if (e.target && e.target.type === 'text') {
    if (e.target.value.trim() === '') {
      // The trimmed value is empty
      // Reset the value to an empty string
      e.target.value = '';
    }
    // This is an input with type=text whose value is not empty or a series of spaces
    var nameAttribute = e.target.name, newValue = '';

    if (nameAttribute.split('-')[1] === 'url') {
      // The name attribute contains 'url'
      // Clean the input's value
      newValue = cqHelper.settings.cleanUrlEntry(e.target.value);
      this.value = newValue;
    } else if (nameAttribute.split('-')[1] === 'path') {
      // The name attribute contains 'path'
      // Clean the input's value
      newValue = cqHelper.settings.cleanPathEnd(e.target.value);
      this.value = newValue;
    }
  }
};


/**
* Display a notification
*
* @method feedback
* @param {String} status Class to be applied ('success'/'failure')
* @param {String} message The message to display in the notification
*/
cqHelper.settings.feedback = function(status, message) {
  var statusMessage = document.getElementById('status');
  // Set the class attribute based on status
  statusMessage.setAttribute('class', status);
  // Display the message
  statusMessage.innerHTML = message;
  window.setTimeout(function() {
    // Set the class attribute based on status
    statusMessage.innerHTML = '';
    statusMessage.removeAttribute('class', status);
  }, 1000);
};


/**
* Clear form fields
* Called on new environment creation and environment removal
*
* @method clearForm
*/
cqHelper.settings.clearForm = function() {
  // Instantiate a new FormElements object
  var clear = new FormElements();

  if (clear.selectors.length > 1) {
    // There are more than one selector
    // Called from newEnvironment
    var counter = clear.selectors.length;
    clear.formHeading.innerHTML = 'Site ' + counter;
    // 'clear.selectors.length - 1' sets the new selector's title
    clear.selectors[counter -1].innerHTML = 'Site ' + counter;
  } else {
    // There is only one selector
    // Called from removeSelectorAndValues
    clear.formHeading.innerHTML = 'Site';
    clear.selectors[0].innerHTML = 'Site';
  }

  // Finally, clear the form values
  for (var i = 0; i < clear.inputs.length; i++) {
    var field = clear.inputs[i];
    field.value = '';
  }
};


/**
* Add a new environment
*
* @method newEnvironment
*/
cqHelper.settings.newEnvironment = function() {
  var selectors = document.getElementsByTagName('li');
  var settingsForm = document.getElementsByTagName('form')[0];

  // Set 'active' selector to 'inactive'
  for (var s = 0; s < selectors.length; s++) {
    var selectorStatusAttr = selectors[s].getAttribute('data-status');
    if (selectorStatusAttr === 'active') {
      selectors[s].setAttribute('data-status', 'inactive');
    }
  }
  // Used to number the title (e.g., 'Site 4')
  var count = selectors.length + 1;
  // Each selector and form needs a key to be associated with an environment
  var newKey = new Date().getTime();
  cqHelper.settings.selector('active', newKey, 'Site ' + count);
  settingsForm.setAttribute('data-key', newKey);
  // Clear form fields
  cqHelper.settings.clearForm();
};


/**
* Adds a selector
* Used when restoring on page load and when adding a new environment
*
* @method selector
* @param {String} status Whether or not the new selector should be active
* @param {Number} key The environment key for the data-key attribute
* @param {String} title The title for the selector
*/
cqHelper.settings.selector = function(status, key, title) {
  // Create a selector item
  var selectorItem = document.createElement('li');
  // Set the selector's data- attributes
  selectorItem.setAttribute('data-status', status);
  selectorItem.setAttribute('data-key', key);
  selectorItem.setAttribute('tabindex', 0);
  // Set the selector's title
  selectorItem.innerHTML = title;
  // Append the selector to the bottom of the list
  var selectorParent = document.getElementById('environments');
  selectorParent.appendChild(selectorItem);
};


/**
* Add a new data-key attribute to the selector and form
*
* @method newDataKey
* @param {Number} key The timeStamp to be used as the new data-key
*/
cqHelper.settings.newDataKey = function(key) {
  var newKey = new FormElements();

  newKey.form.setAttribute('data-key', key);
  newKey.selectors[0].setAttribute('data-key', key);
};


/**
* A generic error handler
*
* @method error
* @param {Event} e
*/
cqHelper.settings.error = function(e) {
  console.error('Could not perform operation');
  console.dir(e);
};


/**
 * Import settings file
 */
cqHelper.settings.importSettings = function() {
  // the file list
  var fileList = document.getElementById('environments-import').files;

  var fileReader = new FileReader();
  var environments;

  // Bind function to the FileReader onloadend event to know when file is fully loaded
  fileReader.onloadend = (function(file) {
    return function(e) {

      try {
        // file's content in e.target.result
        environments = JSON.parse(e.target.result);
      } catch(execption) {
        alert("There was a problem with the selected file.\n\nPlease ensure the selected file contains valid JSON.\n");
        return false;
      }

      var importOpts = {
        oncomplete: function(e) {
          cqHelper.settings.feedback('success', 'Settings import complete');
          window.setTimeout(function(){
              location.reload();
            }, 1200);
        },
        onerror: function(e) {
          alert('Error adding environment', importOpts.data.title);
        }
      };

      // iterate through environments
      for (var obj in environments) {
        // set the timeStamp
        environments[obj].timeStamp = new Date().getTime();
        // use the object property as the title
        environments[obj].title = obj;
        // add the environment to the import options' data object
        importOpts.data = environments[obj];
        console.log(importOpts.data);
        // Add the environment
        cqHelperDB.add(importOpts);
      }
    };
  })(fileList[0]);  // fileList[0] assumes only one file has been selected

  // read the file
  fileReader.readAsText(fileList[0]);
};


/**
* Add event listeners
*
* @method eventListeners
*/
cqHelper.settings.eventListeners = function() {
  // 'Add' button clicked
  document.querySelector('#add').addEventListener('click', function(e) {
    // cqHelper.settings.save(e, action, validate)
    cqHelper.settings.save(e, cqHelper.settings.newEnvironment, cqHelper.settings.validate);
  });

  // Clean input values
  var formInputs = document.getElementsByTagName('input');
  for (var i = 0; i < formInputs.length; i++) {
    formInputs[i].addEventListener('blur', cqHelper.settings.routeInputValues);
  }

  // Save settings when save button is clicked
  document.querySelector('#save').addEventListener('click', function(e) {
    e.stopPropagation();
    e.preventDefault();
    // cqHelper.settings.save(e, action, validate)
    cqHelper.settings.save(e, function() {
        cqHelper.settings.feedback('success', 'Settings saved!');
      },
    // validate
    cqHelper.settings.validate);
    window.setTimeout(function() {
      chrome.runtime.reload();
    },800);
  });

  // Update the selector title when the environment title changes
  document.querySelector('.editable').addEventListener('blur', function() {
    // Get new title
    // 'this' is the contenteditable span, which wraps the h2
    var titleElement = this.firstChild;
    var newTitle = titleElement.innerHTML;

    // Get the parent fieldset's data-key
    // We use this to find the matching selector
    var formDataKey = cqHelper.settings.formDataKey();

    // Find the matching selector
    // The best way to know we're updating the correct title
    var selectors = document.getElementsByTagName('li');
    for (var s = 0; s < selectors.length; s++) {
      // Grab the selector's data-key and check for a match to the fieldset data-key
      var selectorDataKeyAttr = selectors[s].getAttribute('data-key');
      if (Number(selectorDataKeyAttr) === formDataKey) {
        // Set selector title based on fieldset title
        selectors[s].innerHTML = newTitle;
      }
    }
  });

  // Form title: Set cursor position to end of title
  document.querySelector('.editable').addEventListener('focus', function() {
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(this.childNodes[0], 1);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
  });

  /**
  * Toggle Environments
  * Activated by click or spacebar
  *
  * @method handleListActivation
  * @param {Event} e
  */
  cqHelper.settings.handleListItemActivation = function(e) {
    // Set data-status to 'pending' so it can be easily found without passing e.target around
    e.target.dataset.status = 'pending';
    // cqHelper.settings.save(e, action, validate)
    cqHelper.settings.save(e,
      function(e) {
        // Toggle the environments (action)
        var selectors = document.getElementsByTagName('li');

        // Set up the cqHelperDB.query options
        var fillOptions = {
          onsuccess: function(e) {
            cqHelper.settings.fill(this, false);
          }
        };

        for (var s = 0; s < selectors.length; s++) {
          var selectorStatusAttr = selectors[s].getAttribute('data-status');
          if (selectorStatusAttr === 'active') {
            // The selector's status is active, reset it to 'inactive'
            selectors[s].setAttribute('data-status', 'inactive');
          } else if (selectorStatusAttr === 'pending') {
            // The selector's status was set to 'pending' in the click listener
            selectors[s].setAttribute('data-status', 'active');
            var newKey = Number(selectors[s].dataset.key);

            // Fill the form with the selected environment's values
            fillOptions.key = newKey;
            cqHelperDB.query(fillOptions);
          }
          cqHelper.settings.feedback('success', 'Settings saved!');
        }
      },
      // validate
      cqHelper.settings.validate);
  };

  // Environment selector clicked
  document.getElementById('environments').addEventListener("click", function(e) {
    if (e.target &&
        e.target.nodeName == "LI" &&
        e.target.dataset.status !== 'active') {
        // A list item not marked as active was clicked
      cqHelper.settings.handleListItemActivation(e);
    }
  });
  // Environment selector focused and activated by spacebar
  document.getElementById('environments').addEventListener("keydown", function(e) {
    if (e.target &&
        e.target.nodeName == "LI" &&
        e.target.dataset.status !== 'active' &&
        e.keyCode == 32) {
        // A list item not marked as active was activated by the spacebar
      cqHelper.settings.handleListItemActivation(e);
    }
  });

  // Remove icon clicked
  document.querySelector('.remove').addEventListener('click', cqHelper.settings.remove);
  // Remove icon focused and activated by spacebar
  document.querySelector('.remove').addEventListener('keydown', function(e) {
     if (e && e.keyCode == 32) {
       cqHelper.settings.remove();
     }
  });

  document.getElementById('environments-import').addEventListener('change', cqHelper.settings.importSettings, false);

};
