// ═══════════════════════════════════════════════════════════
// TagTag — Google Analytics 4 Tracking Module
// ═══════════════════════════════════════════════════════════

const Analytics = {
  // GA4 Measurement ID (请替换为您的实际 ID)
  GA_ID: 'G-ESFPG8GSYM',
  
  // 是否启用调试模式
  DEBUG: false,
  
  // 初始化状态
  _initialized: false,

  // ═══ Initialization ═══
  
  init() {
    if (this._initialized) return;
    
    // 加载 GA4 脚本
    this._loadScript();
    
    // 初始化 dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    gtag('js', new Date());
    
    // 配置 GA4 (不自动发送 page_view)
    gtag('config', this.GA_ID, {
      send_page_view: false,
      cookie_flags: 'SameSite=None;Secure',
      custom_map: {
        'custom_parameter_1': 'theme',
        'custom_parameter_2': 'tab_style',
        'custom_parameter_3': 'language',
      }
    });
    
    this._initialized = true;
    this._log('Analytics initialized');
  },

  _loadScript() {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.GA_ID}`;
    document.head.appendChild(script);
  },

  // ═══ Core Tracking Methods ═══

  /**
   * 上报自定义事件
   * @param {string} eventName - 事件名称
   * @param {Object} params - 事件参数
   */
  track(eventName, params = {}) {
    if (!this._initialized) this.init();
    
    // 清理参数，移除 undefined 和敏感数据
    const cleanParams = this._sanitizeParams(params);
    
    gtag('event', eventName, cleanParams);
    this._log('Track:', eventName, cleanParams);
  },

  /**
   * 上报页面浏览
   * @param {string} pageTitle - 页面标题
   * @param {string} pageLocation - 页面路径
   */
  trackPageView(pageTitle = 'TagTag', pageLocation = '/options') {
    if (!this._initialized) this.init();
    
    gtag('event', 'page_view', {
      page_title: pageTitle,
      page_location: pageLocation,
    });
    this._log('Page view:', pageTitle);
  },

  /**
   * 上报页面配置信息
   * @param {Object} config - 配置对象
   */
  trackPageConfig(config) {
    const params = {
      theme: config.theme || 'unknown',
      tab_style: config.tabStyle || 'unknown',
      language: config.language || 'unknown',
      open_tab_mode: config.openTabMode || 'unknown',
      space_count: config.spaceCount || 0,
      group_count: config.groupCount || 0,
      tab_count: config.tabCount || 0,
      auto_sync: config.autoSync || false,
      webdav_enabled: config.webdavEnabled || false,
    };
    
    this.track('page_config', params);
  },

  // ═══ Tab Events ═══

  trackTabClick(spaceId, groupId, tabId) {
    this.track('tab_click', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  trackTabRename(spaceId, groupId, tabId) {
    this.track('tab_rename', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  trackTabEditUrl(spaceId, groupId, tabId) {
    this.track('tab_edit_url', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  trackTabDelete(spaceId, groupId, tabId) {
    this.track('tab_delete', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  trackTabDragReorder(spaceId, groupId, fromIndex, toIndex) {
    this.track('tab_drag_reorder', { 
      space_id: spaceId, 
      group_id: groupId, 
      from_index: fromIndex, 
      to_index: toIndex 
    });
  },

  trackTabDragMove(fromSpaceId, fromGroupId, toSpaceId, toGroupId, tabId) {
    this.track('tab_drag_move', { 
      from_space_id: fromSpaceId, 
      from_group_id: fromGroupId,
      to_space_id: toSpaceId,
      to_group_id: toGroupId,
      tab_id: tabId 
    });
  },

  trackTabDragCopy(fromSpaceId, fromGroupId, toSpaceId, toGroupId, tabId) {
    this.track('tab_drag_copy', { 
      from_space_id: fromSpaceId, 
      from_group_id: fromGroupId,
      to_space_id: toSpaceId,
      to_group_id: toGroupId,
      tab_id: tabId 
    });
  },

  trackTabMenuClick(spaceId, groupId, tabId) {
    this.track('tab_menu_click', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  trackTabDragStart(spaceId, groupId, tabId) {
    this.track('tab_drag_start', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  trackTabDragEnd(spaceId, groupId, tabId, dropped) {
    this.track('tab_drag_end', { space_id: spaceId, group_id: groupId, tab_id: tabId, dropped });
  },

  // ═══ Collection/Group Events ═══

  trackCollectionCreate(spaceId, groupName) {
    this.track('collection_create', { space_id: spaceId, group_name: groupName });
  },

  trackCollectionRename(spaceId, groupId, oldName, newName) {
    this.track('collection_rename', { space_id: spaceId, group_id: groupId, old_name: oldName, new_name: newName });
  },

  trackCollectionDelete(spaceId, groupId) {
    this.track('collection_delete', { space_id: spaceId, group_id: groupId });
  },

  trackCollectionCollapse(spaceId, groupId, collapsed) {
    this.track('collection_collapse', { space_id: spaceId, group_id: groupId, collapsed });
  },

  trackCollectionDragStart(spaceId, groupId) {
    this.track('collection_drag_start', { space_id: spaceId, group_id: groupId });
  },

  trackCollectionDragEnd(spaceId, groupId, dropped) {
    this.track('collection_drag_end', { space_id: spaceId, group_id: groupId, dropped });
  },

  trackCollectionDragReorder(spaceId, fromIndex, toIndex) {
    this.track('collection_drag_reorder', { space_id: spaceId, from_index: fromIndex, to_index: toIndex });
  },

  trackCollectionMoveToSpace(fromSpaceId, toSpaceId, groupId, mode) {
    this.track('collection_move_to_space', {
      from_space_id: fromSpaceId,
      to_space_id: toSpaceId,
      group_id: groupId,
      mode
    });
  },

  // ═══ Space Events ═══

  trackSpaceClick(spaceId, spaceName) {
    this.track('space_click', { space_id: spaceId, space_name: spaceName });
  },

  trackSpaceCreate(spaceId, spaceName) {
    this.track('space_create', { space_id: spaceId, space_name: spaceName });
  },

  trackSpaceImport(spaceId, source) {
    this.track('space_import', { space_id: spaceId, source });
  },

  trackSpaceExport(spaceId) {
    this.track('space_export', { space_id: spaceId });
  },

  trackSpaceEditIcon(spaceId, icon) {
    this.track('space_edit_icon', { space_id: spaceId, icon });
  },

  trackSpaceEditName(spaceId, oldName, newName) {
    this.track('space_edit_name', { space_id: spaceId, old_name: oldName, new_name: newName });
  },

  trackSpaceDelete(spaceId) {
    this.track('space_delete', { space_id: spaceId });
  },

  trackSpaceDragReorder(fromIndex, toIndex) {
    this.track('space_drag_reorder', { from_index: fromIndex, to_index: toIndex });
  },

  trackSpaceMenuCreate() {
    this.track('space_menu_create');
  },

  trackSpaceMenuImport(source) {
    this.track('space_menu_import', { source });
  },

  // ═══ Current Tabs Events ═══

  trackCurrentTabClose(tabId) {
    this.track('current_tab_close', { tab_id: tabId });
  },

  trackCurrentTabSave(tabCount) {
    this.track('current_tab_save', { tab_count: tabCount });
  },

  trackCurrentTabCollapse() {
    this.track('current_tab_collapse');
  },

  trackCurrentTabDrag(targetSpaceId, targetGroupId) {
    this.track('current_tab_drag', { target_space_id: targetSpaceId, target_group_id: targetGroupId });
  },

  // ═══ Search & Select Events ═══

  trackSearchTabs(queryLength) {
    this.track('search_tabs', { query_length: queryLength });
  },

  trackAddCollection(spaceId) {
    this.track('add_collection', { space_id: spaceId });
  },

  trackSelectTabsMode() {
    this.track('select_tabs_mode');
  },

  trackSelectTabsCancel(selectedCount) {
    this.track('select_tabs_cancel', { selected_count: selectedCount });
  },

  trackSelectTabsCreateGroup(selectedCount) {
    this.track('select_tabs_create_group', { selected_count: selectedCount });
  },

  trackSelectTabsDelete(selectedCount) {
    this.track('select_tabs_delete', { selected_count: selectedCount });
  },

  trackSelectTabsMove(selectedCount, targetSpaceId) {
    this.track('select_tabs_move', { selected_count: selectedCount, target_space_id: targetSpaceId });
  },

  // ═══ Sidebar & Navigation Events ═══

  trackSidebarCollapse(collapsed) {
    this.track('sidebar_collapse', { collapsed });
  },

  trackPrefMenuOpen() {
    this.track('pref_menu_open');
  },

  trackSettingsOpen() {
    this.track('settings_open');
  },

  trackBackupSyncOpen() {
    this.track('backup_sync_open');
  },

  trackAboutOpen() {
    this.track('about_open');
  },

  // ═══ Settings Events ═══

  trackSettingTheme(theme) {
    this.track('setting_theme', { theme });
  },

  trackSettingTabStyle(tabStyle) {
    this.track('setting_tab_style', { tab_style: tabStyle });
  },

  trackSettingLanguage(language) {
    this.track('setting_language', { language });
  },

  trackSettingOpenMode(mode) {
    this.track('setting_open_mode', { mode });
  },

  // ═══ Backup & Sync Events ═══

  trackWebDAVTestConnect() {
    this.track('webdav_test_connect');
  },

  trackWebDAVUpload() {
    this.track('webdav_upload');
  },

  trackWebDAVDownload() {
    this.track('webdav_download');
  },

  trackWebDAVAutoSyncToggle(enabled) {
    this.track('webdav_auto_sync_toggle', { enabled });
  },

  trackGitHubGistClick() {
    this.track('github_gist_click');
  },

  trackBackupExport() {
    this.track('backup_export');
  },

  trackBackupImport(mode) {
    this.track('backup_import', { mode });
  },

  // ═══ About Events ═══

  trackAboutWeiboClick() {
    this.track('about_weibo_click');
  },

  // ═══ Helper Methods ═══

  _sanitizeParams(params) {
    const clean = {};
    for (const [key, value] of Object.entries(params)) {
      // 跳过 undefined 和 null
      if (value === undefined || value === null) continue;
      
      // 跳过敏感数据 (URL、完整标题等)
      if (this._isSensitiveKey(key)) continue;
      
      // 转换布尔值为字符串
      if (typeof value === 'boolean') {
        clean[key] = value ? 'true' : 'false';
      } else {
        clean[key] = String(value);
      }
    }
    return clean;
  },

  _isSensitiveKey(key) {
    const sensitiveKeys = ['url', 'title', 'favicon', 'password', 'token', 'key'];
    return sensitiveKeys.some(sk => key.toLowerCase().includes(sk));
  },

  _log(...args) {
    if (this.DEBUG) {
      console.log('[Analytics]', ...args);
    }
  },
};

// 自动初始化
if (typeof window !== 'undefined') {
  Analytics.init();
}
