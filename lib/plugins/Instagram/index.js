'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _svgNamespace = 'http://www.w3.org/2000/svg',
    _appendChild = require('yo-yoify/lib/appendChild');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Plugin = require('../Plugin');

var Provider = require('../../Provider');

var View = require('../../generic-provider-views');

module.exports = function (_Plugin) {
  _inherits(Instagram, _Plugin);

  function Instagram(core, opts) {
    _classCallCheck(this, Instagram);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, core, opts));

    _this.type = 'acquirer';
    _this.id = 'Instagram';
    _this.title = 'Instagram';
    _this.stateId = 'instagram';
    _this.icon = function () {
      var _path, _path2, _circle, _uppyIcon;

      return _uppyIcon = document.createElementNS(_svgNamespace, 'svg'), _uppyIcon.setAttribute('aria-hidden', 'true'), _uppyIcon.setAttribute('width', '28'), _uppyIcon.setAttribute('height', '28'), _uppyIcon.setAttribute('viewBox', '0 0 512 512'), _uppyIcon.setAttribute('class', 'UppyIcon UppyModalTab-icon'), _appendChild(_uppyIcon, [' ', (_path = document.createElementNS(_svgNamespace, 'path'), _path.setAttribute('d', 'M256,49.471c67.266,0,75.233.257,101.8,1.469,24.562,1.121,37.9,5.224,46.778,8.674a78.052,78.052,0,0,1,28.966,18.845,78.052,78.052,0,0,1,18.845,28.966c3.45,8.877,7.554,22.216,8.674,46.778,1.212,26.565,1.469,34.532,1.469,101.8s-0.257,75.233-1.469,101.8c-1.121,24.562-5.225,37.9-8.674,46.778a83.427,83.427,0,0,1-47.811,47.811c-8.877,3.45-22.216,7.554-46.778,8.674-26.56,1.212-34.527,1.469-101.8,1.469s-75.237-.257-101.8-1.469c-24.562-1.121-37.9-5.225-46.778-8.674a78.051,78.051,0,0,1-28.966-18.845,78.053,78.053,0,0,1-18.845-28.966c-3.45-8.877-7.554-22.216-8.674-46.778-1.212-26.564-1.469-34.532-1.469-101.8s0.257-75.233,1.469-101.8c1.121-24.562,5.224-37.9,8.674-46.778A78.052,78.052,0,0,1,78.458,78.458a78.053,78.053,0,0,1,28.966-18.845c8.877-3.45,22.216-7.554,46.778-8.674,26.565-1.212,34.532-1.469,101.8-1.469m0-45.391c-68.418,0-77,.29-103.866,1.516-26.815,1.224-45.127,5.482-61.151,11.71a123.488,123.488,0,0,0-44.62,29.057A123.488,123.488,0,0,0,17.3,90.982C11.077,107.007,6.819,125.319,5.6,152.134,4.369,179,4.079,187.582,4.079,256S4.369,333,5.6,359.866c1.224,26.815,5.482,45.127,11.71,61.151a123.489,123.489,0,0,0,29.057,44.62,123.486,123.486,0,0,0,44.62,29.057c16.025,6.228,34.337,10.486,61.151,11.71,26.87,1.226,35.449,1.516,103.866,1.516s77-.29,103.866-1.516c26.815-1.224,45.127-5.482,61.151-11.71a128.817,128.817,0,0,0,73.677-73.677c6.228-16.025,10.486-34.337,11.71-61.151,1.226-26.87,1.516-35.449,1.516-103.866s-0.29-77-1.516-103.866c-1.224-26.815-5.482-45.127-11.71-61.151a123.486,123.486,0,0,0-29.057-44.62A123.487,123.487,0,0,0,421.018,17.3C404.993,11.077,386.681,6.819,359.866,5.6,333,4.369,324.418,4.079,256,4.079h0Z'), _path), ' ', (_path2 = document.createElementNS(_svgNamespace, 'path'), _path2.setAttribute('d', 'M256,126.635A129.365,129.365,0,1,0,385.365,256,129.365,129.365,0,0,0,256,126.635Zm0,213.338A83.973,83.973,0,1,1,339.974,256,83.974,83.974,0,0,1,256,339.973Z'), _path2), ' ', (_circle = document.createElementNS(_svgNamespace, 'circle'), _circle.setAttribute('cx', '390.476'), _circle.setAttribute('cy', '121.524'), _circle.setAttribute('r', '30.23'), _circle), ' ']), _uppyIcon;
    };

    // writing out the key explicitly for readability the key used to store
    // the provider instance must be equal to this.id.
    _this.Instagram = new Provider(core, {
      host: _this.opts.host,
      provider: 'instagram',
      authProvider: 'instagram'
    });

    _this.files = [];

    _this.onAuth = _this.onAuth.bind(_this);
    // Visual
    _this.render = _this.render.bind(_this);

    // set default options
    var defaultOptions = {};

    // merge default options with the ones set by user
    _this.opts = _extends({}, defaultOptions, opts);
    return _this;
  }

  Instagram.prototype.install = function install() {
    this.view = new View(this, {
      viewType: 'grid'
    });
    // Set default state for Google Drive
    this.core.setState({
      // writing out the key explicitly for readability the key used to store
      // the plugin state must be equal to this.stateId.
      instagram: {
        authenticated: false,
        files: [],
        folders: [],
        directories: [],
        activeRow: -1,
        filterInput: '',
        isSearchVisible: false
      }
    });

    var target = this.opts.target;
    if (target) {
      this.mount(target, this);
    }
  };

  Instagram.prototype.uninstall = function uninstall() {
    this.unmount();
  };

  Instagram.prototype.onAuth = function onAuth(authenticated) {
    this.view.updateState({ authenticated: authenticated });
    if (authenticated) {
      this.view.getFolder('recent');
    }
  };

  Instagram.prototype.isFolder = function isFolder(item) {
    return false;
  };

  Instagram.prototype.getItemData = function getItemData(item) {
    return item;
  };

  Instagram.prototype.getItemIcon = function getItemIcon(item) {
    var _img;

    return _img = document.createElement('img'), _img.setAttribute('width', '100px'), _img.setAttribute('src', '' + String(item.images.thumbnail.url) + ''), _img;
  };

  Instagram.prototype.getItemSubList = function getItemSubList(item) {
    var subItems = [];
    item.data.forEach(function (subItem) {
      if (subItem.carousel_media) {
        subItem.carousel_media.forEach(function (i, index) {
          var id = subItem.id,
              created_time = subItem.created_time;

          var newSubItem = _extends({}, i, { id: id, created_time: created_time });
          newSubItem.carousel_id = index;
          subItems.push(newSubItem);
        });
      } else {
        subItems.push(subItem);
      }
    });
    return subItems;
  };

  Instagram.prototype.getItemName = function getItemName(item) {
    return '';
  };

  Instagram.prototype.getMimeType = function getMimeType(item) {
    return item.type === 'video' ? 'video/mp4' : 'image/jpeg';
  };

  Instagram.prototype.getItemId = function getItemId(item) {
    return '' + item.id + (item.carousel_id || '');
  };

  Instagram.prototype.getItemRequestPath = function getItemRequestPath(item) {
    var suffix = isNaN(item.carousel_id) ? '' : '?carousel_id=' + item.carousel_id;
    return '' + item.id + suffix;
  };

  Instagram.prototype.getItemModifiedDate = function getItemModifiedDate(item) {
    return item.created_time;
  };

  Instagram.prototype.getItemThumbnailUrl = function getItemThumbnailUrl(item) {
    return item.images.thumbnail.url;
  };

  Instagram.prototype.getNextPagePath = function getNextPagePath() {
    var files = this.core.getState()[this.stateId].files;

    return 'recent?max_id=' + this.getItemId(files[files.length - 1]);
  };

  Instagram.prototype.render = function render(state) {
    return this.view.render(state);
  };

  return Instagram;
}(Plugin);
//# sourceMappingURL=index.js.map