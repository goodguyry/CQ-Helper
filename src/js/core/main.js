/*
 * Receive the search text from popup.js
 * See http://developer.chrome.com/extensions/messaging.html
 */
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {

  // Sent from popup.js
  if (request.method === 'sendSearchText') {
    // Get the current tab's index and send the search text along to the search handler
    chrome.tabs.query({currentWindow: true, active: true}, function (tabs) {
      cqHelper.processQueryString(request.scriptMessage, tabs[0].index);
    });
    if (request.scriptMessage !== '') {
      sendResponse({scriptResponse: 'search value received.'});
    }
  }

});


/**
* Set the options for opening the database
*/
var init = {
  cursor: {
    // Cursor through all objects
    bound: false
  },
  keys: [],
  onsuccess: function(e) {
    // Create arrays of the timeStamp and title values
    // These will be iterated over to create the list of environments
    init.keys.push(this.timeStamp);
  },
  oncomplete: function(e) {
    if (this.keys.length > 0) {
      // Get the active environment
      cqHelper.common.copyActiveEnvironment();
      // Create context menus
      createContextMenus();
    } else {
      // There are no saved environments
      // Open the settings page
      chrome.tabs.create({url: '../settings.html'});
      return;
    }
  }
};


/**
* This is basically Command Central
* Called from contextMenuClickHandler in src/js/core/context-menus.js
*
* @object ActionPrep
* @param {String} action The action being requested
* @param {String} url The current tab's URL
* @param {String} index The current tab's index
*/
function ActionPrep(action, url, index) {
  // Get newTabOption's current setting
  // We want it hot off the press because it can change easily
  this.newTab = cqHelper.common.newTabOptionChecked();
  // The page's tab index
  // For adding a new adjacent tab
  this.tabIndex = index;
  // Get the page's pathname from the full URL
  this.path = function(url) {
    return url.replace(/^.*\/\/[^\/]+/, '');
  };
  // Construct the new URL
  this.newUrl = function() {
    return 'http://' + cqHelper.actionHandler(action, this.path(url));
  };
  // Put everything into action
  this.go = function(newTabOverride) {
    if (typeof newTabOverride === 'undefined') {
      newTabOverride = false;
    }
    // Open the new URL
    cqHelper.manipulateTab(this.newUrl(), this.tabIndex, newTabOverride);
  };
  // Copy the opposite environment's URL to the clipboard
  this.copyUrl = function(text) {
    var toCopy = this.newUrl();
    cqHelper.copyToClipboard(toCopy);
  };
}


/**
 * Manage tab behavior: if set to open new tabs, do so
 * Called from ActionPrep.go in src/js/core/context-menus.js
 *
 * @oaram {String} url The new, target URL
 * @param {String} index The current tab's index
 * @param {Boolean} newTabOverride To override the newTabOption value
 */
cqHelper.manipulateTab = function(url, index, newTabOverride) {
  var newTabOptionChecked = cqHelper.common.newTabOptionChecked();
  if (newTabOptionChecked && !newTabOverride) {
    // Open the url in a new tab
    chrome.tabs.create({'url': url, 'index': index + 1});
  } else {
    // Open the url in the current tab
    chrome.tabs.update({'url': url});
  }
};


/**
 * Process the search query
 *
 * @oaram {String} terms The string to be searched
 * @param {String} index The current tab's index
 */
cqHelper.processQueryString = function(terms, index) {
  var queryString = terms.split(' ').join('+');
  var searchUrl = localStorage.getItem('search_path');
  var searchQuery = '';
  // Build the search URL
  if (cqHelper.testPath.isFoundIn(searchUrl, 'google.com/search')) {
    // Search is set to Google site-specific search
    searchQuery = searchUrl + queryString;
  } else {
    // Local search path is set
    searchQuery = 'http://' + localStorage.getItem('live_url') + searchUrl + queryString;
  }
  // Create a new tab or use the current one
  cqHelper.manipulateTab(searchQuery, index);
};


 /**
 * Function to copy passed string to the clipboard
 * Called from ActionPrep.copyUrl in src/js/core/main.js
 *
 * @param {String} text The text to be copied
 */
cqHelper.copyToClipboard = function(text) {
  var copyDiv = document.createElement('div');
  copyDiv.contentEditable = true;
  document.body.appendChild(copyDiv);
  copyDiv.innerHTML = text;
  copyDiv.unselectable = 'off';
  copyDiv.focus();
  document.execCommand('SelectAll');
  document.execCommand('Copy', false, null);
  document.body.removeChild(copyDiv);
};


cqHelper.testPath = {

  // String.search() shortcut
  isFoundIn: function(string, query) {
    if (string.search(query) > -1) {
      return true;
    } else {
      return false;
    }
  },

  // Test whether or not the path the homepage in either environment
  isHomePage : function(path) {
    if (path === '/' ||
        path === localStorage.getItem('content_path') + '.html' ||
        path === '/cf#' + localStorage.getItem('content_path') + '.html') {
      return true;
    } else {
      return false;
    }
  },

  // Test for whether a URL is for a CMS page
  isCmsUrl : function(path) {
    if (this.isFoundIn(path, localStorage.getItem('content_path'))) {
      return true;
    } else {
      return false;
    }
  },

  // Test for whether a URL is for a DAM asset
  isDamUrl : function(path) {
    if (this.isFoundIn(path, localStorage.getItem('dam_path'))) {
      return true;
    } else {
      return false;
    }
  },

  // Test whether or not Content Finder is open
  contentFinderIsOpen : function(path) {
    if (this.isFoundIn(path, 'cf#')) {
      return true;
    } else {
      return false;
    }
  }

};


// Strip the file name and last slash from the path
// stripFileName('/path/to/page.html') > '/path/to'
String.prototype.stripFileName = function() {
  return this.substring(0, this.lastIndexOf('/'));
};


// Strip the .html off of the page's file name
// stripHtmlExtention('path/to/page.html') > '/path/to/page'
String.prototype.stripHtmlExtention = function() {
  return this.substring(0, this.length - 5);
};


/**
 * This is where we piece together the new URL, depending on the action requested
 * Called from ActionPrep.newUrl in src/js/core/main.js
 *
 * @param {String} action The action being requested
 * @oaram {String} path The cleaned up pathname based on the current URL
 */
cqHelper.actionHandler = function(action, path) {
  // Shortcut cqHelper.testPath
  var test = cqHelper.testPath;

  // This clears the CMS query string from the end of the URL
  path = path.split(/\?|&/)[0];
  var hash = '';

  var hashIndex = path.lastIndexOf('#');
  if(hashIndex > 3){
    hash = path.substring(hashIndex, path.length);
    path = path.substring(0, hashIndex);
  }

  var newPath = '';

  // Go ahead and start over if this is a link to a DAM asset
  // This allows us to open the DAM directory for assets links
  if (test.isDamUrl(path) && action !== 'dam') {
    action = 'dam';
  }

  // If Content Finder is open, close it
  // If Content Finder is closed, open it
  var openAndCloseContentFinder = function(p) {
    if (test.contentFinderIsOpen(p)) {
      // Close Content Finder
      path = p.substr(4, p.length);
    } else {
      // Open Content Finder
      path = '/cf#' + p;
    }
    return path;
  };

  switch (action) {

    // View/edit the current or linked page
    case 'view-edit-copy':

      if (test.isCmsUrl(path)) {
        // This is a CMS page

        if (test.isHomePage(path)) {
          // This is the home page
          // remove '.html'
          path = path.stripHtmlExtention();
        } else {
          // make sure it ends in '.html'
          if (path.substring(path.length - 5, path.length) !== '.html') {
            path = path + '.html';
          }
        }

        if (test.contentFinderIsOpen(path)) {
          // Content Finder is open
          // Close Content Finder
          openAndCloseContentFinder(path);
        }

        // Trim off the contentPath
        var contentPath = localStorage.getItem('content_path');
        path = path.substr(contentPath.length, path.length);

        // Build the new path
        newPath = localStorage.getItem('live_url') + path;

      } else {
        // This is a live page

        if (test.isHomePage(path)) {
          // This is the home page
          // Set path to  '.html'
          path = '.html';
        } else {
          // Make sure it ends in '.html'
          if (path.substring(path.length - 5, path.length) !== '.html') {
            path = path + '.html';
          }
        }

        // Add the content path
        path = localStorage.getItem('content_path') + path;

        // Build the new path
        newPath = localStorage.getItem('cms_url') + path;

      }

      return newPath + hash;

    // Open the page's parent directory in siteadmin
    case 'parent':

      if (test.isCmsUrl(path)) {
        // This is a CMS page

        if (test.contentFinderIsOpen(path)) {
          // Content Finder is open
          // Close Content Finder
          openAndCloseContentFinder(path);
        }

      } else {
        // This is a live page

        if (test.isHomePage(path)) {
          // This is the home page
          // Clear path
          path = '';
        }

        // Add the content path
        path = localStorage.getItem('content_path') + path;

      }

      // Build new path
      newPath = localStorage.getItem('cms_url') + localStorage.getItem('site_admin') + path;

      // Remove the filename from path
      newParentPath = newPath.stripFileName();

      return newParentPath;

    // Open the page's directory in siteadmin
    // Essentially listing it's sub-pages
    case 'sub':

      if (test.isCmsUrl(path)) {
        // This is a CMS page

        if (test.contentFinderIsOpen(path)) {
          // Content Finder is open
          // Close Content Finder
          openAndCloseContentFinder(path);
        }

      } else {
        // This is a live page

        if (test.isHomePage(path)) {
          // This is the home page
          // Clear path
          path = '';
        }

        // Add the content path
        path = localStorage.getItem('content_path') + path;

      }

      // Build the new path
      newPath = localStorage.getItem('cms_url') + localStorage.getItem('site_admin') + path;

      // If present, remove the '.html' extension
      if (newPath.substring(newPath.length - 5, newPath.length) === '.html') {
        newPath = newPath.stripHtmlExtention();
      }

      return newPath;

    // Open or close Content Finder
    case 'cf':

      if (test.isCmsUrl(path)) {
        // This is a CMS page

        // Make sure it ends in '.html'
        // This is an edge case, but whatever
        if (path.substring(path.length - 5, path.length) !== '.html') {
          path = path + '.html';
        }

      } else {
        // This is a live page

        if (test.isHomePage(path)) {
          // This is the home page
          // Set path to '.html'
          path = '.html';
        }

        // Make sure it ends in '.html'
        if (path.substring(path.length - 5, path.length) !== '.html') {
          path = path + '.html';
        }

        // Add the content path
        path = localStorage.getItem('content_path') + path;

      }

      // Open or close the content finder
      openAndCloseContentFinder(path);

      // Build the new path
      newPath = localStorage.getItem('cms_url') + path;

      return newPath + hash;

    // Open a DAM asset's directory
    case 'dam':

      // Remove the filename from path
      path = path.stripFileName();

      // Build the new path
      newPath = localStorage.getItem('cms_url') + localStorage.getItem('dam_admin') + path;

      return newPath;

    // Open the current or linked page in the CRX
    case 'crx':

      if (test.isCmsUrl(path)) {
        // This is a CMS page

        if (test.contentFinderIsOpen(path)) {
          // Content Finder is open
          // Close Content Finder
          openAndCloseContentFinder(path);
        }

      } else {
        // This is a live page

        if (test.isHomePage(path)) {
          // This is the home page
          // Clear path
          path = '';
        }

        // Add the content path
        path = localStorage.getItem('content_path') + path;

      }

      // If present, and not the home page, remove the '.html' extension
      if (path.substring(path.length - 5, path.length) === '.html') {
        path = path.stripHtmlExtention();
      }

      newPath = localStorage.getItem('cms_url') + '/crx/de/index.jsp#' + path + '/jcr%3Acontent';

      return newPath;

    // This should never run
    default:
      alert('CQ Helper says: Something broke...');
      return;
  }
};
