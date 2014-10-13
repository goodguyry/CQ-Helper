CQ Helper
========
A Chrome extension for productive use of the Adobe® CQ CMS, [available in the Chrome Web Store](https://chrome.google.com/webstore/detail/cq-helper/naemekoogddiemkfhjjhaidalehodjcp).

Add all your organization's CMS environments and easily switch between them; right-click pages, images and links to interact with the CMS; search your sites from the browser pop-up or the contextual menu.

- [Features](#features)
- [Installation](#installation)
- [Import Environment Settings](#import-environment-settings)

## Features

- Supports multiple CMS environments
    - Add as many environments as you need
    - Import settings from a JSON file for easy team deployment
    - Easily switch environments via the extension's browser pop-up
- Pages & Links
    - Switch between environments
    - Open and close the Content Finder, even from a live page
    - Open a page's/link's directory (view its sub-pages)
    - Open a page's/link's parent directory
    - Open the current/linked page in CRXDE Lite
    - Copy the URL to the current/linked page in the other environment
- Images:
    - Open an asset's DAM directory
- Search your domain, either from the browser pop-up or by selecting text and right-clicking
- Add an external site from which to open links in the CMS
- Includes helpful links to the Welcome page, CRXDE Lite, Bulk Editor and Activate Tree in the extension's browser pop-up

## Installation

### From the Chrome Web Store

[Download CQ Helper from the Chrome Web Store](https://chrome.google.com/webstore/detail/cq-helper/naemekoogddiemkfhjjhaidalehodjcp)

### Using Git & Grunt

I recommend you have Grunt installed to automate building this extension. If you're not familiar with Grunt, [you can learn more here](http://gruntjs.com/getting-started).

**Clone the repository:**

```command-line
git clone git://github.com/goodguyry/CQ-Helper.git
```

**Install the necessary Grunt packages:**

```command-line
npm install --save-dev
```

**Build the extension:**

```command-line
grunt deploy
```

Now you're ready to [manually install](http://developer.chrome.com/extensions/packaging.html) CQ Helper. Be sure to choose the ```/build``` directory when asked to specify the _"Extension root directory"_.

## Import Environment Settings

If you'd like to deploy for team use, I would recommend creating a JSON file &ndash; to hold values for the settings page's form fields &ndash; to be imported by team members. This is especially helpful if your organization has more than one instance of CQ.

Of course, importing your settings is helpful even if you only have one instance of CQ.

**Note:** The imported settings will replace all current settings.

```javascript
// from environments.json
{
  "Production" : {
    "live_url" : "www.production.com",
    "cms_url" : "cq.production.com",
    "content_path" : "/content/production/en",
    "dam_path" : "/content/dam/production",
    "search_path" : "/search.html?q=",
    "external_url" : "jira.production.com"
  },
  "QA Server" : {
    "live_url" : "www.example.com",
    "cms_url" : "cq.example.com",
    "content_path" : "/content/example/en",
    "dam_path" : "/content/dam/example",
    "search_path" : "/search.html?q=",
    "external_url" : "jira.example.com"
  }
}
```

Each site can be named anything you'd like (e.g, "Production"), however, environment property names must be respected and the file must be [valid JSON](http://jsonlint.com).

---

Adobe is a registered trademark of Adobe Systems Incorporated in the United States and/or other countries. This software is not affiliated with, nor endorsed by, Adobe Systems Incorporated in any way.