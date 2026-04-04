// ═══════════════════════════════════════════════════════════
// TagTag — Internationalization (i18n)
// ═══════════════════════════════════════════════════════════

const I18N = {
  _lang: 'en',

  strings: {
    en: {
      // Sidebar
      spaces: 'Spaces',
      newSpace: 'New Space',
      settings: 'Settings',
      toggleSidebar: 'Toggle sidebar',

      // Top bar
      searchTabs: 'Search Tabs',
      addCollection: '+ Add collection',

      // Tabs count
      tabs: 'Tabs',
      tabsCount: (n) => `Tabs (${n})`,

      // Right sidebar
      save: 'Save',
      saveAllTabs: 'Save all tabs to current space',
      toggleCurrentTabs: 'Toggle Current Tabs',
      closeTab: 'Close tab',

      // Space context menu
      importJson: 'Import JSON',
      exportJson: 'Export JSON',
      changeIcon: 'Change Icon',
      editName: 'Edit Name',
      delete: 'Delete',

      // Tab context menu
      rename: 'Rename',
      editUrl: 'Edit URL',

      // Modal
      dialog: 'Dialog',
      cancel: 'Cancel',
      confirm: 'Confirm',

      // Modal titles
      modalNewSpace: 'New Space',
      modalNewCollection: 'New Collection',
      modalEditSpaceName: 'Edit Space Name',
      modalRenameTab: 'Rename Tab',
      modalEditUrl: 'Edit URL',
      modalRenameCollection: 'Rename Collection',

      // Emoji picker
      chooseIcon: 'Choose Icon',

      // Empty state
      emptyState: 'No collections yet. Click "+ Add collection" or import JSON via space menu.',
      dragTabsHere: 'Drag tabs here',

      // Toast
      tabAlreadyExists: 'Tab already in this collection',
      movedTo: (name) => `Moved to "${name}"`,
      addedTo: (name) => `Added to "${name}"`,
      exportedSuccess: 'Exported successfully!',
      savedTabs: (n) => `Saved ${n} tabs!`,
      unsupportedFormat: 'Unsupported JSON format',
      importFailed: 'Failed to import JSON',
      importedCollections: (n) => `Imported ${n} collections!`,

      // Confirm
      confirmDeleteCollection: (name) => `Delete collection "${name}"?`,
      confirmDeleteSpace: (name) => `Delete space "${name}"?`,

      // Tooltips
      more: 'More',
      dragToReorder: 'Drag to reorder',
      copyCollection: 'Copy',
      moveCollection: 'Move',
      copiedTo: (name) => `Copied to "${name}"`,

      // Settings & Preferences
      preferences: 'Preferences',
      settingsTitle: 'Settings',
      aboutMe: 'About Me',
      aboutTagTag: 'About TagTag',
      aboutVersion: 'v0.0.1',
      aboutDesc: 'TagTag is a tab management tool inspired by TabTab.',
      aboutInfoTitle: 'TagTag Info',
      aboutInfo1: 'The left sidebar shows all your workspaces. Click + to create a new space.',
      aboutInfo2: 'The right side of the workspace shows the tabs currently open in your browser. You can drag them into the space area to add to collections.',
      aboutInfo3: 'For more information, please refer to TagTag Docs.',
      aboutContact: 'Contact Me',
      aboutWeibo: 'Weibo',
      language: 'Language',
      theme: 'Theme',
      openTabMode: 'Open Tab Mode',
      themeSystem: 'System',
      themeDark: 'Dark',
      themeLight: 'Light',
      modeRedirect: 'Redirect',
      modeNewTab: 'New Tab',

      // Fallback
      untitled: 'Untitled',
      defaultSpace: 'Default',
      defaultCollection: 'Collection',
    },

    zh: {
      // Sidebar
      spaces: '命名空间',
      newSpace: '新建空间',
      settings: '设置',
      toggleSidebar: '切换侧栏',

      // Top bar
      searchTabs: '搜索标签页',
      addCollection: '+ 添加标签组',

      // Tabs count
      tabs: '标签页',
      tabsCount: (n) => `标签页 (${n})`,

      // Right sidebar
      save: '保存',
      saveAllTabs: '保存所有标签页到当前空间',
      toggleCurrentTabs: '切换当前标签页',
      closeTab: '关闭标签页',

      // Space context menu
      importJson: '导入 JSON',
      exportJson: '导出 JSON',
      changeIcon: '更换图标',
      editName: '编辑名称',
      delete: '删除',

      // Tab context menu
      rename: '重命名',
      editUrl: '编辑链接',

      // Modal
      dialog: '对话框',
      cancel: '取消',
      confirm: '确认',

      // Modal titles
      modalNewSpace: '新建空间',
      modalNewCollection: '新建标签组',
      modalEditSpaceName: '编辑空间名称',
      modalRenameTab: '重命名标签',
      modalEditUrl: '编辑链接',
      modalRenameCollection: '重命名标签组',

      // Emoji picker
      chooseIcon: '选择图标',

      // Empty state
      emptyState: '暂无标签组，点击"+ 添加标签组"或通过空间菜单导入 JSON。',
      dragTabsHere: '拖拽标签到这里',

      // Toast
      tabAlreadyExists: '该标签已存在于此标签组',
      movedTo: (name) => `已移动到"${name}"`,
      addedTo: (name) => `已添加到"${name}"`,
      exportedSuccess: '导出成功！',
      savedTabs: (n) => `已保存 ${n} 个标签页！`,
      unsupportedFormat: '不支持的 JSON 格式',
      importFailed: '导入 JSON 失败',
      importedCollections: (n) => `已导入 ${n} 个标签组！`,

      // Confirm
      confirmDeleteCollection: (name) => `确定删除标签组"${name}"？`,
      confirmDeleteSpace: (name) => `确定删除空间"${name}"？`,

      // Tooltips
      more: '更多',
      dragToReorder: '拖拽排序',
      copyCollection: '复制',
      moveCollection: '移动',
      copiedTo: (name) => `已复制到"${name}"`,

      // Settings & Preferences
      preferences: '偏好设置',
      settingsTitle: '设置',
      aboutMe: '关于我',
      aboutTagTag: '关于 TagTag',
      aboutVersion: 'v0.0.1',
      aboutDesc: 'TagTag 是一个模仿 TabTab 的标签页管理工具。',
      aboutInfoTitle: 'TagTag Info',
      aboutInfo1: '左侧栏显示所有工作空间。点击 + 号创建新空间。',
      aboutInfo2: '工作空间右侧显示浏览器中当前打开的标签页。您可以将它们拖动到空间区域以添加到收藏。',
      aboutInfo3: '更多信息，请参考 TagTag Docs。',
      aboutContact: '联系我',
      aboutWeibo: '微博',
      language: '语言',
      theme: '主题',
      openTabMode: '打开标签方式',
      themeSystem: '跟随系统',
      themeDark: '深色',
      themeLight: '浅色',
      modeRedirect: '当前页跳转',
      modeNewTab: '新标签页',

      // Fallback
      untitled: '未命名',
      defaultSpace: '默认',
      defaultCollection: '分组',
    },
  },

  setLang(lang) {
    I18N._lang = lang;
  },

  t(key, ...args) {
    const val = I18N.strings[I18N._lang]?.[key] || I18N.strings.en[key] || key;
    return typeof val === 'function' ? val(...args) : val;
  },
};
