'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AuthView = require('./AuthView');
var Browser = require('./Browser');
var LoaderView = require('./Loader');
var Utils = require('../core/Utils');

/**
 * Class to easily generate generic views for plugins
 *
 * This class expects the plugin using to have the following attributes
 *
 * stateId {String} object key of which the plugin state is stored
 *
 * This class also expects the plugin instance using it to have the following
 * accessor methods.
 * Each method takes the item whose property is to be accessed
 * as a param
 *
 * isFolder
 *    @return {Boolean} for if the item is a folder or not
 * getItemData
 *    @return {Object} that is format ready for uppy upload/download
 * getItemIcon
 *    @return {Object} html instance of the item's icon
 * getItemSubList
 *    @return {Array} sub-items in the item. e.g a folder may contain sub-items
 * getItemName
 *    @return {String} display friendly name of the item
 * getMimeType
 *    @return {String} mime type of the item
 * getItemId
 *    @return {String} unique id of the item
 * getItemRequestPath
 *    @return {String} unique request path of the item when making calls to uppy server
 * getItemModifiedDate
 *    @return {object} or {String} date of when last the item was modified
 * getItemThumbnailUrl
 *    @return {String}
 */
module.exports = function () {
  /**
   * @param {object} instance of the plugin
   */
  function View(plugin, opts) {
    _classCallCheck(this, View);

    this.plugin = plugin;
    this.Provider = plugin[plugin.id];

    // set default options
    var defaultOptions = {
      viewType: 'list'

      // merge default options with the ones set by user
    };this.opts = _extends({}, defaultOptions, opts);

    // Logic
    this.addFile = this.addFile.bind(this);
    this.filterItems = this.filterItems.bind(this);
    this.filterQuery = this.filterQuery.bind(this);
    this.toggleSearch = this.toggleSearch.bind(this);
    this.getFolder = this.getFolder.bind(this);
    this.getNextFolder = this.getNextFolder.bind(this);
    this.logout = this.logout.bind(this);
    this.checkAuth = this.checkAuth.bind(this);
    this.handleAuth = this.handleAuth.bind(this);
    this.handleDemoAuth = this.handleDemoAuth.bind(this);
    this.sortByTitle = this.sortByTitle.bind(this);
    this.sortByDate = this.sortByDate.bind(this);
    this.isActiveRow = this.isActiveRow.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleScroll = this.handleScroll.bind(this);

    // Visual
    this.render = this.render.bind(this);
  }

  /**
   * Little shorthand to update the state with the plugin's state
   */


  View.prototype.updateState = function updateState(newState) {
    var _plugin$core$setState;

    var stateId = this.plugin.stateId;
    var state = this.plugin.core.state;


    this.plugin.core.setState((_plugin$core$setState = {}, _plugin$core$setState[stateId] = _extends({}, state[stateId], newState), _plugin$core$setState));
  };

  View.prototype._updateFilesAndFolders = function _updateFilesAndFolders(res, files, folders) {
    var _this = this;

    this.plugin.getItemSubList(res).forEach(function (item) {
      if (_this.plugin.isFolder(item)) {
        folders.push(item);
      } else {
        files.push(item);
      }
    });

    this.updateState({ folders: folders, files: files });
  };

  View.prototype.checkAuth = function checkAuth() {
    var _this2 = this;

    this.updateState({ checkAuthInProgress: true });
    this.Provider.checkAuth().then(function (authenticated) {
      _this2.updateState({ checkAuthInProgress: false });
      _this2.plugin.onAuth(authenticated);
    }).catch(function (err) {
      _this2.updateState({ checkAuthInProgress: false });
      _this2.handleError(err);
    });
  };

  /**
   * Based on folder ID, fetch a new folder and update it to state
   * @param  {String} id Folder id
   * @return {Promise}   Folders/files in folder
   */


  View.prototype.getFolder = function getFolder(id, name) {
    var _this3 = this;

    return this._loaderWrapper(this.Provider.list(id), function (res) {
      var folders = [];
      var files = [];
      var updatedDirectories = void 0;

      var state = _this3.plugin.core.getState()[_this3.plugin.stateId];
      var index = state.directories.findIndex(function (dir) {
        return id === dir.id;
      });

      if (index !== -1) {
        updatedDirectories = state.directories.slice(0, index + 1);
      } else {
        updatedDirectories = state.directories.concat([{ id: id, title: name || _this3.plugin.getItemName(res) }]);
      }

      _this3._updateFilesAndFolders(res, files, folders);
      _this3.updateState({ directories: updatedDirectories });
    }, this.handleError);
  };

  /**
   * Fetches new folder
   * @param  {Object} Folder
   * @param  {String} title Folder title
   */


  View.prototype.getNextFolder = function getNextFolder(folder) {
    var id = this.plugin.getItemRequestPath(folder);
    this.getFolder(id, this.plugin.getItemName(folder));
  };

  View.prototype.addFile = function addFile(file) {
    var _this4 = this;

    var tagFile = {
      source: this.plugin.id,
      data: this.plugin.getItemData(file),
      name: this.plugin.getItemName(file) || this.plugin.getItemId(file),
      type: this.plugin.getMimeType(file),
      isRemote: true,
      body: {
        fileId: this.plugin.getItemId(file)
      },
      remote: {
        host: this.plugin.opts.host,
        url: '' + this.Provider.fileUrl(this.plugin.getItemRequestPath(file)),
        body: {
          fileId: this.plugin.getItemId(file)
        }
      }
    };

    Utils.getFileType(tagFile).then(function (fileType) {
      if (Utils.isPreviewSupported(fileType[1])) {
        tagFile.preview = _this4.plugin.getItemThumbnailUrl(file);
      }
      _this4.plugin.core.log('Adding remote file');
      _this4.plugin.core.addFile(tagFile);
    });
  };

  /**
   * Removes session token on client side.
   */


  View.prototype.logout = function logout() {
    var _this5 = this;

    this.Provider.logout(location.href).then(function (res) {
      return res.json();
    }).then(function (res) {
      if (res.ok) {
        var newState = {
          authenticated: false,
          files: [],
          folders: [],
          directories: []
        };
        _this5.updateState(newState);
      }
    }).catch(this.handleError);
  };

  View.prototype.filterQuery = function filterQuery(e) {
    var state = this.plugin.core.getState()[this.plugin.stateId];
    this.updateState(_extends({}, state, {
      filterInput: e.target.value
    }));
  };

  View.prototype.toggleSearch = function toggleSearch() {
    var state = this.plugin.core.getState()[this.plugin.stateId];
    var searchInputEl = document.querySelector('.Browser-searchInput');

    this.updateState(_extends({}, state, {
      isSearchVisible: !state.isSearchVisible,
      filterInput: ''
    }));

    searchInputEl.value = '';
    if (!state.isSearchVisible) {
      searchInputEl.focus();
    }
  };

  View.prototype.filterItems = function filterItems(items) {
    var _this6 = this;

    var state = this.plugin.core.getState()[this.plugin.stateId];
    return items.filter(function (folder) {
      return _this6.plugin.getItemName(folder).toLowerCase().indexOf(state.filterInput.toLowerCase()) !== -1;
    });
  };

  View.prototype.sortByTitle = function sortByTitle() {
    var _this7 = this;

    var state = _extends({}, this.plugin.core.getState()[this.plugin.stateId]);
    var files = state.files,
        folders = state.folders,
        sorting = state.sorting;


    var sortedFiles = files.sort(function (fileA, fileB) {
      if (sorting === 'titleDescending') {
        return _this7.plugin.getItemName(fileB).localeCompare(_this7.plugin.getItemName(fileA));
      }
      return _this7.plugin.getItemName(fileA).localeCompare(_this7.plugin.getItemName(fileB));
    });

    var sortedFolders = folders.sort(function (folderA, folderB) {
      if (sorting === 'titleDescending') {
        return _this7.plugin.getItemName(folderB).localeCompare(_this7.plugin.getItemName(folderA));
      }
      return _this7.plugin.getItemName(folderA).localeCompare(_this7.plugin.getItemName(folderB));
    });

    this.updateState(_extends({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: sorting === 'titleDescending' ? 'titleAscending' : 'titleDescending'
    }));
  };

  View.prototype.sortByDate = function sortByDate() {
    var _this8 = this;

    var state = _extends({}, this.plugin.core.getState()[this.plugin.stateId]);
    var files = state.files,
        folders = state.folders,
        sorting = state.sorting;


    var sortedFiles = files.sort(function (fileA, fileB) {
      var a = new Date(_this8.plugin.getItemModifiedDate(fileA));
      var b = new Date(_this8.plugin.getItemModifiedDate(fileB));

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0;
      }
      return a > b ? 1 : a < b ? -1 : 0;
    });

    var sortedFolders = folders.sort(function (folderA, folderB) {
      var a = new Date(_this8.plugin.getItemModifiedDate(folderA));
      var b = new Date(_this8.plugin.getItemModifiedDate(folderB));

      if (sorting === 'dateDescending') {
        return a > b ? -1 : a < b ? 1 : 0;
      }

      return a > b ? 1 : a < b ? -1 : 0;
    });

    this.updateState(_extends({}, state, {
      files: sortedFiles,
      folders: sortedFolders,
      sorting: sorting === 'dateDescending' ? 'dateAscending' : 'dateDescending'
    }));
  };

  View.prototype.sortBySize = function sortBySize() {
    var _this9 = this;

    var state = _extends({}, this.plugin.core.getState()[this.plugin.stateId]);
    var files = state.files,
        sorting = state.sorting;

    // check that plugin supports file sizes

    if (!files.length || !this.plugin.getItemData(files[0]).size) {
      return;
    }

    var sortedFiles = files.sort(function (fileA, fileB) {
      var a = _this9.plugin.getItemData(fileA).size;
      var b = _this9.plugin.getItemData(fileB).size;

      if (sorting === 'sizeDescending') {
        return a > b ? -1 : a < b ? 1 : 0;
      }
      return a > b ? 1 : a < b ? -1 : 0;
    });

    this.updateState(_extends({}, state, {
      files: sortedFiles,
      sorting: sorting === 'sizeDescending' ? 'sizeAscending' : 'sizeDescending'
    }));
  };

  View.prototype.isActiveRow = function isActiveRow(file) {
    return this.plugin.core.getState()[this.plugin.stateId].activeRow === this.plugin.getItemId(file);
  };

  View.prototype.handleDemoAuth = function handleDemoAuth() {
    var state = this.plugin.core.getState()[this.plugin.stateId];
    this.updateState({}, state, {
      authenticated: true
    });
  };

  View.prototype.handleAuth = function handleAuth() {
    var _this10 = this;

    var urlId = Math.floor(Math.random() * 999999) + 1;
    var redirect = '' + location.href + (location.search ? '&' : '?') + 'id=' + urlId;

    var authState = btoa(JSON.stringify({ redirect: redirect }));
    var link = this.Provider.authUrl() + '?state=' + authState;

    var authWindow = window.open(link, '_blank');
    var checkAuth = function checkAuth() {
      var authWindowUrl = void 0;

      try {
        authWindowUrl = authWindow.location.href;
      } catch (e) {
        if (e instanceof DOMException || e instanceof TypeError) {
          return setTimeout(checkAuth, 100);
        } else throw e;
      }

      // split url because chrome adds '#' to redirects
      if (authWindowUrl && authWindowUrl.split('#')[0] === redirect) {
        authWindow.close();
        _this10._loaderWrapper(_this10.Provider.checkAuth(), _this10.plugin.onAuth, _this10.handleError);
      } else {
        setTimeout(checkAuth, 100);
      }
    };

    checkAuth();
  };

  View.prototype.handleError = function handleError(error) {
    var core = this.plugin.core;
    var message = core.i18n('uppyServerError');
    core.log(error.toString());
    core.info({ message: message, details: error.toString() }, 'error', 5000);
  };

  View.prototype.handleScroll = function handleScroll(e) {
    var _this11 = this;

    var scrollPos = e.target.scrollHeight - (e.target.scrollTop + e.target.offsetHeight);
    var path = this.plugin.getNextPagePath ? this.plugin.getNextPagePath() : null;

    if (scrollPos < 50 && path && !this._isHandlingScroll) {
      this.Provider.list(path).then(function (res) {
        var _plugin$core$getState = _this11.plugin.core.getState()[_this11.plugin.stateId],
            files = _plugin$core$getState.files,
            folders = _plugin$core$getState.folders;

        _this11._updateFilesAndFolders(res, files, folders);
      }).catch(this.handleError).then(function () {
        _this11._isHandlingScroll = false;
      }); // always called

      this._isHandlingScroll = true;
    }
  };

  // displays loader view while asynchronous request is being made.


  View.prototype._loaderWrapper = function _loaderWrapper(promise, then, catch_) {
    var _this12 = this;

    promise.then(then).catch(catch_).then(function () {
      return _this12.updateState({ loading: false });
    }); // always called.
    this.updateState({ loading: true });
  };

  View.prototype.render = function render(state) {
    var _state$plugin$stateId = state[this.plugin.stateId],
        authenticated = _state$plugin$stateId.authenticated,
        checkAuthInProgress = _state$plugin$stateId.checkAuthInProgress,
        loading = _state$plugin$stateId.loading;


    if (loading) {
      return LoaderView();
    }

    if (!authenticated) {
      return AuthView({
        pluginName: this.plugin.title,
        demo: this.plugin.opts.demo,
        checkAuth: this.checkAuth,
        handleAuth: this.handleAuth,
        handleDemoAuth: this.handleDemoAuth,
        checkAuthInProgress: checkAuthInProgress
      });
    }

    var browserProps = _extends({}, state[this.plugin.stateId], {
      getNextFolder: this.getNextFolder,
      getFolder: this.getFolder,
      addFile: this.addFile,
      filterItems: this.filterItems,
      filterQuery: this.filterQuery,
      toggleSearch: this.toggleSearch,
      sortByTitle: this.sortByTitle,
      sortByDate: this.sortByDate,
      logout: this.logout,
      demo: this.plugin.opts.demo,
      isActiveRow: this.isActiveRow,
      getItemName: this.plugin.getItemName,
      getItemIcon: this.plugin.getItemIcon,
      handleScroll: this.handleScroll,
      title: this.plugin.title,
      viewType: this.opts.viewType
    });

    return Browser(browserProps);
  };

  return View;
}();
//# sourceMappingURL=index.js.map