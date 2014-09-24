CQ Helper
========
A Chrome extension for productive use of the Adobe® CQ CMS, [available in the Chrome Web Store](https://chrome.google.com/webstore/detail/cq-helper/naemekoogddiemkfhjjhaidalehodjcp).

Add all your organization's CMS environments and easily switch between them; right-click pages, images and links to interact with the CMS; search your sites from the browser pop-up or the contextual menu.

- [Features](#features)
- [Installation](#installation)

## Features

- Supports multiple CMS environments
    - Add as many environments as you need
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

---

Adobe is a registered trademark of Adobe Systems Incorporated in the United States and/or other countries. This software is not affiliated with, nor endorsed by, Adobe Systems Incorporated in any way.