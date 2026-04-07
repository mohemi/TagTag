// ═══════════════════════════════════════════════════════════
// TagTag — Options Page Main Logic
// ═══════════════════════════════════════════════════════════

(async function () {
  'use strict';

  // ── State ──
  let data = { space_list: [], spaces: {} };
  let activeSpaceId = null;
  let browserTabs = [];
  let searchQuery = '';
  let dragSource = null;
  let selectMode = false;
  let tabStyle = 'vertical';
  let selectedTabs = new Map(); // key: "spaceId:groupId:tabId", value: { spaceId, groupId, tabId }
  let autoSyncTimer = null;
  let autoSyncInProgress = false;
  let suppressAutoSyncUntil = 0;

  // ── Theme Definitions ──
  const THEMES = {
    midnight: {
      '--bg-primary': '#0a0a0a',
      '--bg-sidebar': '#0a0a0a',
      '--bg-card': '#1a1a1a',
      '--bg-hover': '#2a2a2a',
      '--bg-input': '#141414',
      '--text-primary': '#d0d0d0',
      '--text-secondary': '#808080',
      '--text-muted': '#505050',
      '--border-color': '#2a2a2a',
      '--accent': '#808080',
      '--accent-hover': '#999999',
    },
    snow: {
      '--bg-primary': '#f0f0f5',
      '--bg-sidebar': '#f0f0f5',
      '--bg-card': '#ffffff',
      '--bg-hover': '#e8e8f0',
      '--bg-input': '#f5f5fa',
      '--text-primary': '#1a1a2e',
      '--text-secondary': '#555555',
      '--text-muted': '#999999',
      '--border-color': '#d0d0dd',
      '--accent': '#4a4a5a',
      '--accent-hover': '#5a5a6a',
    },
    violet: {
      '--bg-primary': '#0f0f1a',
      '--bg-sidebar': '#0f0f1a',
      '--bg-card': '#2a2a3e',
      '--bg-hover': '#33334d',
      '--bg-input': '#1e1e32',
      '--text-primary': '#e0e0e0',
      '--text-secondary': '#888888',
      '--text-muted': '#555555',
      '--border-color': '#3a3a55',
      '--accent': '#6c5ce7',
      '--accent-hover': '#7f70f0',
    },
    zinc: {
      '--bg-primary': '#18181B',
      '--bg-sidebar': '#18181B',
      '--bg-card': '#27272A',
      '--bg-hover': '#3F3F46',
      '--bg-input': '#1F1F23',
      '--text-primary': '#E4E4E7',
      '--text-secondary': '#A1A1AA',
      '--text-muted': '#71717A',
      '--border-color': '#3F3F46',
      '--accent': '#A1A1AA',
      '--accent-hover': '#D4D4D8',
    },
  };

  // ── DOM refs ──
  const $spacesList = document.getElementById('spacesList');
  const $currentSpaceName = document.getElementById('currentSpaceName');
  const $collectionsArea = document.getElementById('collectionsArea');
  const $currentTabsList = document.getElementById('currentTabsList');
  const $searchInput = document.getElementById('searchInput');
  const $tabCount = document.getElementById('tabCount');
  const $addSpaceBtn = document.getElementById('addSpaceBtn');
  const $spaceAddMenu = document.getElementById('spaceAddMenu');
  const $spaceJsonFileInput = document.getElementById('spaceJsonFileInput');
  const $bookmarkFileInput = document.getElementById('bookmarkFileInput');
  const $progressOverlay = document.getElementById('progressOverlay');
  const $progressTitle = document.getElementById('progressTitle');
  const $progressBarFill = document.getElementById('progressBarFill');
  const $progressText = document.getElementById('progressText');
  const $addCollectionBtn = document.getElementById('addCollectionBtn');
  const $selectTabsBtn = document.getElementById('selectTabsBtn');
  const $selectActions = document.getElementById('selectActions');
  const $selectCreateGroupBtn = document.getElementById('selectCreateGroupBtn');
  const $selectMoveBtn = document.getElementById('selectMoveBtn');
  const $selectDeleteBtn = document.getElementById('selectDeleteBtn');
  const $modalOverlay = document.getElementById('modalOverlay');
  const $modalTitle = document.getElementById('modalTitle');
  const $modalInput = document.getElementById('modalInput');
  const $modalConfirm = document.getElementById('modalConfirm');
  const $modalCancel = document.getElementById('modalCancel');
  const $modalClose = document.getElementById('modalClose');
  const $contextMenu = document.getElementById('contextMenu');
  const $jsonFileInput = document.getElementById('jsonFileInput');
  const $sidebarToggle = document.getElementById('sidebarToggle');
  const $sidebarLeftToggle = document.getElementById('sidebarLeftToggle');
  const $tabContextMenu = document.getElementById('tabContextMenu');
  const $emojiPickerOverlay = document.getElementById('emojiPickerOverlay');
  const $emojiPickerGrid = document.getElementById('emojiPickerGrid');
  const $emojiPickerClose = document.getElementById('emojiPickerClose');
  const $saveTabsBtn = document.getElementById('saveTabsBtn');
  const $currentTabsCount = document.getElementById('currentTabsCount');
  const $settingsBtn = document.getElementById('settingsBtn');
  const $prefMenu = document.getElementById('prefMenu');
  const $settingsOverlay = document.getElementById('settingsOverlay');
  const $settingsClose = document.getElementById('settingsClose');
  const $themeSwatches = document.getElementById('themeSwatches');
  const $tabStyleOptions = document.getElementById('tabStyleOptions');
  const $aboutOverlay = document.getElementById('aboutOverlay');
  const $aboutClose = document.getElementById('aboutClose');
  const $aboutBody = document.getElementById('aboutBody');
  
  // ── Backup & Sync DOM refs ──
  const $backupOverlay = document.getElementById('backupOverlay');
  const $backupClose = document.getElementById('backupClose');
  const $backupVersion = document.getElementById('backupVersion');
  const $backupModified = document.getElementById('backupModified');
  const $statSpaces = document.getElementById('statSpaces');
  const $statGroups = document.getElementById('statGroups');
  const $statTabs = document.getElementById('statTabs');
  const $backupExportBtn = document.getElementById('backupExportBtn');
  const $backupImportBtn = document.getElementById('backupImportBtn');
  const $backupImportFileInput = document.getElementById('backupImportFileInput');
  const $githubGistToggle = document.getElementById('githubGistToggle');
  const $webdavToggle = document.getElementById('webdavToggle');
  const $webdavConfig = document.getElementById('webdavConfig');
  const $webdavUrl = document.getElementById('webdavUrl');
  const $webdavUsername = document.getElementById('webdavUsername');
  const $webdavPassword = document.getElementById('webdavPassword');
  const $toggleWebdavPassword = document.getElementById('toggleWebdavPassword');
  const $webdavTestBtn = document.getElementById('webdavTestBtn');
  const $syncUploadBtn = document.getElementById('syncUploadBtn');
  const $syncDownloadBtn = document.getElementById('syncDownloadBtn');
  const $webdavAutoSync = document.getElementById('webdavAutoSync');
  const AUTO_SYNC_DEBOUNCE_MS = 2000;

  // ── Emoji list ──
  const EMOJIS = [
    '🪟','📌','📚','⏳','🚀','💡','🎯','🔥','⭐','💻','🎨','🎵',
    '📝','📊','🔧','🌐','📁','🏠','🧪','🎮','📱','🛒','💼','🔍',
    '❤️','🌟','🎬','📸','🍕','☕','🌈','🦄','🐱','🐶','🌺','🍀',
    '🏆','🎁','🔔','💎','🧩','🗂️','📮','🛠️','🔒','🌍','🎓','📐',
  ];

  function randomEmoji() {
    return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
  }

  const t = I18N.t.bind(I18N);

  // ═══ Init ═══

  async function init() {
    const settings = await StorageManager.getSettings();
    I18N.setLang(settings.language || 'en');
    await StorageManager.seedDefaults(t('defaultSpace'), t('defaultCollection'), randomEmoji());
    data = await StorageManager.getData();

    activeSpaceId = settings.defaultSpace || (data.space_list[0] && data.space_list[0].id);
    applyTheme(settings.theme);
    tabStyle = settings.tabStyle || 'vertical';
    applyLanguage();

    await loadBrowserTabs();

    renderSpaces();
    renderGroups();
    renderCurrentTabs();
    bindEvents();
    bindAutoSync();
  }

  const DEFAULT_FAVICON = chrome.runtime.getURL('assets/icons/defalut_128.png');
  const SELF_URL = chrome.runtime.getURL('options/options.html');

  // ═══ Icon Helper ═══
  // Centralized favicon handler - modify here to change default icon
  function getFaviconUrl(favIconUrl) {
    return favIconUrl || DEFAULT_FAVICON;
  }

  // ── Menu Icon SVGs ──
  const MENU_ICONS = {
    copy: '<svg viewBox="0 0 16 16" fill="none"><rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M11 3H4.5A1.5 1.5 0 003 4.5V11" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    move: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M10 5l3 3-3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    create: '<svg viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    import: '<svg viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bookmark: '<svg viewBox="0 0 16 16" fill="none"><path d="M4 2h8v12l-4-3-4 3V2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  };

  const CHEVRON_RIGHT_ICON = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6"></path>
    </svg>
  `;

  function menuIcon(name) {
    return `<span class="context-menu-icon">${MENU_ICONS[name] || ''}</span>`;
  }

  async function loadBrowserTabs() {
    try {
      const all = await chrome.tabs.query({});
      browserTabs = all.filter(t => {
        if (!t.url) return true;
        if (t.url.startsWith(SELF_URL)) return false;
        if (t.url === 'chrome://newtab/' || t.url === 'chrome://newtab') return false;
        if (t.pendingUrl && t.pendingUrl.startsWith(SELF_URL)) return false;
        return true;
      });
    } catch {
      browserTabs = [];
    }
  }

  // ═══ Apply Language to static HTML elements ═══

  function applyLanguage() {
    // Sidebar
    document.querySelector('.spaces-label span').textContent = t('spaces');
    $addSpaceBtn.title = t('newSpace');
    $sidebarLeftToggle.title = t('toggleSidebar');
    document.querySelector('.settings-btn-text').textContent = t('preferences');
    $settingsBtn.title = t('preferences');
    // Pref menu items (preserve icons)
    setMenuItemText($prefMenu.querySelector('[data-action="settings"]'), t('settingsTitle'));
    setMenuItemText($prefMenu.querySelector('[data-action="backup"]'), t('backupSync'));
    setMenuItemText($prefMenu.querySelector('[data-action="about"]'), t('aboutMe'));

    // Top bar
    $searchInput.placeholder = t('searchTabs');
    $addCollectionBtn.textContent = t('addCollection');
    $selectTabsBtn.textContent = selectMode ? t('cancelSelect') : t('selectTabs');
    updateSelectActions();

    // Right sidebar
    $saveTabsBtn.title = t('saveAllTabs');
    $saveTabsBtn.querySelector('svg').nextSibling.textContent = ' ' + t('save');
    $sidebarToggle.title = t('toggleCurrentTabs');

    // Modal
    $modalCancel.textContent = t('cancel');
    $modalConfirm.textContent = t('confirm');

    // Space context menu (preserve icons)
    setMenuItemText($contextMenu.querySelector('[data-action="import-json"]'), t('importJson'));
    setMenuItemText($contextMenu.querySelector('[data-action="export-json"]'), t('exportJson'));
    setMenuItemText($contextMenu.querySelector('[data-action="change-icon"]'), t('changeIcon'));
    setMenuItemText($contextMenu.querySelector('[data-action="rename"]'), t('editName'));
    setMenuItemText($contextMenu.querySelector('[data-action="delete"]'), t('delete'));

    // Tab context menu (preserve icons)
    setMenuItemText($tabContextMenu.querySelector('[data-action="tab-rename"]'), t('rename'));
    setMenuItemText($tabContextMenu.querySelector('[data-action="tab-edit-url"]'), t('editUrl'));
    setMenuItemText($tabContextMenu.querySelector('[data-action="tab-delete"]'), t('delete'));

    // Space add menu (preserve icons)
    setMenuItemText($spaceAddMenu.querySelector('[data-action="create-space"]'), t('createSpace'));
    setMenuItemText($spaceAddMenu.querySelector('[data-action="import-space"]'), t('importSpace'));
    setMenuItemText($spaceAddMenu.querySelector('[data-action="import-bookmarks"]'), t('importBookmarks'));

    // Emoji picker
    document.querySelector('.emoji-picker-header h3').textContent = t('chooseIcon');

    // Settings
    document.querySelector('.settings-header h2').textContent = t('settingsTitle');
    const settingsLabels = document.querySelectorAll('.settings-row > label:first-child');
    if (settingsLabels[0]) settingsLabels[0].textContent = t('theme');
    if (settingsLabels[1]) settingsLabels[1].textContent = t('tabStyle');
    if (settingsLabels[2]) settingsLabels[2].textContent = t('language');
    if (settingsLabels[3]) settingsLabels[3].textContent = t('openTabMode');

    // Settings: theme swatch titles
    const swatches = document.querySelectorAll('.theme-swatch');
    swatches.forEach(btn => {
      const key = 'theme' + btn.dataset.theme.charAt(0).toUpperCase() + btn.dataset.theme.slice(1);
      btn.title = t(key) || btn.dataset.theme;
    });

    const modeSelect = document.getElementById('settingOpenTabMode');
    modeSelect.options[0].textContent = t('modeRedirect');
    modeSelect.options[1].textContent = t('modeNewTab');
  }

  // Helper: update menu item text while preserving icon span
  function setMenuItemText(el, text) {
    if (!el) return;
    const icon = el.querySelector('.context-menu-icon');
    if (icon) {
      // Remove all text nodes, keep icon
      Array.from(el.childNodes).forEach(node => {
        if (node.nodeType === 3) node.remove();
      });
      el.appendChild(document.createTextNode(text));
    } else {
      el.textContent = text;
    }
  }

  // ═══ Render: Spaces Sidebar ═══

  function renderSpaces() {
    $spacesList.innerHTML = '';
    data.space_list.forEach((spaceInfo, index) => {
      const li = document.createElement('li');
      li.className = 'space-item' + (spaceInfo.id === activeSpaceId ? ' active' : '');
      li.dataset.id = spaceInfo.id;
      li.dataset.index = index;
      li.draggable = true;

      const iconDisplay = spaceInfo.icon && !spaceInfo.icon.startsWith('http')
        ? spaceInfo.icon
        : (spaceInfo.icon ? `<img src="${esc(spaceInfo.icon)}" width="16" height="16" style="vertical-align:middle;border-radius:3px;">` : '•');

      li.innerHTML = `
        <span class="space-icon">${iconDisplay}</span>
        <span class="space-name">${esc(spaceInfo.name)}</span>
        <button class="space-menu-btn" data-id="${spaceInfo.id}" title="${t('more')}">···</button>
      `;

      li.addEventListener('click', (e) => {
        if (e.target.closest('.space-menu-btn')) return;
        switchSpace(spaceInfo.id);
      });

      // ── Space Drag & Drop Reorder ──
      li.addEventListener('dragstart', (e) => {
        dragSource = { type: 'space', spaceId: spaceInfo.id, index };
        e.dataTransfer.effectAllowed = 'move';
        li.classList.add('dragging');
      });
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
        document.querySelectorAll('.space-item').forEach(s => s.classList.remove('drag-over'));
        dragSource = null;
      });
      li.addEventListener('dragover', (e) => {
        if (!dragSource || dragSource.type !== 'space') return;
        e.preventDefault();
        document.querySelectorAll('.space-item').forEach(s => s.classList.remove('drag-over'));
        if (dragSource.index !== index) {
          li.classList.add('drag-over');
        }
      });
      li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over');
      });
      li.addEventListener('drop', (e) => {
        if (!dragSource || dragSource.type !== 'space') return;
        e.preventDefault();
        li.classList.remove('drag-over');
        const sourceIndex = dragSource.index;
        const targetIndex = index;
        if (sourceIndex === targetIndex) return;
        const [moved] = data.space_list.splice(sourceIndex, 1);
        data.space_list.splice(targetIndex, 0, moved);
        saveAll();
        renderSpaces();
      });

      $spacesList.appendChild(li);
    });
  }

  function switchSpace(spaceId) {
    activeSpaceId = spaceId;
    renderSpaces();
    renderGroups();
    StorageManager.getSettings().then(s => {
      s.defaultSpace = spaceId;
      StorageManager.saveSettings(s);
    });
  }

  // ═══ Render: Middle Area (Groups) ═══

  function renderGroups() {
    const space = data.spaces[activeSpaceId];
    const spaceInfo = data.space_list.find(s => s.id === activeSpaceId);
    
    if (!space) {
      $currentSpaceName.textContent = '';
      $collectionsArea.innerHTML = '';
      $tabCount.textContent = t('tabsCount', 0);
      return;
    }

    $currentSpaceName.textContent = space.name;
    $collectionsArea.innerHTML = '';

    if (!space.groups || space.groups.length === 0) {
      $collectionsArea.innerHTML = `
        <div class="empty-state">
          <p>${t('emptyState')}</p>
        </div>`;
      $tabCount.textContent = t('tabsCount', 0);
      return;
    }

    let totalTabs = 0;

    space.groups.forEach((group, groupIndex) => {
      const section = document.createElement('div');
      section.className = 'collection-section';
      section.dataset.groupId = group.id;
      section.dataset.index = groupIndex;
      section.draggable = false;
      const isCollapsed = Boolean(group.collapsed);

      // ── Header ──
      const header = document.createElement('div');
      header.className = 'collection-header';
      header.innerHTML = `
        <span class="collection-drag-handle" title="${t('dragToReorder')}">⠿</span>
        <span class="collection-name">${esc(group.name)}</span>
        <span class="collection-toggle${isCollapsed ? ' collapsed' : ''}" title="${t('toggleSidebar')}">${CHEVRON_RIGHT_ICON}</span>
        <div class="collection-actions">
          ${selectMode
            ? `<button class="btn-icon collection-selectall-btn" title="${t('selectAll')}" style="font-size:11px">☐ ${t('selectAll')}</button>`
            : `<button class="btn-icon collection-move-btn" title="${t('moveCollection')}" style="font-size:12px">⇄ ${t('moveCollection')}</button>`
          }
          <button class="btn-icon collection-rename-btn" title="${t('rename')}" style="font-size:13px">✎ ${t('rename')}</button>
          <button class="btn-icon collection-delete-btn" title="${t('delete')}" style="font-size:14px">× ${t('delete')}</button>
        </div>
      `;

      // ── Collection Drag & Drop ──
      const dragHandle = header.querySelector('.collection-drag-handle');
      
      // Only allow drag from the drag handle
      dragHandle.addEventListener('mousedown', (e) => {
        section.draggable = true;
      });
      
      dragHandle.addEventListener('mouseup', (e) => {
        section.draggable = false;
      });

      section.addEventListener('dragstart', (e) => {
        // Only handle drag if it originated from this section itself (via drag handle)
        // Don't interfere with child element drags (e.g., tab cards)
        if (e.target !== section) {
          return;
        }
        if (!section.draggable) {
          e.preventDefault();
          return;
        }
        dragSource = { type: 'group', spaceId: activeSpaceId, groupId: group.id, index: groupIndex };
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'group', groupId: group.id, index: groupIndex }));
        e.dataTransfer.effectAllowed = 'move';
        section.classList.add('dragging');
      });

      section.addEventListener('dragend', (e) => {
        // Only handle if this section was the drag source (not a child card)
        if (!dragSource || dragSource.type !== 'group') return;
        section.classList.remove('dragging');
        section.draggable = false;
        // Clear all drag indicators
        document.querySelectorAll('.collection-section').forEach(s => {
          s.classList.remove('drag-above', 'drag-below');
        });
        dragSource = null;
      });

      section.addEventListener('dragover', (e) => {
        if (!dragSource) return;
        if (dragSource.type === 'group') {
          e.preventDefault();
          e.stopPropagation();

          const rect = section.getBoundingClientRect();
          const midpoint = rect.top + rect.height / 2;

          section.classList.remove('drag-above', 'drag-below');
          if (e.clientY < midpoint) {
            section.classList.add('drag-above');
          } else {
            section.classList.add('drag-below');
          }
          return;
        }
        // Allow tab card / browser tab drop on section header or collapsed group
        if (dragSource.type === 'card' || dragSource.type === 'browser') {
          e.preventDefault();
          section.classList.add('drag-over');
        }
      });

      section.addEventListener('dragleave', (e) => {
        section.classList.remove('drag-above', 'drag-below', 'drag-over');
      });

      section.addEventListener('drop', (e) => {
        section.classList.remove('drag-over');
        if (!dragSource) return;
        if (dragSource.type === 'card' || dragSource.type === 'browser') {
          e.preventDefault();
          handleDrop(e, activeSpaceId, group.id);
          return;
        }
        if (dragSource.type !== 'group') return;
        e.preventDefault();
        e.stopPropagation();
        
        section.classList.remove('drag-above', 'drag-below');
        
        const sourceIndex = dragSource.index;
        const targetIndex = parseInt(section.dataset.index);
        
        if (sourceIndex === targetIndex) return;
        
        const rect = section.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const insertBefore = e.clientY < midpoint;
        
        // Reorder groups
        const groups = space.groups;
        const [movedGroup] = groups.splice(sourceIndex, 1);
        
        let newIndex = targetIndex;
        if (sourceIndex < targetIndex && !insertBefore) {
          newIndex = targetIndex;
        } else if (sourceIndex < targetIndex && insertBefore) {
          newIndex = targetIndex - 1;
        } else if (sourceIndex > targetIndex && !insertBefore) {
          newIndex = targetIndex + 1;
        } else {
          newIndex = targetIndex;
        }
        
        groups.splice(newIndex, 0, movedGroup);
        
        saveAll();
        renderGroups();
      });

      header.querySelector('.collection-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        group.collapsed = !group.collapsed;
        const toggleEl = header.querySelector('.collection-toggle');
        toggleEl.classList.toggle('collapsed', group.collapsed);
        content.classList.toggle('collapsed', group.collapsed);
        saveAll();
      });

      // Click group name to inline rename
      header.querySelector('.collection-name').addEventListener('click', (e) => {
        e.stopPropagation();
        const nameEl = e.target;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = group.name;
        input.className = 'collection-name-input';
        nameEl.replaceWith(input);
        input.focus();
        input.select();

        function commit() {
          const val = input.value.trim();
          if (val && val !== group.name) {
            group.name = val;
            saveAll();
          }
          renderGroups();
        }

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') { input.blur(); }
          else if (ev.key === 'Escape') { input.value = group.name; input.blur(); }
        });
      });

      // Move/Copy to another space OR Select All
      if (selectMode) {
        header.querySelector('.collection-selectall-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          const groupTabs = group.tabs || [];
          const allSelected = groupTabs.every(tab => selectedTabs.has(`${activeSpaceId}:${group.id}:${tab.id}`));
          groupTabs.forEach(tab => {
            const key = `${activeSpaceId}:${group.id}:${tab.id}`;
            if (allSelected) {
              selectedTabs.delete(key);
            } else {
              selectedTabs.set(key, { spaceId: activeSpaceId, groupId: group.id, tabId: tab.id });
            }
          });
          renderGroups();
          updateSelectActions();
        });
      } else {
        header.querySelector('.collection-move-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          if (!$collDropMenu.hidden) {
            $collDropMenu.hidden = true;
            return;
          }
          hideAllMenus();
          showSpacePickerMenu(e.target, group.id, activeSpaceId);
        });
      }

      header.querySelector('.collection-rename-btn').addEventListener('click', () => {
        showModal(t('modalRenameCollection'), group.name, (newName) => {
          if (newName.trim()) {
            group.name = newName.trim();
            renderGroups();
            saveAll();
          }
        });
      });

      header.querySelector('.collection-delete-btn').addEventListener('click', () => {
        if (group.tabs.length > 0 && !confirm(t('confirmDeleteCollection', group.name))) return;
        space.groups = space.groups.filter(g => g.id !== group.id);
        renderGroups();
        saveAll();
      });

      section.appendChild(header);

      const content = document.createElement('div');
      content.className = `collection-content${isCollapsed ? ' collapsed' : ''}`;
      const contentInner = document.createElement('div');
      contentInner.className = 'collection-content-inner';

      // ── Tab Grid ──
      const tabs = filterTabs(group.tabs);

      // Empty placeholder (dashed box)
      const emptyPlaceholder = document.createElement('div');
      emptyPlaceholder.className = 'tab-grid-empty' + (tabs.length > 0 ? ' hidden' : '');
      emptyPlaceholder.textContent = t('dragTabsHere');
      emptyPlaceholder.dataset.spaceId = activeSpaceId;
      emptyPlaceholder.dataset.groupId = group.id;

      // Drop zone for empty placeholder
      emptyPlaceholder.addEventListener('dragover', (e) => {
        if (dragSource && dragSource.type === 'group') return;
        e.preventDefault();
        emptyPlaceholder.classList.add('drag-over');
      });
      emptyPlaceholder.addEventListener('dragleave', () => { emptyPlaceholder.classList.remove('drag-over'); });
      emptyPlaceholder.addEventListener('drop', (e) => {
        if (dragSource && dragSource.type === 'group') return;
        e.preventDefault();
        e.stopPropagation();
        emptyPlaceholder.classList.remove('drag-over');
        handleDrop(e, activeSpaceId, group.id);
      });

      contentInner.appendChild(emptyPlaceholder);

      const grid = document.createElement('div');
      const isH = tabStyle === 'horizontal';
      grid.className = 'tab-grid' + (tabs.length === 0 ? ' hidden' : '') + (isH ? ' horizontal' : '');
      grid.dataset.spaceId = activeSpaceId;
      grid.dataset.groupId = group.id;

      // Drop zone for tabs
      grid.addEventListener('dragover', (e) => {
        if (dragSource && dragSource.type === 'group') return;
        e.preventDefault();
        grid.classList.add('drag-over');
      });
      grid.addEventListener('dragleave', () => { grid.classList.remove('drag-over'); });
      grid.addEventListener('drop', (e) => {
        if (dragSource && dragSource.type === 'group') return;
        e.preventDefault();
        e.stopPropagation();
        grid.classList.remove('drag-over');
        handleDrop(e, activeSpaceId, group.id);
      });

      tabs.forEach(tab => {
        grid.appendChild(createTabCard(tab, activeSpaceId, group.id));
      });

      totalTabs += tabs.length;
      contentInner.appendChild(grid);
      content.appendChild(contentInner);
      section.appendChild(content);
      $collectionsArea.appendChild(section);
    });

    $tabCount.textContent = t('tabsCount', totalTabs);
  }

  function createTabCard(tab, spaceId, groupId) {
    const card = document.createElement('div');
    card.className = 'tab-card' + (tabStyle === 'horizontal' ? ' horizontal' : '');
    card.draggable = !selectMode;

    let domain = '';
    try { domain = new URL(tab.url).hostname.replace('www.', ''); } catch {}

    const faviconUrl = getFaviconUrl(tab.favIconUrl);
    const tabKey = `${spaceId}:${groupId}:${tab.id}`;
    const isChecked = selectedTabs.has(tabKey);

    if (selectMode) {
      card.classList.toggle('tab-card-selected', isChecked);
      card.innerHTML = `
        <img class="tab-favicon" src="${esc(faviconUrl)}" alt="">
        <span class="tab-title">${esc(tab.title)}</span>
        <input type="checkbox" class="tab-checkbox" ${isChecked ? 'checked' : ''}>
        <span class="tab-url" title="${esc(tab.url)}">${esc(domain || tab.url)}</span>
      `;
    } else {
      card.innerHTML = `
        <img class="tab-favicon" src="${esc(faviconUrl)}" alt="">
        <span class="tab-title">${esc(tab.title)}</span>
        <button class="tab-remove" title="${t('more')}">···</button>
        <span class="tab-url" title="${esc(tab.url)}">${esc(domain || tab.url)}</span>
      `;
    }

    // Fallback favicon on error (no inline handler for CSP)
    const img = card.querySelector('.tab-favicon');
    img.addEventListener('error', () => {
      img.src = getFaviconUrl();
    }, { once: true });

    if (selectMode) {
      // Click toggles checkbox
      card.addEventListener('click', (e) => {
        e.preventDefault();
        if (isChecked) {
          selectedTabs.delete(tabKey);
        } else {
          selectedTabs.set(tabKey, { spaceId, groupId, tabId: tab.id });
        }
        renderGroups();
        updateSelectActions();
      });
    } else {
      // Long press (2s) → enter select mode and select this tab
      let longPressTimer = null;
      card.addEventListener('mousedown', () => {
        longPressTimer = setTimeout(() => {
          longPressTimer = null;
          selectMode = true;
          selectedTabs.clear();
          selectedTabs.set(tabKey, { spaceId, groupId, tabId: tab.id });
          $selectTabsBtn.textContent = t('cancelSelect');
          $addCollectionBtn.hidden = true;
          updateSelectActions();
          renderGroups();
        }, 2000);
      });
      card.addEventListener('mouseup', () => { if (longPressTimer) clearTimeout(longPressTimer); });
      card.addEventListener('mouseleave', () => { if (longPressTimer) clearTimeout(longPressTimer); });
      card.addEventListener('dragstart', () => { if (longPressTimer) clearTimeout(longPressTimer); });

      // Drag card between groups
      card.addEventListener('dragstart', (e) => {
        dragSource = { type: 'card', spaceId, groupId, tabId: tab.id, tabData: { title: tab.title, url: tab.url, favIconUrl: faviconUrl } };
        e.dataTransfer.setData('application/json', JSON.stringify(dragSource.tabData));
        e.dataTransfer.effectAllowed = 'move';
        card.classList.add('dragging');
      });
      card.addEventListener('dragend', () => { card.classList.remove('dragging'); dragSource = null; });

      // Click → open
      card.addEventListener('click', (e) => {
        if (e.target.closest('.tab-remove')) return;
        openUrl(tab.url, e.metaKey || e.ctrlKey);
      });

      // Tab menu (···)
      card.querySelector('.tab-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        showTabContextMenu(e, spaceId, groupId, tab);
      });
    }

    return card;
  }

  // ═══ Select Mode Helpers ═══

  function exitSelectMode() {
    if (!selectMode) return;
    if (selectedTabs.size >= 3 && !confirm(t('confirmExitSelect'))) return;
    selectMode = false;
    selectedTabs.clear();
    $selectTabsBtn.textContent = t('selectTabs');
    $addCollectionBtn.hidden = false;
    updateSelectActions();
    renderGroups();
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (selectMode) {
        exitSelectMode();
      } else if (!$backupOverlay.hidden) {
        closeBackup();
      } else if (!$settingsOverlay.hidden) {
        closeSettings();
      } else if (!$aboutOverlay.hidden) {
        $aboutOverlay.hidden = true;
      } else if (!$emojiPickerOverlay.hidden) {
        hideEmojiPicker();
      } else if (!$modalOverlay.hidden) {
        hideModal();
      }
    }
  });

  function updateSelectActions() {
    $selectActions.hidden = !selectMode || selectedTabs.size === 0;
    $selectCreateGroupBtn.textContent = t('createGroup');
    $selectDeleteBtn.textContent = t('batchDelete');
    $selectMoveBtn.textContent = t('moveCollection');
  }

  function showSelectMoveMenu(anchorEl) {
    const otherSpaces = data.space_list.filter(s => s.id !== activeSpaceId);
    if (otherSpaces.length === 0) return;

    $collDropMenu.innerHTML = '';
    otherSpaces.forEach(sp => {
      const btn = document.createElement('button');
      btn.className = 'context-menu-item';
      const spaceInfo = data.space_list.find(s => s.id === sp.id);
      btn.textContent = spaceInfo?.icon && !spaceInfo.icon.startsWith('http') ? `${spaceInfo.icon} ${sp.name}` : sp.name;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showSelectCopyMoveMenu(sp.id);
      });
      $collDropMenu.appendChild(btn);
    });

    const rect = anchorEl.getBoundingClientRect();
    $collDropMenu.style.left = rect.left + 'px';
    $collDropMenu.style.top = (rect.bottom + 4) + 'px';
    $collDropMenu.hidden = false;

    requestAnimationFrame(() => {
      const mr = $collDropMenu.getBoundingClientRect();
      if (mr.right > window.innerWidth) $collDropMenu.style.left = (window.innerWidth - mr.width - 8) + 'px';
      if (mr.bottom > window.innerHeight) $collDropMenu.style.top = (rect.top - mr.height - 4) + 'px';
    });
  }

  function showSelectCopyMoveMenu(toSpaceId) {
    $collDropMenu.innerHTML = '';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'context-menu-item';
    copyBtn.innerHTML = menuIcon('copy') + t('copyCollection');
    copyBtn.addEventListener('click', () => {
      $collDropMenu.hidden = true;
      execSelectCopyMove('copy', toSpaceId);
    });

    const moveBtn = document.createElement('button');
    moveBtn.className = 'context-menu-item';
    moveBtn.innerHTML = menuIcon('move') + t('moveCollection');
    moveBtn.addEventListener('click', () => {
      $collDropMenu.hidden = true;
      execSelectCopyMove('move', toSpaceId);
    });

    $collDropMenu.appendChild(copyBtn);
    $collDropMenu.appendChild(moveBtn);
  }

  async function execSelectCopyMove(action, toSpaceId) {
    if (selectedTabs.size === 0) return;
    const toSpace = data.spaces[toSpaceId];
    if (!toSpace) return;

    const now = new Date();
    const timestamp = now.toLocaleString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }).replace(',', ',');

    const newGroup = {
      id: StorageManager.generateGroupId(),
      name: timestamp,
      tabs: []
    };

    // Collect tabs
    for (const [, info] of selectedTabs) {
      const srcSpace = data.spaces[info.spaceId];
      if (!srcSpace) continue;
      const srcGroup = srcSpace.groups.find(g => g.id === info.groupId);
      if (!srcGroup) continue;
      const srcTab = srcGroup.tabs.find(t => t.id === info.tabId);
      if (!srcTab) continue;
      const cloned = JSON.parse(JSON.stringify(srcTab));
      cloned.id = StorageManager.generateUUID();
      newGroup.tabs.push(cloned);
    }

    toSpace.groups.unshift(newGroup);

    // If move, remove originals
    if (action === 'move') {
      for (const [, info] of selectedTabs) {
        const srcSpace = data.spaces[info.spaceId];
        if (!srcSpace) continue;
        const srcGroup = srcSpace.groups.find(g => g.id === info.groupId);
        if (!srcGroup) continue;
        srcGroup.tabs = srcGroup.tabs.filter(t => t.id !== info.tabId);
      }
      const spaceInfo = data.space_list.find(s => s.id === toSpaceId);
      showToast(t('movedTo', spaceInfo?.name || ''));
    } else {
      const spaceInfo = data.space_list.find(s => s.id === toSpaceId);
      showToast(t('copiedTo', spaceInfo?.name || ''));
    }

    selectedTabs.clear();
    selectMode = false;
    $selectTabsBtn.textContent = t('selectTabs');
    $addCollectionBtn.hidden = false;
    updateSelectActions();
    await saveAll();
    renderGroups();
  }

  // ═══ Space Picker Menu (for Move/Copy group) ═══

  const $collDropMenu = document.getElementById('collDropMenu');

  function showSpacePickerMenu(anchorEl, groupId, fromSpaceId) {
    const otherSpaces = data.space_list.filter(s => s.id !== fromSpaceId);
    if (otherSpaces.length === 0) return;

    $collDropMenu.innerHTML = '';
    otherSpaces.forEach(sp => {
      const btn = document.createElement('button');
      btn.className = 'context-menu-item';
      const spaceInfo = data.space_list.find(s => s.id === sp.id);
      btn.textContent = spaceInfo?.icon && !spaceInfo.icon.startsWith('http') ? `${spaceInfo.icon} ${sp.name}` : sp.name;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showCopyMoveMenu(groupId, fromSpaceId, sp.id);
      });
      $collDropMenu.appendChild(btn);
    });

    const rect = anchorEl.getBoundingClientRect();
    $collDropMenu.style.left = rect.left + 'px';
    $collDropMenu.style.top = (rect.bottom + 4) + 'px';
    $collDropMenu.hidden = false;

    requestAnimationFrame(() => {
      const mr = $collDropMenu.getBoundingClientRect();
      if (mr.right > window.innerWidth) $collDropMenu.style.left = (window.innerWidth - mr.width - 8) + 'px';
      if (mr.bottom > window.innerHeight) $collDropMenu.style.top = (rect.top - mr.height - 4) + 'px';
    });
  }

  function showCopyMoveMenu(groupId, fromSpaceId, toSpaceId) {
    $collDropMenu.innerHTML = '';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'context-menu-item';
    copyBtn.innerHTML = menuIcon('copy') + t('copyCollection');
    copyBtn.addEventListener('click', () => {
      $collDropMenu.hidden = true;
      execGroupCopyMove('copy', groupId, fromSpaceId, toSpaceId);
    });

    const moveBtn = document.createElement('button');
    moveBtn.className = 'context-menu-item';
    moveBtn.innerHTML = menuIcon('move') + t('moveCollection');
    moveBtn.addEventListener('click', () => {
      $collDropMenu.hidden = true;
      execGroupCopyMove('move', groupId, fromSpaceId, toSpaceId);
    });

    $collDropMenu.appendChild(copyBtn);
    $collDropMenu.appendChild(moveBtn);
  }

  async function execGroupCopyMove(action, groupId, fromSpaceId, toSpaceId) {
    const fromSpace = data.spaces[fromSpaceId];
    const toSpace = data.spaces[toSpaceId];
    if (!fromSpace || !toSpace) return;

    const groupIdx = fromSpace.groups.findIndex(g => g.id === groupId);
    if (groupIdx === -1) return;
    const group = fromSpace.groups[groupIdx];

    if (action === 'copy') {
      const newGroup = JSON.parse(JSON.stringify(group));
      newGroup.id = StorageManager.generateGroupId();
      newGroup.tabs.forEach(tab => {
        tab.id = StorageManager.generateUUID();
      });
      toSpace.groups.unshift(newGroup);
      await saveAll();
      const spaceInfo = data.space_list.find(s => s.id === toSpaceId);
      showToast(t('copiedTo', spaceInfo?.name || ''));
    } else {
      fromSpace.groups.splice(groupIdx, 1);
      toSpace.groups.unshift(group);
      await saveAll();
      const spaceInfo = data.space_list.find(s => s.id === toSpaceId);
      showToast(t('movedTo', spaceInfo?.name || ''));
    }

    renderSpaces();
    renderGroups();
  }

  document.addEventListener('click', (e) => {
    if (!$collDropMenu.hidden && !$collDropMenu.contains(e.target)) {
      $collDropMenu.hidden = true;
    }
  });

  // ═══ Render: Right Sidebar (Current Browser Tabs) ═══

  function renderCurrentTabs() {
    $currentTabsList.innerHTML = '';
    const list = searchQuery
      ? browserTabs.filter(t =>
          (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.url || '').toLowerCase().includes(searchQuery.toLowerCase()))
      : browserTabs;

    $currentTabsCount.textContent = t('tabsCount', browserTabs.length);
    $saveTabsBtn.style.display = browserTabs.length > 0 ? '' : 'none';

    list.forEach(tab => {
      const li = document.createElement('li');
      li.className = 'current-tab-item';
      li.draggable = true;

      const favicon = getFaviconUrl(tab.favIconUrl);
      li.innerHTML = `
        <img src="${esc(favicon)}" alt="">
        <span>${esc(tab.title || tab.url || t('untitled'))}</span>
        <button class="tab-close-btn" title="${t('closeTab')}">×</button>
      `;

      // Fallback: use default favicon
      li.querySelector('img').addEventListener('error', function () { this.src = getFaviconUrl(); }, { once: true });

      // Close button
      li.querySelector('.tab-close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        try {
          chrome.tabs.remove(tab.id, () => {
            browserTabs = browserTabs.filter(t => t.id !== tab.id);
            renderCurrentTabs();
          });
        } catch {}
      });

      li.addEventListener('click', (e) => {
        if (e.target.closest('.tab-close-btn')) return;
        try {
          chrome.tabs.update(tab.id, { active: true });
          chrome.windows.update(tab.windowId, { focused: true });
        } catch {}
      });

      li.addEventListener('dragstart', (e) => {
        dragSource = { type: 'browser', browserTabId: tab.id, tabData: { title: tab.title || '', url: tab.url || '', favIconUrl: tab.favIconUrl || '' } };
        e.dataTransfer.setData('application/json', JSON.stringify(dragSource.tabData));
        e.dataTransfer.effectAllowed = 'copy';
      });
      li.addEventListener('dragend', () => { dragSource = null; });

      $currentTabsList.appendChild(li);
    });
  }

  // ═══ Drop Handler ═══

  function handleDrop(e, targetSpaceId, targetGroupId) {
    let dropData;
    try { dropData = JSON.parse(e.dataTransfer.getData('application/json')); } catch { return; }
    if (!dropData || !dropData.url) return;

    const space = data.spaces[targetSpaceId];
    if (!space) return;
    const targetGroup = space.groups.find(g => g.id === targetGroupId);
    if (!targetGroup) return;

    if (dragSource && dragSource.type === 'card') {
      if (dragSource.groupId === targetGroupId) return;
      if (targetGroup.tabs.some(t => t.url === dropData.url)) { showToast(t('tabAlreadyExists')); return; }

      const srcSpace = data.spaces[dragSource.spaceId];
      if (srcSpace) {
        const srcGroup = srcSpace.groups.find(g => g.id === dragSource.groupId);
        if (srcGroup) srcGroup.tabs = srcGroup.tabs.filter(t => t.id !== dragSource.tabId);
      }

      targetGroup.tabs.push(makeTab(dropData));
      renderGroups();
      saveAll();
      showToast(t('movedTo', targetGroup.name));
      return;
    }

    if (targetGroup.tabs.some(t => t.url === dropData.url)) { showToast(t('tabAlreadyExists')); return; }

    // Browser tab drop → show copy/move menu
    const browserTabId = dragSource && dragSource.type === 'browser' ? dragSource.browserTabId : null;
    showBrowserTabDropMenu(e, dropData, targetGroup, targetGroupId, browserTabId);
  }

  function showBrowserTabDropMenu(e, dropData, targetGroup, targetGroupId, browserTabId) {
    // Immediately show the tab in the group as a preview
    const previewTab = makeTab(dropData);
    targetGroup.tabs.push(previewTab);
    renderGroups();

    $collDropMenu.innerHTML = '';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'context-menu-item';
    copyBtn.innerHTML = menuIcon('copy') + t('copyCollection');
    copyBtn.addEventListener('click', async () => {
      $collDropMenu.hidden = true;
      await saveAll();
      showToast(t('addedTo', targetGroup.name));
    });

    const moveBtn = document.createElement('button');
    moveBtn.className = 'context-menu-item';
    moveBtn.innerHTML = menuIcon('move') + t('moveCollection');
    moveBtn.addEventListener('click', async () => {
      $collDropMenu.hidden = true;
      await saveAll();
      showToast(t('movedTo', targetGroup.name));
      if (browserTabId) {
        try { await chrome.tabs.remove(browserTabId); } catch {}
      }
    });

    // Cancel — remove the preview tab
    const cancelHandler = (ev) => {
      if (!$collDropMenu.hidden && !$collDropMenu.contains(ev.target)) {
        $collDropMenu.hidden = true;
        targetGroup.tabs = targetGroup.tabs.filter(t => t.id !== previewTab.id);
        renderGroups();
        document.removeEventListener('click', cancelHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', cancelHandler), 0);

    $collDropMenu.appendChild(copyBtn);
    $collDropMenu.appendChild(moveBtn);

    $collDropMenu.style.left = e.clientX + 'px';
    $collDropMenu.style.top = e.clientY + 'px';
    $collDropMenu.hidden = false;

    requestAnimationFrame(() => {
      const mr = $collDropMenu.getBoundingClientRect();
      if (mr.right > window.innerWidth) $collDropMenu.style.left = (window.innerWidth - mr.width - 8) + 'px';
      if (mr.bottom > window.innerHeight) $collDropMenu.style.top = (window.innerHeight - mr.height - 8) + 'px';
    });
  }

  function makeTab(data) {
    return {
      id: StorageManager.generateUUID(),
      title: data.title || '',
      url: data.url || '',
      favIconUrl: data.favIconUrl || data.favicon || '',
      kind: 'record'
    };
  }

  // ═══ Event Binding ═══

  function bindEvents() {
    // ── Space Add Menu ──
    $addSpaceBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideAllMenus();
      if (!$spaceAddMenu.hidden) {
        $spaceAddMenu.hidden = true;
        return;
      }
      setMenuItemText($spaceAddMenu.querySelector('[data-action="create-space"]'), t('createSpace'));
      setMenuItemText($spaceAddMenu.querySelector('[data-action="import-space"]'), t('importSpace'));
      setMenuItemText($spaceAddMenu.querySelector('[data-action="import-bookmarks"]'), t('importBookmarks'));
      const btnRect = e.target.getBoundingClientRect();
      $spaceAddMenu.style.left = btnRect.right + 4 + 'px';
      $spaceAddMenu.style.top = btnRect.top + 'px';
      $spaceAddMenu.hidden = false;
    });

    $spaceAddMenu.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      $spaceAddMenu.hidden = true;
      if (!action) return;

      if (action === 'create-space') {
        showModal(t('modalNewSpace'), '', async (name) => {
          if (!name.trim()) return;
          await StorageManager.createSpace(name.trim(), randomEmoji());
          data = await StorageManager.getData();
          const newSpace = data.space_list[data.space_list.length - 1];
          switchSpace(newSpace.id);
        });
      } else if (action === 'import-space') {
        $spaceJsonFileInput.click();
      } else if (action === 'import-bookmarks') {
        $bookmarkFileInput.click();
      }
    });

    document.addEventListener('click', hideAllMenus);

    // Import Space JSON (backup format)
    $spaceJsonFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      $spaceJsonFileInput.value = '';
      
      try {
        $progressTitle.textContent = t('importing');
        $progressBarFill.style.width = '0%';
        $progressText.textContent = '0%';
        $progressOverlay.hidden = false;

        const text = await file.text();
        const backupData = JSON.parse(text);
        
        await StorageManager.importFromBackup(backupData);
        data = await StorageManager.getData();
        
        $progressOverlay.hidden = true;
        showToast(t('importedSuccess'));
        
        if (data.space_list.length > 0) {
          switchSpace(data.space_list[0].id);
        }
      } catch (err) {
        $progressOverlay.hidden = true;
        console.error(err);
        showToast(t('importFailed'));
      }
    });

    // Import Chrome Bookmarks HTML
    $bookmarkFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      $bookmarkFileInput.value = '';
      
      try {
        const text = await file.text();
        const spaceName = file.name.replace(/\.(html?|htm)$/i, '');
        await StorageManager.createSpace(spaceName, randomEmoji());
        data = await StorageManager.getData();
        const newSpace = data.space_list[data.space_list.length - 1];

        // Parse bookmark HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const dlList = doc.querySelectorAll('DL > DT');

        function parseDT(dtEl) {
          const h3 = dtEl.querySelector(':scope > H3');
          const dl = dtEl.querySelector(':scope > DL');
          if (h3 && dl) {
            const folderName = h3.textContent.trim() || t('untitled');
            const links = dl.querySelectorAll(':scope > DT > A');
            const subFolders = dl.querySelectorAll(':scope > DT');

            const tabs = [];
            for (const a of links) {
              tabs.push({
                title: a.textContent.trim(),
                url: a.getAttribute('HREF') || '',
                favIconUrl: a.getAttribute('ICON') || ''
              });
            }

            if (tabs.length > 0) {
              return { name: folderName, tabs };
            }

            const groups = [];
            for (const subDt of subFolders) {
              const result = parseDT(subDt);
              if (result) groups.push(result);
            }
            return groups.length > 0 ? groups : null;
          }
          return null;
        }

        const groups = [];
        for (const dt of dlList) {
          const result = parseDT(dt);
          if (result) {
            if (Array.isArray(result)) {
              groups.push(...result);
            } else {
              groups.push(result);
            }
          }
        }

        // Flatten nested arrays
        function flatGroups(arr) {
          const flat = [];
          for (const item of arr) {
            if (Array.isArray(item)) {
              flat.push(...flatGroups(item));
            } else if (item && item.name) {
              flat.push(item);
            }
          }
          return flat;
        }

        const flatGroupsList = flatGroups(groups);

        $progressTitle.textContent = t('importing');
        $progressBarFill.style.width = '0%';
        $progressText.textContent = '0%';
        $progressOverlay.hidden = false;

        let totalTabs = 0;
        for (const g of flatGroupsList) totalTabs += g.tabs.filter(tab => tab.url).length;
        let done = 0;

        for (const g of [...flatGroupsList].reverse()) {
          const newGroup = {
            id: StorageManager.generateGroupId(),
            name: g.name,
            tabs: []
          };
          for (const tab of g.tabs) {
            if (tab.url) {
              newGroup.tabs.push({
                id: StorageManager.generateUUID(),
                title: tab.title || '',
                url: tab.url,
                favIconUrl: tab.favIconUrl || '',
                kind: 'record'
              });
              done++;
            }
          }
          if (newGroup.tabs.length > 0) {
            data.spaces[newSpace.id].groups.push(newGroup);
          }
          const pct = Math.round((done / totalTabs) * 100);
          $progressBarFill.style.width = pct + '%';
          $progressText.textContent = `${done} / ${totalTabs} (${pct}%)`;
          await new Promise(r => setTimeout(r, 0));
        }

        await StorageManager.saveData(data);
        $progressOverlay.hidden = true;
        switchSpace(newSpace.id);
        showToast(t('importedCollections', flatGroupsList.length));
      } catch (err) {
        $progressOverlay.hidden = true;
        console.error(err);
        showToast(t('importFailed'));
      }
    });

    $addCollectionBtn.addEventListener('click', () => {
      if (!activeSpaceId) return;
      const now = new Date();
      const timestamp = now.toLocaleString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      }).replace(',', ',');
      showModal(t('modalNewCollection'), timestamp, async (name) => {
        if (!name.trim()) return;
        await StorageManager.addGroup(activeSpaceId, name.trim());
        data = await StorageManager.getData();
        renderGroups();
      });
    });

    // ── Select Mode ──
    $selectTabsBtn.addEventListener('click', () => {
      if (selectMode) {
        exitSelectMode();
      } else {
        selectMode = true;
        selectedTabs.clear();
        $selectTabsBtn.textContent = t('cancelSelect');
        $addCollectionBtn.hidden = true;
        updateSelectActions();
        renderGroups();
      }
    });

    $selectCreateGroupBtn.addEventListener('click', async () => {
      if (selectedTabs.size === 0) return;
      const space = data.spaces[activeSpaceId];
      if (!space) return;
      
      const now = new Date();
      const timestamp = now.toLocaleString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      }).replace(',', ',');
      
      const newGroup = {
        id: StorageManager.generateGroupId(),
        name: timestamp,
        tabs: []
      };
      
      for (const [, info] of selectedTabs) {
        const srcGroup = space.groups.find(g => g.id === info.groupId);
        if (!srcGroup) continue;
        const tabIdx = srcGroup.tabs.findIndex(t => t.id === info.tabId);
        if (tabIdx === -1) continue;
        const [tab] = srcGroup.tabs.splice(tabIdx, 1);
        tab.id = StorageManager.generateUUID();
        newGroup.tabs.push(tab);
      }
      
      space.groups.unshift(newGroup);
      selectedTabs.clear();
      selectMode = false;
      $selectTabsBtn.textContent = t('selectTabs');
      $addCollectionBtn.hidden = false;
      updateSelectActions();
      await saveAll();
      renderGroups();
    });

    $selectDeleteBtn.addEventListener('click', async () => {
      if (selectedTabs.size === 0) return;
      const space = data.spaces[activeSpaceId];
      if (!space) return;
      for (const [, info] of selectedTabs) {
        const group = space.groups.find(g => g.id === info.groupId);
        if (!group) continue;
        group.tabs = group.tabs.filter(t => t.id !== info.tabId);
      }
      selectedTabs.clear();
      updateSelectActions();
      await saveAll();
      renderGroups();
    });

    $selectMoveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectedTabs.size === 0) return;
      showSelectMoveMenu(e.target);
    });

    $searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderGroups();
      renderCurrentTabs();
    });

    // Space ... menu
    $spacesList.addEventListener('click', (e) => {
      const btn = e.target.closest('.space-menu-btn');
      if (!btn) return;
      e.stopPropagation();
      showContextMenu(e, btn.dataset.id);
    });

    // Context menu actions
    $contextMenu.addEventListener('click', async (e) => {
      const action = e.target.dataset.action;
      const spaceId = $contextMenu.dataset.spaceId;
      hideContextMenu();
      if (!action || !spaceId) return;

      const space = data.spaces[spaceId];
      const spaceInfo = data.space_list.find(s => s.id === spaceId);
      if (!space) return;

      if (action === 'rename') {
        showModal(t('modalEditSpaceName'), space.name, async (newName) => {
          if (newName.trim()) {
            space.name = newName.trim();
            if (spaceInfo) spaceInfo.name = newName.trim();
            await saveAll();
            renderSpaces();
            renderGroups();
          }
        });
      } else if (action === 'delete') {
        if (confirm(t('confirmDeleteSpace', space.name))) {
          delete data.spaces[spaceId];
          data.space_list = data.space_list.filter(s => s.id !== spaceId);
          if (activeSpaceId === spaceId) {
            activeSpaceId = data.space_list[0] ? data.space_list[0].id : null;
          }
          await saveAll();
          renderSpaces();
          renderGroups();
        }
      } else if (action === 'import-json') {
        pendingImportSpaceId = spaceId;
        $jsonFileInput.click();
      } else if (action === 'export-json') {
        $progressTitle.textContent = t('exporting');
        $progressBarFill.style.width = '0%';
        $progressText.textContent = '0%';
        $progressOverlay.hidden = false;

        const exportData = await StorageManager.exportToBackup();
        
        // If only exporting one space, filter it
        const singleSpaceData = {
          version: Date.now(),
          space_list: data.space_list.filter(s => s.id === spaceId),
          spaces: { [spaceId]: data.spaces[spaceId] }
        };

        const blob = new Blob([JSON.stringify(singleSpaceData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${space.name}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        
        $progressBarFill.style.width = '100%';
        $progressText.textContent = '100%';
        setTimeout(() => {
          $progressOverlay.hidden = true;
          showToast(t('exportedSuccess'));
        }, 500);
      } else if (action === 'change-icon') {
        showEmojiPicker((emoji) => {
          if (spaceInfo) {
            spaceInfo.icon = emoji;
            saveAll();
            renderSpaces();
          }
        });
      }
    });

    document.addEventListener('click', hideAllMenus);

    // Right sidebar toggle
    $sidebarToggle.addEventListener('click', () => {
      document.querySelector('.app').classList.toggle('sidebar-right-hidden');
    });

    // Left sidebar toggle
    $sidebarLeftToggle.addEventListener('click', () => {
      document.querySelector('.app').classList.toggle('sidebar-left-collapsed');
    });

    // Save all tabs to current space
    $saveTabsBtn.addEventListener('click', async () => {
      if (!activeSpaceId || browserTabs.length === 0) return;

      const now = new Date();
      const timestamp = now.toLocaleString('en-US', {
        month: '2-digit', day: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
      }).replace(',', ',');

      const newGroup = {
        id: StorageManager.generateGroupId(),
        name: timestamp,
        tabs: browserTabs.map(tab => ({
          id: StorageManager.generateUUID(),
          title: tab.title || '',
          url: tab.url || '',
          favIconUrl: tab.favIconUrl || '',
          kind: 'record'
        }))
      };

      const space = data.spaces[activeSpaceId];
      if (space) {
        space.groups.unshift(newGroup);
        await saveAll();
        renderGroups();
      }

      const currentTab = await new Promise(resolve => {
        chrome.tabs.getCurrent((t) => resolve(t));
      });
      const tabsToClose = browserTabs.filter(t => t.id !== (currentTab && currentTab.id));
      const idsToClose = tabsToClose.map(t => t.id);
      if (idsToClose.length > 0) {
        try { await chrome.tabs.remove(idsToClose); } catch {}
      }

      await loadBrowserTabs();
      renderCurrentTabs();
      showToast(t('savedTabs', tabsToClose.length));
    });
  }

  // ═══ Tab Context Menu ═══

  let tabMenuTarget = null;

  function showTabContextMenu(e, spaceId, groupId, tab) {
    hideAllMenus();
    if (!$tabContextMenu.hidden) {
      hideTabContextMenu();
      return;
    }
    tabMenuTarget = { spaceId, groupId, tab };
    $tabContextMenu.hidden = false;
    const rect = e.target.getBoundingClientRect();
    $tabContextMenu.style.top = rect.bottom + 4 + 'px';
    $tabContextMenu.style.left = rect.left + 'px';
  }

  function hideTabContextMenu() {
    $tabContextMenu.hidden = true;
    tabMenuTarget = null;
  }

  $tabContextMenu.addEventListener('click', async (e) => {
    const action = e.target.dataset.action;
    const target = tabMenuTarget;
    hideTabContextMenu();
    if (!action || !target) return;

    const space = data.spaces[target.spaceId];
    if (!space) return;
    const group = space.groups.find(g => g.id === target.groupId);
    if (!group) return;
    const tt = group.tabs.find(x => x.id === target.tab.id);
    if (!tt) return;

    if (action === 'tab-rename') {
      showModal(t('modalRenameTab'), tt.title, (newName) => {
        if (newName.trim()) {
          tt.title = newName.trim();
          renderGroups();
          saveAll();
        }
      });
    } else if (action === 'tab-edit-url') {
      showModal(t('modalEditUrl'), tt.url, (newUrl) => {
        if (newUrl.trim()) {
          tt.url = newUrl.trim();
          renderGroups();
          saveAll();
        }
      });
    } else if (action === 'tab-delete') {
      group.tabs = group.tabs.filter(x => x.id !== target.tab.id);
      renderGroups();
      saveAll();
    }
  });

  // ═══ Emoji Picker ═══

  let emojiCallback = null;

  function showEmojiPicker(callback) {
    emojiCallback = callback;
    $emojiPickerGrid.innerHTML = '';
    EMOJIS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.addEventListener('click', () => {
        const cb = emojiCallback;
        hideEmojiPicker();
        if (cb) cb(emoji);
      });
      $emojiPickerGrid.appendChild(btn);
    });
    $emojiPickerOverlay.hidden = false;
  }

  function hideEmojiPicker() {
    $emojiPickerOverlay.hidden = true;
    emojiCallback = null;
  }

  $emojiPickerClose.addEventListener('click', hideEmojiPicker);
  $emojiPickerOverlay.addEventListener('click', (e) => {
    if (e.target === $emojiPickerOverlay) hideEmojiPicker();
  });

  // ═══ Settings ═══

  let currentSettings = null;

  async function openSettings() {
    currentSettings = await StorageManager.getSettings();
    document.getElementById('settingLanguage').value = currentSettings.language || 'en';
    // Mark active theme swatch (migrate old values)
    let theme = currentSettings.theme || 'zinc';
    if (theme === 'dark' || theme === 'system') theme = 'zinc';
    else if (theme === 'light') theme = 'snow';
    currentSettings.theme = theme;
    $themeSwatches.querySelectorAll('.theme-swatch').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    document.getElementById('settingOpenTabMode').value = currentSettings.openTabMode || 'redirect';
    // Mark active tab style option
    const style = currentSettings.tabStyle || 'vertical';
    $tabStyleOptions.querySelectorAll('.tab-style-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.style === style);
    });
    $settingsOverlay.hidden = false;
  }

  function closeSettings() {
    $settingsOverlay.hidden = true;
  }

  async function onSettingChange() {
    if (!currentSettings) return;
    currentSettings.language = document.getElementById('settingLanguage').value;
    currentSettings.openTabMode = document.getElementById('settingOpenTabMode').value;
    await StorageManager.saveSettings(currentSettings);
    applyTheme(currentSettings.theme);

    I18N.setLang(currentSettings.language);
    applyLanguage();
    renderSpaces();
    renderGroups();
    renderCurrentTabs();
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    // Migrate old theme values
    const migrated = theme === 'dark' || theme === 'system' ? 'zinc' : theme === 'light' ? 'snow' : theme;
    const vars = THEMES[migrated] || THEMES.zinc;
    for (const [prop, value] of Object.entries(vars)) {
      root.style.setProperty(prop, value);
    }
  }

  // ═══ Preference Menu ═══

  $settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hideAllMenus();
    $prefMenu.hidden = !$prefMenu.hidden;
  });

  $prefMenu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    $prefMenu.hidden = true;
    if (action === 'settings') {
      openSettings();
    } else if (action === 'backup') {
      openBackup();
    } else if (action === 'about') {
      openAbout();
    }
  });

  document.addEventListener('click', hideAllMenus);

  $settingsClose.addEventListener('click', closeSettings);
  $settingsOverlay.addEventListener('click', (e) => {
    if (e.target === $settingsOverlay) closeSettings();
  });

  // ═══ About ═══

  function openAbout() {
    $aboutBody.innerHTML = `
      <h3>${t('aboutTagTag')}</h3>
      <p class="about-version">${t('aboutVersion')}</p>
      <p class="about-desc">${t('aboutDesc')}</p>
      <h4>${t('aboutInfoTitle')}</h4>
      <ul>
        <li>${t('aboutInfo1')}</li>
        <li>${t('aboutInfo2')}</li>
        <li>${t('aboutInfo3')}</li>
      </ul>
      <h4>${t('aboutContact')}</h4>
      <p>${t('aboutWeibo')}: <a href="https://weibo.com/u/1096688584" target="_blank">https://weibo.com/u/1096688584</a></p>
    `;
    $aboutOverlay.hidden = false;
  }

  $aboutClose.addEventListener('click', () => { $aboutOverlay.hidden = true; });
  $aboutOverlay.addEventListener('click', (e) => {
    if (e.target === $aboutOverlay) $aboutOverlay.hidden = true;
  });

  // ═══ Backup & Sync ═══

  async function openBackup() {
    hideAllMenus();
    await updateBackupStats();
    await loadWebDAVSettings();
    applyBackupLanguage();
    $backupOverlay.hidden = false;
  }

  // Apply i18n to backup panel
  function applyBackupLanguage() {
    // Header
    const backupHeader = document.querySelector('.backup-panel .settings-header h2');
    if (backupHeader) backupHeader.textContent = t('backupTitle');
    
    // Info text
    const versionLabel = t('currentDataVersion');
    const modifiedLabel = t('lastModified');
    const versionEl = document.querySelector('.backup-version');
    if (versionEl) {
      const versionSpan = document.getElementById('backupVersion');
      const modifiedSpan = document.getElementById('backupModified');
      versionEl.innerHTML =
        `${versionLabel}: <span id="backupVersion">${versionSpan ? versionSpan.textContent : '-'}</span>, ${modifiedLabel}: <span id="backupModified">${modifiedSpan ? modifiedSpan.textContent : '-'}</span>`;
    }
    
    // Stats labels
    const statLabels = document.querySelectorAll('.stat-label');
    if (statLabels[0]) statLabels[0].textContent = t('spacesCount');
    if (statLabels[1]) statLabels[1].textContent = t('groupsCount');
    if (statLabels[2]) statLabels[2].textContent = t('tabsStatCount');
    
    // Offline Sync section
    const backupSections = document.querySelectorAll('.backup-section h3');
    if (backupSections[0]) backupSections[0].textContent = t('offlineSync');
    
    const exportBtn = document.getElementById('backupExportBtn');
    if (exportBtn) {
      exportBtn.innerHTML = `
        <svg viewBox="0 0 16 16" fill="none"><path d="M8 10V2M5 5l3-3 3 3M3 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${t('exportData')}
      `;
    }
    
    const importBtn = document.getElementById('backupImportBtn');
    if (importBtn) {
      importBtn.innerHTML = `
        <svg viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${t('importData')}
      `;
    }
    
    // Remote Sync section
    if (backupSections[1]) backupSections[1].textContent = t('remoteSync');
    
    // GitHub Gist
    const githubTitle = document.querySelector('.sync-option:first-child .sync-title span:first-child');
    if (githubTitle) githubTitle.textContent = t('githubGistSync');
    
    // WebDAV
    const webdavTitle = document.querySelector('.sync-option:last-child .sync-title span:first-child');
    if (webdavTitle) webdavTitle.textContent = t('webdavSync');
    
    const webdavFeature = document.querySelector('.badge.feature');
    if (webdavFeature) webdavFeature.textContent = t('webdavFeature');
    
    // WebDAV config labels
    const syncFields = document.querySelectorAll('.sync-field');
    if (syncFields[0]) {
      const label = syncFields[0].querySelector('label');
      if (label) label.textContent = t('webdavUrl');
    }
    if (syncFields[1]) {
      const label = syncFields[1].querySelector('label');
      if (label) label.textContent = t('webdavUsername');
    }
    if (syncFields[2]) {
      const label = syncFields[2].querySelector('label');
      if (label) label.textContent = t('webdavPassword');
    }
    if (syncFields[3]) {
      const label = syncFields[3].querySelector('label');
      if (label) label.textContent = t('testConnect');
    }
    if (syncFields[4]) {
      const label = syncFields[4].querySelector('label');
      if (label) label.textContent = t('syncDirection');
    }
    if (syncFields[5]) {
      const label = syncFields[5].querySelector('label:first-child');
      if (label) label.textContent = t('autoSync');
    }

    const testBtn = document.getElementById('webdavTestBtn');
    if (testBtn) {
      testBtn.innerHTML = `
        <svg viewBox="0 0 16 16" fill="none"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${t('testConnect')}
      `;
    }
    
    // Sync buttons
    const uploadBtn = document.getElementById('syncUploadBtn');
    if (uploadBtn) {
      uploadBtn.innerHTML = `
        <svg viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 5l3-3 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${t('localToRemote')}
      `;
    }
    
    const downloadBtn = document.getElementById('syncDownloadBtn');
    if (downloadBtn) {
      downloadBtn.innerHTML = `
        <svg viewBox="0 0 16 16" fill="none"><path d="M8 14V6M5 11l3 3 3-3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        ${t('remoteToLocal')}
      `;
    }
  }

  function closeBackup() {
    $backupOverlay.hidden = true;
  }

  async function updateBackupStats() {
    const data = await StorageManager.getData();
    
    // Update version and modified time
    $backupVersion.textContent = data.version || '-';
    const modifiedDate = data.version ? new Date(data.version).toLocaleString() : '-';
    $backupModified.textContent = modifiedDate;
    
    // Calculate stats
    let spaceCount = data.space_list?.length || 0;
    let groupCount = 0;
    let tabCount = 0;
    
    for (const space of Object.values(data.spaces || {})) {
      const groups = space.groups || [];
      groupCount += groups.length;
      for (const group of groups) {
        tabCount += (group.tabs || []).length;
      }
    }
    
    $statSpaces.textContent = spaceCount;
    $statGroups.textContent = groupCount;
    $statTabs.textContent = tabCount;
  }

  // ── Export / Import ──

  async function exportBackup() {
    const backupData = await StorageManager.exportToBackup();
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tagtag_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast(t('exportedSuccess'));
  }

  async function importBackup(file) {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Check if local data exists
      const localData = await StorageManager.getData();
      const hasLocalData = localData.space_list && localData.space_list.length > 0;
      
      if (hasLocalData) {
        // Show merge/overwrite dialog
        showImportModeDialog(async (mode) => {
          if (mode === 'cancel') return;
          
          $progressTitle.textContent = t('importing');
          $progressBarFill.style.width = '0%';
          $progressText.textContent = '0%';
          $progressOverlay.hidden = false;
          
          try {
            if (mode === 'overwrite') {
              // Overwrite: clear local data and import
              await StorageManager.importFromBackup(backupData);
            } else if (mode === 'merge') {
              // Merge: add imported spaces to existing data
              await StorageManager.mergeFromBackup(backupData);
            }
            
            data = await StorageManager.getData();
            
            $progressOverlay.hidden = true;
            showToast(t('importedSuccess'));
            
            // Refresh UI
            await updateBackupStats();
            renderSpaces();
            renderGroups();
            
            if (data.space_list.length > 0) {
              switchSpace(data.space_list[0].id);
            }
            closeBackup();
          } catch (err) {
            $progressOverlay.hidden = true;
            console.error(err);
            showToast(t('importFailed'));
          }
        });
      } else {
        // No local data, direct import
        $progressTitle.textContent = t('importing');
        $progressBarFill.style.width = '0%';
        $progressText.textContent = '0%';
        $progressOverlay.hidden = false;
        
        await StorageManager.importFromBackup(backupData);
        data = await StorageManager.getData();
        
        $progressOverlay.hidden = true;
        showToast(t('importedSuccess'));
        
        // Refresh UI
        await updateBackupStats();
        renderSpaces();
        renderGroups();
        
        if (data.space_list.length > 0) {
          switchSpace(data.space_list[0].id);
        }
        closeBackup();
      }
    } catch (err) {
      $progressOverlay.hidden = true;
      console.error(err);
      showToast(t('importFailed'));
    }
  }

  // Show import mode selection dialog
  function showImportModeDialog(callback) {
    const dialogHtml = `
      <div class="modal-overlay" id="importModeDialog" style="z-index: 3000;">
        <div class="modal" style="width: 420px;">
          <div class="modal-header">
            <h3>${t('importModeTitle') || 'Import Options'}</h3>
            <button class="btn-icon modal-close" id="importModeClose">&times;</button>
          </div>
          <div class="modal-body" style="padding: 20px;">
            <p style="margin-bottom: 20px; color: var(--text-secondary);">${t('importModeDesc') || 'Local data exists. Choose how to import:'}</p>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <button class="btn-secondary" id="importMergeBtn" style="justify-content: flex-start; padding: 12px; text-align: left;">
                <div style="font-weight: 600; margin-bottom: 4px;">📥 ${t('importMerge') || 'Merge'}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${t('importMergeDesc') || 'Add imported spaces to existing data'}</div>
              </button>
              <button class="btn-secondary" id="importOverwriteBtn" style="justify-content: flex-start; padding: 12px; text-align: left;">
                <div style="font-weight: 600; margin-bottom: 4px;">🔄 ${t('importOverwrite') || 'Overwrite'}</div>
                <div style="font-size: 12px; color: var(--text-muted);">${t('importOverwriteDesc') || 'Replace all local data with imported data'}</div>
              </button>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="importModeCancel">${t('cancel')}</button>
          </div>
        </div>
      </div>
    `;
    
    const dialogEl = document.createElement('div');
    dialogEl.innerHTML = dialogHtml;
    document.body.appendChild(dialogEl);
    
    const overlay = dialogEl.querySelector('#importModeDialog');
    
    function close() {
      dialogEl.remove();
    }
    
    dialogEl.querySelector('#importModeClose').addEventListener('click', () => {
      close();
      callback('cancel');
    });
    
    dialogEl.querySelector('#importModeCancel').addEventListener('click', () => {
      close();
      callback('cancel');
    });
    
    dialogEl.querySelector('#importMergeBtn').addEventListener('click', () => {
      close();
      callback('merge');
    });
    
    dialogEl.querySelector('#importOverwriteBtn').addEventListener('click', () => {
      close();
      callback('overwrite');
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        close();
        callback('cancel');
      }
    });
  }

  // ── WebDAV Sync ──

  const WEBDAV_SETTINGS_KEY = 'tagtag_webdav_settings';
  const WEBDAV_BACKUP_FILENAME = 'tagtag_backup.json';
  const WEBDAV_DEFAULT_SYNC_DIR = 'TagTag';
  const WEBDAV_OK_STATUSES = new Set([200, 201, 204, 207, 301, 302, 401, 403, 404, 405]);

  async function loadWebDAVSettings() {
    const settings = await chrome.storage.local.get(WEBDAV_SETTINGS_KEY);
    const webdavSettings = settings[WEBDAV_SETTINGS_KEY] || {};
    
    $webdavUrl.value = getNormalizedWebDAVDirectoryUrl(webdavSettings.url || 'https://dav.jianguoyun.com/dav/TagTag/');
    $webdavUsername.value = webdavSettings.username || '';
    $webdavPassword.value = webdavSettings.Password || '';
    $webdavToggle.checked = webdavSettings.enabled || false;
    $webdavAutoSync.checked = webdavSettings.autoSync || false;
    
    toggleWebDAVConfig(webdavSettings.enabled);
  }

  async function saveWebDAVSettings() {
    const settings = {
      url: getNormalizedWebDAVDirectoryUrl($webdavUrl.value),
      username: $webdavUsername.value.trim(),
      Password: $webdavPassword.value,
      enabled: $webdavToggle.checked,
      autoSync: $webdavAutoSync.checked
    };
    await chrome.storage.local.set({ [WEBDAV_SETTINGS_KEY]: settings });
  }

  function toggleWebDAVConfig(enabled) {
    if (enabled) {
      $webdavConfig.classList.add('active');
    } else {
      $webdavConfig.classList.remove('active');
    }
  }

  // WebDAV HTTP Basic Auth
  function getWebDAVAuthHeader(username, Password) {
    const credentials = btoa(`${username}:${Password}`);
    return `Basic ${credentials}`;
  }

  function normalizeWebDAVUrl(url) {
    const trimmed = (url || '').trim();
    if (!trimmed) return '';
    return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
  }

  function getNormalizedWebDAVDirectoryUrl(url) {
    const normalizedUrl = normalizeWebDAVUrl(url);
    if (!normalizedUrl) return '';

    const parsedUrl = new URL(normalizedUrl);
    const pathname = parsedUrl.pathname.endsWith('/') ? parsedUrl.pathname : `${parsedUrl.pathname}/`;

    if (pathname === '/dav/' || pathname === '/dav') {
      parsedUrl.pathname = `/dav/${WEBDAV_DEFAULT_SYNC_DIR}/`;
      return parsedUrl.toString();
    }

    parsedUrl.pathname = pathname;
    return parsedUrl.toString();
  }

  function getWebDAVSettingsFromForm() {
    return {
      url: getNormalizedWebDAVDirectoryUrl($webdavUrl.value),
      username: $webdavUsername.value.trim(),
      Password: $webdavPassword.value,
      enabled: $webdavToggle.checked,
      autoSync: $webdavAutoSync.checked
    };
  }

  function validateWebDAVSettings(webdavSettings) {
    if (!webdavSettings.url || !webdavSettings.username || !webdavSettings.Password) {
      throw new Error(t('webdavMissingConfig'));
    }
  }

  function getWebDAVDirectoryUrl(webdavSettings) {
    return getNormalizedWebDAVDirectoryUrl(webdavSettings.url);
  }

  function getWebDAVServiceUrl(webdavSettings) {
    const parsedUrl = new URL(getWebDAVDirectoryUrl(webdavSettings));
    const davIndex = parsedUrl.pathname.indexOf('/dav/');

    if (davIndex >= 0) {
      parsedUrl.pathname = parsedUrl.pathname.slice(0, davIndex + 5);
    } else {
      parsedUrl.pathname = '/';
    }

    parsedUrl.search = '';
    parsedUrl.hash = '';
    return parsedUrl.toString();
  }

  function getWebDAVFileUrl(webdavSettings, filename = WEBDAV_BACKUP_FILENAME) {
    return `${getWebDAVDirectoryUrl(webdavSettings)}${filename}`;
  }

  function getWebDAVHeaders(webdavSettings, extraHeaders = {}) {
    return {
      'Authorization': getWebDAVAuthHeader(webdavSettings.username, webdavSettings.Password),
      ...extraHeaders
    };
  }

  async function getStoredWebDAVSettings() {
    const settings = await chrome.storage.local.get(WEBDAV_SETTINGS_KEY);
    const webdavSettings = settings[WEBDAV_SETTINGS_KEY] || {};
    return {
      url: getNormalizedWebDAVDirectoryUrl(webdavSettings.url || 'https://dav.jianguoyun.com/dav/TagTag/'),
      username: (webdavSettings.username || '').trim(),
      Password: webdavSettings.Password || '',
      enabled: Boolean(webdavSettings.enabled),
      autoSync: Boolean(webdavSettings.autoSync)
    };
  }

  function suppressAutoSync(ms = 5000) {
    suppressAutoSyncUntil = Date.now() + ms;
  }

  function canRunAutoSync() {
    return Date.now() >= suppressAutoSyncUntil;
  }

  function webdavRequest(method, url, { headers = {}, body = null, timeout = 15000 } = {}) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.timeout = timeout;

      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      xhr.onload = () => {
        resolve({
          ok: xhr.status >= 200 && xhr.status < 300,
          status: xhr.status,
          statusText: xhr.statusText,
          text: xhr.responseText
        });
      };

      xhr.onerror = () => {
        reject(new Error('Network request failed'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Request timed out'));
      };

      xhr.send(body);
    });
  }

  async function probeWebDAVService(webdavSettings) {
    let response;

    try {
      response = await webdavRequest('OPTIONS', getWebDAVServiceUrl(webdavSettings), {
        headers: getWebDAVHeaders(webdavSettings)
      });
    } catch (err) {
      throw new Error(`${t('webdavServiceOffline')}: ${err.message}`);
    }

    if (!WEBDAV_OK_STATUSES.has(response.status)) {
      throw new Error(`${t('webdavServiceOffline')}: HTTP ${response.status}`);
    }

    return response;
  }

  async function ensureWebDAVDirectory(webdavSettings) {
    const directoryUrl = getWebDAVDirectoryUrl(webdavSettings);
    const headers = getWebDAVHeaders(webdavSettings, { 'Depth': '0' });

    const response = await webdavRequest('PROPFIND', directoryUrl, {
      headers
    });

    if (response.status === 207 || response.ok) {
      return { exists: true, created: false };
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(t('webdavAuthFailed'));
    }

    if (response.status !== 404) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const createResponse = await webdavRequest('MKCOL', directoryUrl, {
      headers: getWebDAVHeaders(webdavSettings)
    });

    if (createResponse.status === 201 || createResponse.status === 405 || createResponse.ok) {
      return { exists: false, created: true };
    }

    if (createResponse.status === 401 || createResponse.status === 403) {
      throw new Error(t('webdavAuthFailed'));
    }

    throw new Error(`HTTP ${createResponse.status}: ${createResponse.statusText}`);
  }

  async function exportBackupToTempFile() {
    const backupData = await StorageManager.exportToBackup();
    return JSON.stringify(backupData, null, 2);
  }

  async function uploadTempBackupFile(webdavSettings, tempFile) {
    const fileUrl = getWebDAVFileUrl(webdavSettings);
    const response = await webdavRequest('PUT', fileUrl, {
      headers: getWebDAVHeaders(webdavSettings, {
        'Content-Type': 'application/json'
      }),
      body: tempFile
    });

    if (response.status === 404) {
      await ensureWebDAVDirectory(webdavSettings);
      const retryResponse = await webdavRequest('PUT', fileUrl, {
        headers: getWebDAVHeaders(webdavSettings, {
          'Content-Type': 'application/json'
        }),
        body: tempFile
      });

      if (!retryResponse.ok) {
        throw new Error(`HTTP ${retryResponse.status}: ${retryResponse.statusText} (${fileUrl})`);
      }
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText} (${fileUrl})`);
    }
  }

  async function downloadBackupToTempFile(webdavSettings) {
    const fileUrl = getWebDAVFileUrl(webdavSettings);
    const response = await webdavRequest('GET', fileUrl, {
      headers: getWebDAVHeaders(webdavSettings)
    });

    if (response.status === 404) {
      throw new Error(`${t('noBackupFound')} (${fileUrl})`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.text;
  }

  function cleanupTempFile() {
    return;
  }

  function hasMeaningfulBackupData(backupData) {
    if (!backupData) return false;
    if ((backupData.space_list || []).length > 0) return true;

    return Object.values(backupData.spaces || {}).some(space => {
      if ((space.groups || []).length > 0) return true;
      return false;
    });
  }

  async function refreshDataAfterImport() {
    data = await StorageManager.getData();
    await updateBackupStats();
    renderSpaces();
    renderGroups();

    if (data.space_list.length > 0) {
      switchSpace(data.space_list[0].id);
    }
  }

  async function testWebDAVConnection() {
    try {
      const webdavSettings = getWebDAVSettingsFromForm();
      validateWebDAVSettings(webdavSettings);
      await saveWebDAVSettings();

      showToast(t('webdavTesting'));
      await probeWebDAVService(webdavSettings);
      const result = await ensureWebDAVDirectory(webdavSettings);

      showToast(result.created ? `${t('webdavDirectoryCreated')} ${t('webdavConnectionSuccess')}` : t('webdavConnectionSuccess'));
    } catch (err) {
      console.error('WebDAV test error:', err);
      showToast(err.message || t('syncFailed'));
    }
  }

  async function uploadToWebDAV({ silent = false, webdavSettings: presetSettings = null } = {}) {
    let tempFile = null;
    try {
      const webdavSettings = presetSettings || getWebDAVSettingsFromForm();
      if (!webdavSettings.enabled) {
        if (!silent) showToast(t('pleaseEnableWebDAV'));
        return;
      }

      validateWebDAVSettings(webdavSettings);
      if (!presetSettings) {
        await saveWebDAVSettings();
      }

      if (!silent) showToast(t('webdavUploading'));
      await probeWebDAVService(webdavSettings);
      await ensureWebDAVDirectory(webdavSettings);

      const backupData = await StorageManager.exportToBackup();
      if (!hasMeaningfulBackupData(backupData)) {
        console.warn('Skip WebDAV upload because local backup data is empty');
        if (!silent) showToast(`${t('syncFailed')}: local data is empty`);
        return;
      }

      tempFile = JSON.stringify(backupData, null, 2);
      await uploadTempBackupFile(webdavSettings, tempFile);

      cleanupTempFile(tempFile);
      if (!silent) showToast(t('uploadSuccess'));
    } catch (err) {
      cleanupTempFile(tempFile);
      console.error('WebDAV upload error:', err);
      showToast(`${t('syncFailed')}: ${err.message}`);
    }
  }

  async function downloadFromWebDAV() {
    try {
      const webdavSettings = getWebDAVSettingsFromForm();
      if (!webdavSettings.enabled) {
        showToast(t('pleaseEnableWebDAV'));
        return;
      }

      validateWebDAVSettings(webdavSettings);
      await saveWebDAVSettings();

      showToast(t('webdavDownloading'));
      await probeWebDAVService(webdavSettings);
      await ensureWebDAVDirectory(webdavSettings);

      const tempContent = await downloadBackupToTempFile(webdavSettings);
      const backupData = JSON.parse(tempContent);
      suppressAutoSync();

      $progressTitle.textContent = t('importing');
      $progressBarFill.style.width = '50%';
      $progressText.textContent = '50%';
      $progressOverlay.hidden = false;

      await StorageManager.importFromBackup(backupData);

      $progressBarFill.style.width = '100%';
      $progressText.textContent = '100%';
      $progressOverlay.hidden = true;

      await refreshDataAfterImport();
      showToast(t('downloadSuccess'));
    } catch (err) {
      $progressOverlay.hidden = true;
      console.error('WebDAV download error:', err);
      showToast(`${t('syncFailed')}: ${err.message}`);
    }
  }

  function scheduleAutoSyncUpload() {
    if (autoSyncTimer) {
      clearTimeout(autoSyncTimer);
    }

    autoSyncTimer = setTimeout(async () => {
      autoSyncTimer = null;

      if (autoSyncInProgress || !canRunAutoSync()) {
        return;
      }

      try {
        const webdavSettings = await getStoredWebDAVSettings();
        if (!webdavSettings.enabled || !webdavSettings.autoSync) {
          return;
        }

        validateWebDAVSettings(webdavSettings);
        autoSyncInProgress = true;
        await uploadToWebDAV({ silent: true, webdavSettings });
      } catch (err) {
        console.error('WebDAV auto-sync error:', err);
      } finally {
        autoSyncInProgress = false;
      }
    }, AUTO_SYNC_DEBOUNCE_MS);
  }

  function bindAutoSync() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== 'local') return;
      if (!changes[StorageManager.KEYS.DATA]) return;
      const nextData = changes[StorageManager.KEYS.DATA].newValue;
      if (!hasMeaningfulBackupData(nextData)) return;
      if (!canRunAutoSync()) return;
      scheduleAutoSyncUpload();
    });
  }

  // ── Backup Event Listeners ──

  $backupClose.addEventListener('click', closeBackup);
  $backupOverlay.addEventListener('click', (e) => {
    if (e.target === $backupOverlay) closeBackup();
  });

  $backupExportBtn.addEventListener('click', exportBackup);
  
  $backupImportBtn.addEventListener('click', () => {
    $backupImportFileInput.click();
  });
  
  $backupImportFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      importBackup(file);
    }
    $backupImportFileInput.value = '';
  });

  $githubGistToggle.addEventListener('change', () => {
    $githubGistToggle.checked = false;
    showToast(t('githubGistInDevelopment'));
  });

  // WebDAV toggle
  $webdavToggle.addEventListener('change', () => {
    toggleWebDAVConfig($webdavToggle.checked);
    saveWebDAVSettings();
  });
// WebDAV config inputs
[$webdavUrl, $webdavUsername, $webdavPassword].forEach(el => {
  el.addEventListener('change', saveWebDAVSettings);
});

// Auto sync toggle with confirmation dialog
$webdavAutoSync.addEventListener('change', async () => {
  if ($webdavAutoSync.checked) {
    // Show confirmation dialog when enabling auto sync
    const confirmed = await showAutoSyncConfirmDialog();
    if (!confirmed) {
      // User cancelled, revert the toggle
      $webdavAutoSync.checked = false;
      return;
    }
    // User confirmed, perform immediate sync
    await saveWebDAVSettings();
    uploadToWebDAV({ silent: false });
  } else {
    // Disabling auto sync, save directly
    await saveWebDAVSettings();
  }
});

// Show auto sync confirmation dialog
function showAutoSyncConfirmDialog() {
  return new Promise((resolve) => {
    const dialogHtml = `
      <div class="modal-overlay" id="autoSyncConfirmDialog" style="z-index: 3000;">
        <div class="modal" style="width: 400px;">
          <div class="modal-header">
            <h3>确认开启自动同步</h3>
            <button class="btn-icon modal-close" id="autoSyncConfirmClose">&times;</button>
          </div>
          <div class="modal-body" style="padding: 20px;">
            <p style="color: var(--text-secondary); line-height: 1.6;">
              开启后会立即将本地的数据同步到远程一次，请慎重！！！
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" id="autoSyncConfirmCancel">取消</button>
            <button class="btn-primary" id="autoSyncConfirmOk">确定</button>
          </div>
        </div>
      </div>
    `;

    const dialogEl = document.createElement('div');
    dialogEl.innerHTML = dialogHtml;
    document.body.appendChild(dialogEl);

    const overlay = dialogEl.querySelector('#autoSyncConfirmDialog');

    function close(result) {
      dialogEl.remove();
      resolve(result);
    }

    dialogEl.querySelector('#autoSyncConfirmClose').addEventListener('click', () => close(false));
    dialogEl.querySelector('#autoSyncConfirmCancel').addEventListener('click', () => close(false));
    dialogEl.querySelector('#autoSyncConfirmOk').addEventListener('click', () => close(true));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });
  });
}

  // Toggle password visibility
  $toggleWebdavPassword.addEventListener('click', () => {
    const type = $webdavPassword.type === 'password' ? 'text' : 'password';
    $webdavPassword.type = type;
  });

  // Sync buttons
  $webdavTestBtn.addEventListener('click', testWebDAVConnection);
  $syncUploadBtn.addEventListener('click', uploadToWebDAV);
  $syncDownloadBtn.addEventListener('click', downloadFromWebDAV);

  ['settingLanguage', 'settingOpenTabMode'].forEach(id => {
    document.getElementById(id).addEventListener('change', onSettingChange);
  });

  // Theme swatch click handler
  $themeSwatches.addEventListener('click', async (e) => {
    const swatch = e.target.closest('.theme-swatch');
    if (!swatch || !currentSettings) return;
    const theme = swatch.dataset.theme;
    if (!THEMES[theme]) return;
    $themeSwatches.querySelectorAll('.theme-swatch').forEach(btn => {
      btn.classList.toggle('active', btn === swatch);
    });
    currentSettings.theme = theme;
    await StorageManager.saveSettings(currentSettings);
    applyTheme(theme);
  });

  // Tab style click handler
  $tabStyleOptions.addEventListener('click', async (e) => {
    const opt = e.target.closest('.tab-style-option');
    if (!opt || !currentSettings) return;
    const style = opt.dataset.style;
    $tabStyleOptions.querySelectorAll('.tab-style-option').forEach(o => {
      o.classList.toggle('active', o === opt);
    });
    currentSettings.tabStyle = style;
    tabStyle = style;
    await StorageManager.saveSettings(currentSettings);
    renderGroups();
  });

  // ═══ JSON Import (for existing space) ═══

  let pendingImportSpaceId = null;

  $jsonFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingImportSpaceId) return;

    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      const space = data.spaces[pendingImportSpaceId];
      if (!space) return;

      let groups;
      if (backupData.groups && Array.isArray(backupData.groups)) {
        groups = backupData.groups;
      } else if (backupData.spaces && backupData.spaces[pendingImportSpaceId]) {
        // Importing from a full backup, extract groups from this space
        groups = backupData.spaces[pendingImportSpaceId].groups || [];
      } else if (Array.isArray(backupData)) {
        groups = [{ name: file.name.replace('.json', ''), tabs: backupData }];
      } else {
        showToast(t('unsupportedFormat'));
        return;
      }

      $progressTitle.textContent = t('importing');
      $progressBarFill.style.width = '0%';
      $progressText.textContent = '0%';
      $progressOverlay.hidden = false;

      let totalTabs = 0;
      for (const g of groups) totalTabs += (g.tabs || []).length;
      let done = 0;

      for (const g of [...groups].reverse()) {
        const newGroup = {
          id: StorageManager.generateGroupId(),
          name: g.name || t('untitled'),
          tabs: (g.tabs || []).map(tt => ({
            id: StorageManager.generateUUID(),
            title: tt.title || tt.url || '',
            url: tt.url || '',
            favIconUrl: tt.favIconUrl || tt.favicon || '',
            kind: 'record'
          }))
        };
        space.groups.push(newGroup);
        done += (g.tabs || []).length;
        const pct = totalTabs ? Math.round((done / totalTabs) * 100) : 100;
        $progressBarFill.style.width = pct + '%';
        $progressText.textContent = `${done} / ${totalTabs} (${pct}%)`;
        await new Promise(r => setTimeout(r, 0));
      }

      await saveAll();
      $progressOverlay.hidden = true;
      switchSpace(space.id);
      showToast(t('importedCollections', groups.length));
    } catch (err) {
      $progressOverlay.hidden = true;
      showToast(t('importFailed'));
      console.error(err);
    } finally {
      $jsonFileInput.value = '';
      pendingImportSpaceId = null;
    }
  });

  // ═══ Modal ═══

  let modalCallback = null;

  function showModal(title, defaultValue, callback) {
    $modalTitle.textContent = title;
    $modalInput.value = defaultValue || '';
    $modalOverlay.hidden = false;
    modalCallback = callback;
    setTimeout(() => $modalInput.focus(), 50);
  }

  function hideModal() {
    $modalOverlay.hidden = true;
    modalCallback = null;
  }

  $modalConfirm.addEventListener('click', () => { if (modalCallback) modalCallback($modalInput.value); hideModal(); });
  $modalCancel.addEventListener('click', hideModal);
  $modalClose.addEventListener('click', hideModal);
  $modalInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { if (modalCallback) modalCallback($modalInput.value); hideModal(); }
    else if (e.key === 'Escape') hideModal();
  });
  $modalOverlay.addEventListener('click', (e) => { if (e.target === $modalOverlay) hideModal(); });

  // ═══ Context Menu ═══

  function showContextMenu(e, spaceId) {
    hideAllMenus();
    $contextMenu.dataset.spaceId = spaceId;
    $contextMenu.hidden = false;
    const rect = e.target.getBoundingClientRect();
    $contextMenu.style.top = rect.bottom + 4 + 'px';
    $contextMenu.style.left = rect.left + 'px';
  }

  function hideCollDropMenu() {
    $collDropMenu.hidden = true;
  }

  function hideContextMenu() {
    $contextMenu.hidden = true;
    $tabContextMenu.hidden = true;
  }

  function hideAllMenus() {
    $spaceAddMenu.hidden = true;
    $prefMenu.hidden = true;
    hideContextMenu();
    hideCollDropMenu();
  }

  // ═══ Helpers ═══

  function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  async function openUrl(url, forceNewTab) {
    const settings = await StorageManager.getSettings();
    const mode = settings.openTabMode || 'redirect';
    try {
      if (forceNewTab || mode === 'new-tab') {
        chrome.tabs.create({ url });
      } else {
        chrome.tabs.update({ url });
      }
    } catch { window.open(url, '_blank'); }
  }

  async function saveAll() { 
    await StorageManager.saveData(data); 
  }

  function filterTabs(tabs) {
    if (!searchQuery) return tabs || [];
    const q = searchQuery.toLowerCase();
    return (tabs || []).filter(t => 
      (t.title || '').toLowerCase().includes(q) || 
      (t.url || '').toLowerCase().includes(q)
    );
  }

  function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function getDomain(url) {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
  }

  // ═══ Resize Handles ═══

  function initResize() {
    const $app = document.querySelector('.app');
    const $resizeLeft = document.getElementById('resizeLeft');
    const $resizeRight = document.getElementById('resizeRight');

    let leftWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'));
    let rightWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--right-sidebar-width'));

    function startDrag(handle, side) {
      handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        $app.classList.add('resizing');
        handle.classList.add('active');

        const startX = e.clientX;
        const startLeftW = leftWidth;
        const startRightW = rightWidth;

        function onMove(e2) {
          const dx = e2.clientX - startX;
          if (side === 'left') {
            const newW = Math.max(120, Math.min(400, startLeftW + dx));
            leftWidth = newW;
            document.documentElement.style.setProperty('--sidebar-width', newW + 'px');
            $app.style.gridTemplateColumns = `${newW}px 4px 1fr 4px ${rightWidth}px`;
          } else {
            const newW = Math.max(160, Math.min(500, startRightW - dx));
            rightWidth = newW;
            document.documentElement.style.setProperty('--right-sidebar-width', newW + 'px');
            $app.style.gridTemplateColumns = `${leftWidth}px 4px 1fr 4px ${newW}px`;
          }
        }

        function onUp() {
          $app.classList.remove('resizing');
          handle.classList.remove('active');
          document.documentElement.style.setProperty('--sidebar-width', leftWidth + 'px');
          document.documentElement.style.setProperty('--right-sidebar-width', rightWidth + 'px');
          $app.style.gridTemplateColumns = '';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    startDrag($resizeLeft, 'left');
    startDrag($resizeRight, 'right');
  }

  // ═══ Listen for Tab Changes ═══

  function listenTabChanges() {
    async function refresh() {
      await loadBrowserTabs();
      renderCurrentTabs();
    }
    chrome.tabs.onCreated.addListener(refresh);
    chrome.tabs.onRemoved.addListener(refresh);
    chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
      if (changeInfo.title || changeInfo.favIconUrl || changeInfo.url) refresh();
    });
  }

  // ═══ Start ═══
  await init();
  initResize();
  listenTabChanges();
})();
