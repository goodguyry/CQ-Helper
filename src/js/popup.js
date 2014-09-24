cqHelper.popup = {};

/**
* Set the options for opening the database
*/
var init = {
  cursor: {
    bound: false
  },
  keys: [],
  titles: [],
  onsuccess: function(e) {
    // Create arrays of the timeStamp and title values
    // These will be iterated over to create the list of environments
    init.keys.push(this.timeStamp);
    init.titles.push(this.title);
  },
  oncomplete: function() {
    var activeKey = localStorage.getItem('active_key');

    // If there are more than one environment, create a list for easy switching
    if (this.keys.length > 1) {
      // There are more than one environment
      // Create the unordered list element
      cqHelper.popup.addEnvironmentsList();
      // Create a list item for each environment
      var active;
      for (var i = 0; i < this.keys.length; i++) {
        // The current key matches the active key
        // Mark it as active
        active = (Number(activeKey) === this.keys[i]) ? true : false;
        // Create the list item
        cqHelper.popup.addListItem(this.keys[i], this.titles[i], active);
      }
    }
  }
};


/**
* Open the database and list the environments
* Set the newTab checkbox based on the saved value
* Add event listeners
*/
function contentLoaded() {
  // Set the radio button value based upon the stored value
  document.getElementById('tab-option').checked = cqHelper.common.newTabOptionChecked();
  // Add the event listeners
  cqHelper.popup.addEventListeners();
}

// Initialize the popup window
document.addEventListener('DOMContentLoaded', contentLoaded, false);


/**
* Create a list item for saved environments
* Only called if more than one saved environment exists
*
* @method addListItem
* @param {Number} key The environment's timeStamp index
* @param {String} title The environment's title
* @param {Boolean} active Whether or not this is the active environment
*/
cqHelper.popup.addListItem = function(key, title, active) {
  var ul = document.querySelector('#sites-list');
  var li = document.createElement('li');
  li.setAttribute('data-key', key);
  if (active) {
    // This is the active environment
    // The 'active' value is set both for styling and for preventing re-selection
    li.setAttribute('data-toggle', 'active');
  }
  li.setAttribute('tabindex', 0);
  li.innerHTML = title;
  ul.appendChild(li);
};


/**
* Create unordered list element
* The parent element for the saved environments list
*
* @method addEnvironmentsList
*/
cqHelper.popup.addEnvironmentsList = function() {
  // The list will be appended to div.list-wrapper
  var insertionLocation = document.querySelector('.list-wrapper');

  // Create the ul element
  var ul = document.createElement('ul');
  ul.setAttribute('name', 'sites-list');
  ul.setAttribute('id', 'sites-list');

  // Label the list
  var label = document.createElement('label');
  label.setAttribute('for', 'sites-list');
  label.innerHTML = 'Environments';

  // Insert the new elements
  insertionLocation.appendChild(label);
  insertionLocation.appendChild(ul);

  // Add an event listener to the parent element
  document.querySelector('#sites-list').addEventListener('click', function(e) {
    if (e.target && e.target.nodeName == "LI" && e.target.dataset.toggle !== 'active') {
      // A list item not marked as active was clicked
      // Save the data-key to localStorage so it can easily be retrieved
      localStorage.setItem('active_key', e.target.dataset.key);
      window.close(); // Make sure the popup closes
      chrome.runtime.reload(); // Reload to reset the values used by the extension
    }
  });
};


/**
* Add event listeners
*
* @method addEventListeners
*/
cqHelper.popup.addEventListeners = function() {

  // Get search query and send it to src/js/core/main.js
  document.querySelector('#search-field').addEventListener('keydown', function(e) {
    if (e && e.keyCode == 13) {
      // The return key was pressed
      var searchValue = e.target.value;
      // Send the search query to main.js for processing
      chrome.runtime.sendMessage({method:'sendSearchText', scriptMessage: searchValue}, function(response){
        window.close();
        console.log('Searching ' + response.scriptResponse + '...');
      });
    }
  });

  // The 'Links and Tools' list
  document.querySelector('#links').addEventListener('click', function(e) {
    if (e.target.nodeName === 'A') {
      /* An anchor element was clicked
       * Build the url based on the data-url value
       *
       * The urls are being generated dynamically
       * But, href attributes on the anchors with no host are interpreted as relative to the extension root
       * Processing the href to remove the extension host is more work than just using a data attribute
       * So the data-url attribute is used to build the url
       */
      var url = 'http://' + localStorage.getItem('cms_url') + e.target.dataset.url;
      chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
        window.close(); // Close the popup window
        i = tabs[0].index;
        chrome.tabs.create({'url': url, 'index': i + 1}); // Open the link in a new tab
      });
    }
  });

  // Capture the radio button click to store the new value
  document.querySelector('#tab-option').addEventListener('click', function(e) {
    var checkboxBoolean = e.target.checked;
    localStorage.setItem('new_tab_option_state', checkboxBoolean);
  });
};
