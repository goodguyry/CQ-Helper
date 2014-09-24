/**
 * Each context menu item is assigned an ID
 * We parse the ID to get the requested action
 * A new instance of ActionPrep is created based on the passed values
 *
 * @method go Called to do the actual work
 * @method copy For copying the URLs
 * @param {Object} info Information about the menu item clicked
 * @param {Object} tab Information about the page
 */
chrome.contextMenus.onClicked.addListener( function(info, tab) {
  // Trim the action off the menuItemId
  var fullId = info.menuItemId;
  var action = fullId.split('_')[0];

  // Open the content Finder in the same tab on CMS pages
  var newTabOverride = false;
  if (fullId === 'cf_cms-page') {
    newTabOverride = true;
  }

  if (action === 'search') {
    // Search for the selected text
    var selectedText = info.selectionText;
    cqHelper.processQueryString(selectedText, tab.index);
  } else {
    // Set the URL to be passed to ActionPrep
    var url;
    if (action === 'dam') {
      // This is an asset
      // The URL comes from info
      url = info.srcUrl;
    } else {
      // This is a link or page
      // The URL either comes from info or tab, respectively
      url = info.linkUrl || tab.url;
    }

    cqHelper.make = new ActionPrep(action, url, tab.index);

    if (fullId.substring(fullId.length -4, fullId.length) === 'copy') {
      // This is one of the copy menu items
      cqHelper.make.copyUrl();
    } else {
      cqHelper.make.go(newTabOverride);
    }
  }
});


// Open the settings page on install
chrome.runtime.onInstalled.addListener(function(details) {

  if (details.reason == 'install') {
    chrome.tabs.create({url: '../settings.html'});
  }

});


// Context menu setup
function createContextMenus() {

  // Live and cms pages which activate the contextual menus
  var livePages = '*://' + localStorage.getItem('live_url') + '/*';
  var cmsPages = '*://' + localStorage.getItem('cms_url') + localStorage.getItem('content_path') + '*';
  var assets = '*://*' + localStorage.getItem('dam_path') + '*';

  var linkPattern = [];

  // External links
  // First test whether an external link is set
  if (localStorage.getItem('external_url') !== '') {
    var external = '*://' + localStorage.getItem('external_url') + '/*';
    // Some menu items can be active on live & cms pages
    // Others should be either/or
    // Any menu items active on live links can also be active on external links
    liveLinkPattern = [livePages, external];
    allLinkPattern = [livePages, cmsPages, external];
  } else {
    liveLinkPattern = [livePages];
    allLinkPattern = [livePages, cmsPages];
  }

  // Images

  // Live pages, CMS pages, live assets, CMS assets: Open DAM directory
  chrome.contextMenus.create({
    'title': 'Open asset\'s DAM directory',
    'documentUrlPatterns': [livePages, cmsPages, assets],
    'contexts': ['image'],
    'id': 'dam_open-dir'
  });

  // Links

  // Links on live pages: Edit
  chrome.contextMenus.create({
    'title': 'Edit linked page',
    'documentUrlPatterns': liveLinkPattern,
    'contexts': ['link'],
    'id': 'view-edit-copy_live-link'
  });
  // Links on CMS pages (in preview mode): View
  chrome.contextMenus.create({
    'title': 'View this link\'s live page',
    'documentUrlPatterns': [cmsPages],
    'contexts': ['link'],
    'id': 'view-edit-copy_cms-link'
  });
  // Links on live pages: Edit with Content Finder
  chrome.contextMenus.create({
    'title': 'Edit linked page with Content Finder open',
    'documentUrlPatterns': liveLinkPattern,
    'contexts': ['link'],
    'id': 'cf_live-link'
  });
  // Links on live pages: Open parent directory
  chrome.contextMenus.create({
    'title': 'Open linked page\'s parent directory',
    'documentUrlPatterns': liveLinkPattern,
    'contexts': ['link'],
    'id': 'parent_live-link'
  });
  // Links on live pages: View sub-pages
  chrome.contextMenus.create({
    'title': 'View linked page\'s sub-pages',
    'documentUrlPatterns': liveLinkPattern,
    'contexts': ['link'],
    'id': 'sub_live-link'
  });
  // Links on live and CMS pages: Separator
  chrome.contextMenus.create ({
    'type': 'separator',
    'documentUrlPatterns': allLinkPattern,
    'contexts': ['link'],
    'id': 'separator00'
  });
  // Links on live pages: Copy
  chrome.contextMenus.create({
    'title': 'Copy URL to CMS page',
    'documentUrlPatterns': liveLinkPattern,
    'contexts': ['link'],
    'id': 'view-edit-copy_live-link-copy'
  });
  // Links on CMS pages: Copy
  chrome.contextMenus.create({
    'title': 'Copy URL to live page',
    'documentUrlPatterns': [cmsPages],
    'contexts': ['link'],
    'id': 'view-edit-copy_cms-link-copy'
  });
  // Links on live and CMS pages: Separator
  chrome.contextMenus.create ({
    'type': 'separator',
    'documentUrlPatterns': allLinkPattern,
    'contexts': ['link'],
    'id': 'separator01'
  });
  // Links on live and CMS pages: CRX
  chrome.contextMenus.create({
    'title': 'Explore linked page in CRXDE Lite',
    'documentUrlPatterns': allLinkPattern,
    'contexts': ['link'],
    'id': 'crx_link'
  });

  // Page

  // Live pages: Edit
  chrome.contextMenus.create({
    'title': 'Edit this page',
    'documentUrlPatterns': [livePages],
    'contexts': ['page'],
    'id': 'view-edit-copy_page-edit'
  });
  // CMS pages: View
  chrome.contextMenus.create({
    'title': 'View live page',
    'documentUrlPatterns': [cmsPages],
    'contexts': ['page'],
    'id': 'view-edit-copy_page-view'
  });
  // Live pages: Edit with Content Finder
  chrome.contextMenus.create({
    'title': 'Edit this page with Content Finder open',
    'documentUrlPatterns': [livePages],
    'contexts': ['page'],
    'id': 'cf_live-page'
  });
  // CMS pages: Open/Close Content Finder
  chrome.contextMenus.create({
    'title': 'Open/Close Content Finder',
    'documentUrlPatterns': [cmsPages],
    'contexts': ['page'],
    'id': 'cf_cms-page'
  });
  // Live and CMS pages: Open parent directory
  chrome.contextMenus.create({
    'title': 'Open parent directory',
    'documentUrlPatterns': [livePages, cmsPages],
    'contexts': ['page'],
    'id': 'parent_page'
  });
  // Live and CMS pages: View sub-pages
  chrome.contextMenus.create({
    'title': 'Show sub-pages',
    'documentUrlPatterns': [livePages, cmsPages],
    'contexts': ['page'],
    'id': 'sub_page'
  });
  // Live and CMS pages: Separator
  chrome.contextMenus.create ({
    'type': 'separator',
    'documentUrlPatterns': [livePages, cmsPages],
    'contexts': ['page'],
    'id': 'separator04'
  });
  // Live pages: Copy
  chrome.contextMenus.create({
    'title': 'Copy URL to CMS page',
    'documentUrlPatterns': [livePages],
    'contexts': ['page'],
    'id': 'view-edit-copy_live-page-copy'
  });
  // CMS pages: Copy
  chrome.contextMenus.create({
    'title': 'Copy URL to live page',
    'documentUrlPatterns': [cmsPages],
    'contexts': ['page'],
    'id': 'view-edit-copy_cms-page-copy'
  });
  // Live and CMS pages: Separator
  chrome.contextMenus.create ({
    'type': 'separator',
    'documentUrlPatterns': [livePages, cmsPages],
    'contexts': ['page'],
    'id': 'separator05'
  });
  // Live and CMS pages: CRX
  chrome.contextMenus.create({
    'title': 'Explore this page in CRXDE Lite',
    'documentUrlPatterns': [livePages, cmsPages],
    'contexts': ['page'],
    'id': 'crx_page'
  });

  // Search
  // "%s" holds and presents the selection
  chrome.contextMenus.create ({
    'title': 'Search ' + localStorage.getItem('live_url') + ' for "%s"',
    'contexts': ['selection'],
    'id': 'search_selection'
  });
}
