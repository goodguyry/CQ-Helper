var cqHelper = {};
cqHelper.common = {};

/**
 * Initialize a new database
 */
var cqHelperDB = new IndexedJS({
  name: 'settings',
  version: 1,
  store: 'environments',
  keyPath: 'timeStamp',
  index: {
    title: false
  },
  onsuccess: function() {
    // IndexedJS `query` method
    // `init` defined in main.js, settings.js and popup.js
    cqHelperDB.query(init);
  }
});


/**
 * Copy the active environment to localStorage
 *
 * @param {Object} environment The environment to be copied into localStorage
 */
cqHelper.common.copyToLocalStorage = function(environment) {
  for (var field in environment) {
    if (field === 'search_path' && environment[field] === '') {
      var live = environment.live_url;
      localStorage.setItem('search_path', 'http://www.google.com/search?&q=site:' + live + '+');
    } else {
      localStorage.setItem(field, environment[field]);
    }
  }
  localStorage.setItem('site_admin', '/siteadmin#');
  localStorage.setItem('dam_admin', '/damadmin#');
};


/**
 * In absence of an active key in localStorage, use the first environment found
 */
cqHelper.common.setActiveKeyAndCopyToLocalStorage = function() {
  var importOpts = {
    cursor: {
      bound: false
    },
    data: [],
    onsuccess: function(e) {
      // Create array of the object values
      // These will be iterated over to create the list of environments
      importOpts.data.push(this.value);
    },
    oncomplete: function(e) {
      // Copy the first environment into localStorage
      cqHelper.common.copyToLocalStorage(this.data[0]);
      // Set the first environment's timeStamp as the active key
      localStorage.setItem('active_key', this.data[0].timeStamp);
    },
    onerror: function(e) {

    }
  };
  // Query the database
  cqHelperDB.query(importOpts);
};


/**
 * Check for an active key in localStorage
 * If there is an active key, copy the settings to localStorage
 * If not, copy the settings of the first environment to localStorage
 */
cqHelper.common.copyActiveEnvironment = function() {
  var activeKeyString = localStorage.getItem('active_key');
  var activeKey = Number(activeKeyString);
  if (activeKey) {
    // There is an active key
    // Copy the settings to localStorage
    cqHelperDB.query({
      key: activeKey,
      onerror: function(e) {
        console.error('IndexedJS:', e.target.errorCode);
      },
      onsuccess: function(e) {
        // Double-check `this` refers to the environment, not window
        if (this.timeStamp) {
          // Copy the active environment to localStorage
          cqHelper.common.copyToLocalStorage(this);
        }
      }
    });
  } else {
    // No active key found
    // Copy the settings of the first object in the object store to localStorage
    cqHelper.common.setActiveKeyAndCopyToLocalStorage();
  }
};


/**
* Get the stored state of the new tab checkbox
*
* @method newTabOptionChecked
* @return {Boolean}
*/
cqHelper.common.newTabOptionChecked = function() {
  var checked = localStorage.getItem('new_tab_option_state');
  if (!checked) { return true; }
  if (typeof(checked) === "string") {
    // Convert stored string to boolean equivalent
    checked = JSON.parse(checked);
  }
  return checked;
};


/*
 * Backward compatibility for Chrome 25-
*/
if (!chrome.runtime) {
    // Chrome 20-21
    chrome.runtime = chrome.extension;
} else if(!chrome.runtime.onMessage) {
    // Chrome 22-25
    chrome.runtime.onMessage = chrome.extension.onMessage;
    chrome.runtime.sendMessage = chrome.extension.sendMessage;
    chrome.runtime.onConnect = chrome.extension.onConnect;
    chrome.runtime.connect = chrome.extension.connect;
}
