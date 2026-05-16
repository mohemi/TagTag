// ═══════════════════════════════════════════════════════════
// TagTag — Google Analytics 4 Measurement Protocol Module
// ═══════════════════════════════════════════════════════════

const Analytics = {
  // GA4 配置
  GA_ID: 'G-ESFPG8GSYM',
  // API ZINFOID_04Q - 需要在 GA4 中创建
  // 创建路径: GA4 管理中心 > 数据流 > 选择数据流 > Measurement Protocol API secrets
  API_secret: '', // 请填入你的 API Secret

  // 是否启用调试模式
  DEBUG: false,

  // 客户端 ID (持久化存储)
  _clientId: null,

  // ═══ Initialization ═══

  async init() {
    // 获取或生成客户端 ID
    this._clientId = await this._getOrCreateClientId();
    this._log('Analytics initialized, clientId:', this._clientId);
  },

  async _getOrCreateClientId() {
    // 尝试从 chrome.storage 获取已有的 clientId
    return new Promise((resolve) => {
      chrome.storage.local.get(['ga_client_id'], (result) => {
        if (result.ga_client_id) {
          resolve(result.ga_client_id);
        } else {
          // 生成新的 clientId (符合 GA4 格式)
          const clientId = this._generateClientId();
          chrome.storage.local.set({ ga_client_id: clientId });
          resolve(clientId);
        }
      });
    });
  },

  _generateClientId() {
    // GA4 格式: 10 位随机数.13 位时间戳
    const random = Math.floor(Math.random() * 1000000000);
    const timestamp = Date.now();
    return `${random}.${timestamp}`;
  },

  // ═══ Core Tracking Methods ═══

  /**
   * 发送事件到 GA4
   * @param {string} eventName - 事件名称
   * @param {Object} params - 事件参数
   */
  async track(eventName, params = {}) {
    // 确保 clientId 已初始化
    if (!this._clientId) {
      await this.init();
    }

    // 清理参数
    const cleanParams = this._sanitizeParams(params);

    // 发送请求
    await this._sendEvent(eventName, cleanParams);
    this._log('Track:', eventName, cleanParams);
  },

  async _sendEvent(eventName, params) {
    if (!this.API_secret) {
      this._log('Warning: API_secret not set, skipping analytics');
      return;
    }

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${this.GA_ID}&api_secret=${this.API_secret}`;

    const payload = {
      client_id: this._clientId,
      events: [{
        name: eventName,
        params: {
          ...params,
          session_id: this._clientId, // 使用 clientId 作为 session_id
          engagement_time_msec: 100, // GA4 需要这个参数
        }
      }]
    };

    try {
      await fetch(url, {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true, // 确保页面关闭时也能发送
      });
    } catch (error) {
      this._log('Error sending event:', error);
    }
  },

  /**
   * 上报页面浏览
   * @param {string} pageTitle - 页面标题
   * @param {string} pageLocation - 页面路径
   */
  async trackPageView(pageTitle = 'TagTag', pageLocation = '/options') {
    await this.track('page_view', {
      page_title: pageTitle,
      page_location: pageLocation,
    });
    this._log('Page view:', pageTitle);
  },

  /**
   * 上报页面配置信息
   * @param {Object} config - 配置对象
   */
  async trackPageConfig(config) {
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

    await this.track('page_config', params);
  },

  // ═══ Tab Events ═══

  async trackTabClick(spaceId, groupId, tabId) {
    await this.track('tab_click', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  async trackTabRename(spaceId, groupId, tabId) {
    await this.track('tab_rename', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  async trackTabEditUrl(spaceId, groupId, tabId) {
    await this.track('tab_edit_url', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  async trackTabDelete(spaceId, groupId, tabId) {
    await this.track('tab_delete', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  async trackTabDragReorder(spaceId, groupId, fromIndex, toIndex) {
    await this.track('tab_drag_reorder', {
      space_id: spaceId,
      group_id: groupId,
      from_index: fromIndex,
      to_index: toIndex
    });
  },

  async trackTabDragMove(fromSpaceId, fromGroupId, toSpaceId, toGroupId, tabId) {
    await this.track('tab_drag_move', {
      from_space_id: fromSpaceId,
      from_group_id: fromGroupId,
      to_space_id: toSpaceId,
      to_group_id: toGroupId,
      tab_id: tabId
    });
  },

  async trackTabDragCopy(fromSpaceId, fromGroupId, toSpaceId, toGroupId, tabId) {
    await this.track('tab_drag_copy', {
      from_space_id: fromSpaceId,
      from_group_id: fromGroupId,
      to_space_id: toSpaceId,
      to_group_id: toGroupId,
      tab_id: tabId
    });
  },

  async trackTabMenuClick(spaceId, groupId, tabId) {
    await this.track('tab_menu_click', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  async trackTabDragStart(spaceId, groupId, tabId) {
    await this.track('tab_drag_start', { space_id: spaceId, group_id: groupId, tab_id: tabId });
  },

  async trackTabDragEnd(spaceId, groupId, tabId, dropped) {
    await this.track('tab_drag_end', { space_id: spaceId, group_id: groupId, tab_id: tabId, dropped });
  },

  // ═══ Collection/Group Events ═══

  async trackCollectionCreate(spaceId, groupName) {
    await this.track('collection_create', { space_id: spaceId, group_name: groupName });
  },

  async trackCollectionRename(spaceId, groupId, oldName, newName) {
    await this.track('collection_rename', { space_id: spaceId, group_id: groupId, old_name: oldName, new_name: newName });
  },

  async trackCollectionDelete(spaceId, groupId) {
    await this.track('collection_delete', { space_id: spaceId, group_id: groupId });
  },

  async trackCollectionCollapse(spaceId, groupId, collapsed) {
    await this.track('collection_collapse', { space_id: spaceId, group_id: groupId, collapsed });
  },

  async trackCollectionDragStart(spaceId, groupId) {
    await this.track('collection_drag_start', { space_id: spaceId, group_id: groupId });
  },

  async trackCollectionDragEnd(spaceId, groupId, dropped) {
    await this.track('collection_drag_end', { space_id: spaceId, group_id: groupId, dropped });
  },

  async trackCollectionDragReorder(spaceId, fromIndex, toIndex) {
    await this.track('collection_drag_reorder', { space_id: spaceId, from_index: fromIndex, to_index: toIndex });
  },

  async trackCollectionMoveToSpace(fromSpaceId, toSpaceId, groupId, mode) {
    await this.track('collection_move_to_space', {
      from_space_id: fromSpaceId,
      to_space_id: toSpaceId,
      group_id: groupId,
      mode
    });
  },

  // ═══ Space Events ═══

  async trackSpaceClick(spaceId, spaceName) {
    await this.track('space_click', { space_id: spaceId, space_name: spaceName });
  },

  async trackSpaceCreate(spaceId, spaceName) {
    await this.track('space_create', { space_id: spaceId, space_name: spaceName });
  },

  async trackSpaceImport(spaceId, source) {
    await this.track('space_import', { space_id: spaceId, source });
  },

  async trackSpaceExport(spaceId) {
    await this.track('space_export', { space_id: spaceId });
  },

  async trackSpaceEditIcon(spaceId, icon) {
    await this.track('space_edit_icon', { space_id: spaceId, icon });
  },

  async trackSpaceEditName(spaceId, oldName, newName) {
    await this.track('space_edit_name', { space_id: spaceId, old_name: oldName, new_name: newName });
  },

  async trackSpaceDelete(spaceId) {
    await this.track('space_delete', { space_id: spaceId });
  },

  async trackSpaceDragReorder(fromIndex, toIndex) {
    await this.track('space_drag_reorder', { from_index: fromIndex, to_index: toIndex });
  },

  async trackSpaceMenuCreate() {
    await this.track('space_menu_create');
  },

  async trackSpaceMenuImport(source) {
    await this.track('space_menu_import', { source });
  },

  // ═══ Current Tabs Events ═══

  async trackCurrentTabClose(tabId) {
    await this.track('current_tab_close', { tab_id: tabId });
  },

  async trackCurrentTabSave(tabCount) {
    await this.track('current_tab_save', { tab_count: tabCount });
  },

  async trackCurrentTabCollapse() {
    await this.track('current_tab_collapse');
  },

  async trackCurrentTabDrag(targetSpaceId, targetGroupId) {
    await this.track('current_tab_drag', { target_space_id: targetSpaceId, target_group_id: targetGroupId });
  },

  // ═══ Search & Select Events ═══

  async trackSearchTabs(queryLength) {
    await this.track('search_tabs', { query_length: queryLength });
  },

  async trackAddCollection(spaceId) {
    await this.track('add_collection', { space_id: spaceId });
  },

  async trackSelectTabsMode() {
    await this.track('select_tabs_mode');
  },

  async trackSelectTabsCancel(selectedCount) {
    await this.track('select_tabs_cancel', { selected_count: selectedCount });
  },

  async trackSelectTabsCreateGroup(selectedCount) {
    await this.track('select_tabs_create_group', { selected_count: selectedCount });
  },

  async trackSelectTabsDelete(selectedCount) {
    await this.track('select_tabs_delete', { selected_count: selectedCount });
  },

  async trackSelectTabsMove(selectedCount, targetSpaceId) {
    await this.track('select_tabs_move', { selected_count: selectedCount, target_space_id: targetSpaceId });
  },

  // ═══ Sidebar & Navigation Events ═══

  async trackSidebarCollapse(collapsed) {
    await this.track('sidebar_collapse', { collapsed });
  },

  async trackPrefMenuOpen() {
    await this.track('pref_menu_open');
  },

  async trackSettingsOpen() {
    await this.track('settings_open');
  },

  async trackBackupSyncOpen() {
    await this.track('backup_sync_open');
  },

  async trackAboutOpen() {
    await this.track('about_open');
  },

  // ═══ Settings Events ═══

  async trackSettingTheme(theme) {
    await this.track('setting_theme', { theme });
  },

  async trackSettingTabStyle(tabStyle) {
    await this.track('setting_tab_style', { tab_style: tabStyle });
  },

  async trackSettingLanguage(language) {
    await this.track('setting_language', { language });
  },

  async trackSettingOpenMode(mode) {
    await this.track('setting_open_mode', { mode });
  },

  // ═══ Backup & Sync Events ═══

  async trackWebDAVTestConnect() {
    await this.track('webdav_test_connect');
  },

  async trackWebDAVUpload() {
    await this.track('webdav_upload');
  },

  async trackWebDAVDownload() {
    await this.track('webdav_download');
  },

  async trackWebDAVAutoSyncToggle(enabled) {
    await this.track('webdav_auto_sync_toggle', { enabled });
  },

  async trackGitHubGistClick() {
    await this.track('github_gist_click');
  },

  async trackBackupExport() {
    await this.track('backup_export');
  },

  async trackBackupImport(mode) {
    await this.track('backup_import', { mode });
  },

  // ═══ About Events ═══

  async trackAboutWeiboClick() {
    await this.track('about_weibo_click');
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
    const sensitiveKeys = ['url', 'title', 'favicon', 'Secret', 'token', 'key'];
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
