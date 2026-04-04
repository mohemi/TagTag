// ═══════════════════════════════════════════════════════════
// TagTag — Options Page Main Logic
// ═══════════════════════════════════════════════════════════

(async function () {
  'use strict';

  // ── State ──
  let spaces = [];
  let activeSpaceId = null;
  let browserTabs = [];
  let searchQuery = '';
  let dragSource = null;

  // ── DOM refs ──
  const $spacesList = document.getElementById('spacesList');
  const $currentSpaceName = document.getElementById('currentSpaceName');
  const $collectionsArea = document.getElementById('collectionsArea');
  const $currentTabsList = document.getElementById('currentTabsList');
  const $searchInput = document.getElementById('searchInput');
  const $tabCount = document.getElementById('tabCount');
  const $addSpaceBtn = document.getElementById('addSpaceBtn');
  const $addCollectionBtn = document.getElementById('addCollectionBtn');
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
  const $aboutOverlay = document.getElementById('aboutOverlay');
  const $aboutClose = document.getElementById('aboutClose');
  const $aboutBody = document.getElementById('aboutBody');

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
    await StorageManager.seedDefaults(t('defaultSpace'), t('defaultCollection'), DEFAULT_FAVICON);
    spaces = await StorageManager.getSpaces();

    activeSpaceId = settings.defaultSpace || (spaces[0] && spaces[0].id);
    applyTheme(settings.theme);
    applyLanguage();

    await loadBrowserTabs();

    renderSpaces();
    renderCollections();
    renderCurrentTabs();
    bindEvents();
  }

  const DEFAULT_FAVICON = chrome.runtime.getURL('assets/icons/icon128.png');
  const SELF_URL = chrome.runtime.getURL('options/options.html');

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
    // Pref menu items
    $prefMenu.querySelector('[data-action="settings"]').textContent = t('settingsTitle');
    $prefMenu.querySelector('[data-action="about"]').textContent = t('aboutMe');

    // Top bar
    $searchInput.placeholder = t('searchTabs');
    $addCollectionBtn.textContent = t('addCollection');

    // Right sidebar
    $saveTabsBtn.title = t('saveAllTabs');
    $saveTabsBtn.querySelector('svg').nextSibling.textContent = ' ' + t('save');
    $sidebarToggle.title = t('toggleCurrentTabs');

    // Modal
    $modalCancel.textContent = t('cancel');
    $modalConfirm.textContent = t('confirm');

    // Space context menu
    $contextMenu.querySelector('[data-action="import-json"]').textContent = t('importJson');
    $contextMenu.querySelector('[data-action="export-json"]').textContent = t('exportJson');
    $contextMenu.querySelector('[data-action="change-icon"]').textContent = t('changeIcon');
    $contextMenu.querySelector('[data-action="rename"]').textContent = t('editName');
    $contextMenu.querySelector('[data-action="delete"]').textContent = t('delete');

    // Tab context menu
    $tabContextMenu.querySelector('[data-action="tab-rename"]').textContent = t('rename');
    $tabContextMenu.querySelector('[data-action="tab-edit-url"]').textContent = t('editUrl');
    $tabContextMenu.querySelector('[data-action="tab-delete"]').textContent = t('delete');

    // Emoji picker
    document.querySelector('.emoji-picker-header h3').textContent = t('chooseIcon');

    // Settings
    document.querySelector('.settings-header h2').textContent = t('settingsTitle');
    const settingsLabels = document.querySelectorAll('.settings-row > label:first-child');
    if (settingsLabels[0]) settingsLabels[0].textContent = t('language');
    if (settingsLabels[1]) settingsLabels[1].textContent = t('theme');
    if (settingsLabels[2]) settingsLabels[2].textContent = t('openTabMode');

    // Settings select options
    const themeSelect = document.getElementById('settingTheme');
    themeSelect.options[0].textContent = t('themeSystem');
    themeSelect.options[1].textContent = t('themeDark');
    themeSelect.options[2].textContent = t('themeLight');

    const modeSelect = document.getElementById('settingOpenTabMode');
    modeSelect.options[0].textContent = t('modeRedirect');
    modeSelect.options[1].textContent = t('modeNewTab');
  }

  // ═══ Render: Spaces Sidebar ═══

  let spaceDragId = null;

  function renderSpaces() {
    $spacesList.innerHTML = '';
    spaces.forEach(space => {
      const li = document.createElement('li');
      li.className = 'space-item' + (space.id === activeSpaceId ? ' active' : '');
      li.dataset.id = space.id;
      li.draggable = true;
      li.innerHTML = `
        <span class="space-icon">${space.icon && (space.icon.startsWith('http') || space.icon.startsWith('chrome-extension://')) ? `<img src="${esc(space.icon)}" width="16" height="16" style="vertical-align:middle;border-radius:3px;">` : (space.icon || '•')}</span>
        <span class="space-name">${esc(space.name)}</span>
        <button class="space-menu-btn" data-id="${space.id}" title="${t('more')}">···</button>
      `;
      li.addEventListener('click', (e) => {
        if (e.target.closest('.space-menu-btn')) return;
        switchSpace(space.id);
      });

      // Drag reorder
      li.addEventListener('dragstart', (e) => {
        spaceDragId = space.id;
        li.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      li.addEventListener('dragend', () => {
        spaceDragId = null;
        li.classList.remove('dragging');
        document.querySelectorAll('.space-item.drag-over').forEach(el => el.classList.remove('drag-over'));
      });
      li.addEventListener('dragover', (e) => {
        if (!spaceDragId || spaceDragId === space.id) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        li.classList.add('drag-over');
      });
      li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over');
      });
      li.addEventListener('drop', async (e) => {
        e.preventDefault();
        li.classList.remove('drag-over');
        if (!spaceDragId || spaceDragId === space.id) return;
        const fromIdx = spaces.findIndex(s => s.id === spaceDragId);
        const toIdx = spaces.findIndex(s => s.id === space.id);
        if (fromIdx === -1 || toIdx === -1) return;
        const [moved] = spaces.splice(fromIdx, 1);
        spaces.splice(toIdx, 0, moved);
        spaces.forEach((s, i) => s.order = i);
        await StorageManager.saveSpaces(spaces);
        renderSpaces();
        spaceDragId = null;
      });

      $spacesList.appendChild(li);
    });
  }

  function switchSpace(spaceId) {
    activeSpaceId = spaceId;
    renderSpaces();
    renderCollections();
    StorageManager.getSettings().then(s => {
      s.defaultSpace = spaceId;
      StorageManager.saveSettings(s);
    });
  }

  // ═══ Render: Middle Area (Collections / Namespaces) ═══

  function renderCollections() {
    const space = spaces.find(s => s.id === activeSpaceId);
    if (!space) {
      $currentSpaceName.textContent = '';
      $collectionsArea.innerHTML = '';
      $tabCount.textContent = t('tabsCount', 0);
      return;
    }

    $currentSpaceName.textContent = space.name;
    $collectionsArea.innerHTML = '';

    if (!space.collections || space.collections.length === 0) {
      $collectionsArea.innerHTML = `
        <div class="empty-state">
          <p>${t('emptyState')}</p>
        </div>`;
      $tabCount.textContent = t('tabsCount', 0);
      return;
    }

    let totalTabs = 0;

    space.collections.forEach(col => {
      const section = document.createElement('div');
      section.className = 'collection-section';
      section.dataset.collectionId = col.id;

      // ── Header ──
      const header = document.createElement('div');
      header.className = 'collection-header';
      header.innerHTML = `
        <span class="collection-drag-handle" title="${t('dragToReorder')}">⠿</span>
        <span class="collection-toggle ${col.collapsed ? 'collapsed' : ''}">▼</span>
        <span class="collection-name">${esc(col.name)}</span>
        <div class="collection-actions">
          <button class="btn-icon collection-move-btn" title="${t('moveCollection')}" style="font-size:12px">⇄</button>
          <button class="btn-icon collection-rename-btn" title="${t('rename')}" style="font-size:13px">✎</button>
          <button class="btn-icon collection-delete-btn" title="${t('delete')}" style="font-size:14px">&times;</button>
        </div>
      `;

      // Collection reorder via custom mousedown drag
      const dragHandle = header.querySelector('.collection-drag-handle');
      dragHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startCollectionDrag(e, section, col.id, space);
      });

      header.addEventListener('click', (e) => {
        if (e.target.closest('.collection-actions') || e.target.closest('.collection-drag-handle') || e.target.closest('.collection-name')) return;
        col.collapsed = !col.collapsed;
        renderCollections();
        saveAll();
      });

      // Click collection name to inline rename
      header.querySelector('.collection-name').addEventListener('click', (e) => {
        e.stopPropagation();
        const nameEl = e.target;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = col.name;
        input.className = 'collection-name-input';
        nameEl.replaceWith(input);
        input.focus();
        input.select();

        function commit() {
          const val = input.value.trim();
          if (val && val !== col.name) {
            col.name = val;
            saveAll();
          }
          renderCollections();
        }

        input.addEventListener('blur', commit);
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') { input.blur(); }
          else if (ev.key === 'Escape') { input.value = col.name; input.blur(); }
        });
      });

      // Move/Copy to another space
      header.querySelector('.collection-move-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        showSpacePickerMenu(e.target, col.id, space.id);
      });

      header.querySelector('.collection-rename-btn').addEventListener('click', () => {
        showModal(t('modalRenameCollection'), col.name, (newName) => {
          if (newName.trim()) {
            col.name = newName.trim();
            renderCollections();
            saveAll();
          }
        });
      });

      header.querySelector('.collection-delete-btn').addEventListener('click', () => {
        if (confirm(t('confirmDeleteCollection', col.name))) {
          space.collections = space.collections.filter(c => c.id !== col.id);
          renderCollections();
          saveAll();
        }
      });

      section.appendChild(header);

      // ── Tab Grid ──
      const tabs = filterTabs(col.tabs);

      // Empty placeholder (dashed box)
      const emptyPlaceholder = document.createElement('div');
      emptyPlaceholder.className = 'tab-grid-empty' + (col.collapsed ? ' hidden' : '') + (tabs.length > 0 ? ' hidden' : '');
      emptyPlaceholder.textContent = t('dragTabsHere');
      emptyPlaceholder.dataset.spaceId = space.id;
      emptyPlaceholder.dataset.collectionId = col.id;

      // Drop zone for empty placeholder
      emptyPlaceholder.addEventListener('dragover', (e) => {
        if (dragSource && dragSource.type === 'collection') return;
        e.preventDefault();
        emptyPlaceholder.classList.add('drag-over');
      });
      emptyPlaceholder.addEventListener('dragleave', () => { emptyPlaceholder.classList.remove('drag-over'); });
      emptyPlaceholder.addEventListener('drop', (e) => {
        if (dragSource && dragSource.type === 'collection') return;
        e.preventDefault();
        emptyPlaceholder.classList.remove('drag-over');
        handleDrop(e, space.id, col.id);
      });

      section.appendChild(emptyPlaceholder);

      const grid = document.createElement('div');
      grid.className = 'tab-grid' + (col.collapsed ? ' hidden' : '') + (tabs.length === 0 ? ' hidden' : '');
      grid.dataset.spaceId = space.id;
      grid.dataset.collectionId = col.id;

      // Drop zone for tabs
      grid.addEventListener('dragover', (e) => {
        if (dragSource && dragSource.type === 'collection') return;
        e.preventDefault();
        grid.classList.add('drag-over');
      });
      grid.addEventListener('dragleave', () => { grid.classList.remove('drag-over'); });
      grid.addEventListener('drop', (e) => {
        if (dragSource && dragSource.type === 'collection') return;
        e.preventDefault();
        grid.classList.remove('drag-over');
        handleDrop(e, space.id, col.id);
      });

      tabs.forEach(tab => {
        grid.appendChild(createTabCard(tab, space.id, col.id));
      });

      totalTabs += tabs.length;
      section.appendChild(grid);
      $collectionsArea.appendChild(section);
    });

    $tabCount.textContent = t('tabsCount', totalTabs);
  }

  function createTabCard(tab, spaceId, collectionId) {
    const card = document.createElement('div');
    card.className = 'tab-card';
    card.draggable = true;

    let domain = '';
    try { domain = new URL(tab.url).hostname.replace('www.', ''); } catch {}

    const faviconUrl = tab.favicon || tab.favIconUrl || DEFAULT_FAVICON;

    card.innerHTML = `
      <img class="tab-favicon" src="${esc(faviconUrl)}" alt="">
      <span class="tab-title">${esc(tab.title)}</span>
      <button class="tab-remove" title="${t('more')}">···</button>
      <span class="tab-url" title="${esc(tab.url)}">${esc(domain || tab.url)}</span>
    `;

    // Fallback favicon on error (no inline handler for CSP)
    const img = card.querySelector('.tab-favicon');
    img.addEventListener('error', () => {
      img.src = DEFAULT_FAVICON;
    }, { once: true });

    // Drag card between collections
    card.addEventListener('dragstart', (e) => {
      dragSource = { type: 'card', spaceId, collectionId, tabId: tab.id, tabData: { title: tab.title, url: tab.url, favicon: faviconUrl } };
      e.dataTransfer.setData('application/json', JSON.stringify(dragSource.tabData));
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => { card.classList.remove('dragging'); dragSource = null; });

    // Click → open
    card.addEventListener('click', (e) => {
      if (e.target.closest('.tab-remove')) return;
      openUrl(tab.url);
    });

    // Tab menu (···)
    card.querySelector('.tab-remove').addEventListener('click', (e) => {
      e.stopPropagation();
      showTabContextMenu(e, spaceId, collectionId, tab);
    });

    return card;
  }

  // ═══ Collection Drag Reorder (custom mousedown) ═══

  const $collDropMenu = document.getElementById('collDropMenu');

  function startCollectionDrag(e, sectionEl, colId, space) {
    const allSections = Array.from($collectionsArea.querySelectorAll('.collection-section'));
    const fromIdx = allSections.indexOf(sectionEl);
    if (fromIdx === -1) return;

    const rect = sectionEl.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;

    const clone = sectionEl.cloneNode(true);
    clone.className = 'collection-section collection-drag-clone';
    clone.style.width = rect.width + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.top = (e.clientY - offsetY) + 'px';
    document.body.appendChild(clone);

    sectionEl.classList.add('collection-drag-placeholder');
    let currentIdx = fromIdx;

    function onMove(e2) {
      clone.style.top = (e2.clientY - offsetY) + 'px';
      for (let i = 0; i < allSections.length; i++) {
        if (allSections[i] === sectionEl) continue;
        const r = allSections[i].getBoundingClientRect();
        const midY = r.top + r.height / 2;
        if (e2.clientY > r.top && e2.clientY < r.bottom) {
          if (i !== currentIdx) {
            if (e2.clientY < midY) {
              $collectionsArea.insertBefore(sectionEl, allSections[i]);
            } else {
              $collectionsArea.insertBefore(sectionEl, allSections[i].nextSibling);
            }
            allSections.length = 0;
            allSections.push(...$collectionsArea.querySelectorAll('.collection-section'));
            currentIdx = allSections.indexOf(sectionEl);
          }
          break;
        }
      }
    }

    function onUp() {
      clone.remove();
      sectionEl.classList.remove('collection-drag-placeholder');
      const newOrder = Array.from($collectionsArea.querySelectorAll('.collection-section')).map(el => el.dataset.collectionId);
      const reordered = newOrder.map(id => space.collections.find(c => c.id === id)).filter(Boolean);
      reordered.forEach((c, i) => c.order = i);
      space.collections = reordered;
      saveAll();
      renderCollections();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ═══ Space Picker Menu (for Move/Copy collection) ═══

  function showSpacePickerMenu(anchorEl, colId, fromSpaceId) {
    // Build a space list menu dynamically
    const otherSpaces = spaces.filter(s => s.id !== fromSpaceId);
    if (otherSpaces.length === 0) return;

    // Reuse collDropMenu as a two-step menu
    // Step 1: show list of spaces
    $collDropMenu.innerHTML = '';
    otherSpaces.forEach(sp => {
      const btn = document.createElement('button');
      btn.className = 'context-menu-item';
      btn.textContent = sp.icon && !sp.icon.startsWith('http') && !sp.icon.startsWith('chrome-extension://') ? `${sp.icon} ${sp.name}` : sp.name;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Step 2: show copy/move options
        showCopyMoveMenu(colId, fromSpaceId, sp.id);
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

  function showCopyMoveMenu(colId, fromSpaceId, toSpaceId) {
    $collDropMenu.innerHTML = '';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'context-menu-item';
    copyBtn.textContent = t('copyCollection');
    copyBtn.addEventListener('click', () => {
      $collDropMenu.hidden = true;
      execCollectionCopyMove('copy', colId, fromSpaceId, toSpaceId);
    });

    const moveBtn = document.createElement('button');
    moveBtn.className = 'context-menu-item';
    moveBtn.textContent = t('moveCollection');
    moveBtn.addEventListener('click', () => {
      $collDropMenu.hidden = true;
      execCollectionCopyMove('move', colId, fromSpaceId, toSpaceId);
    });

    $collDropMenu.appendChild(copyBtn);
    $collDropMenu.appendChild(moveBtn);
  }

  async function execCollectionCopyMove(action, colId, fromSpaceId, toSpaceId) {
    const fromSpace = spaces.find(s => s.id === fromSpaceId);
    const toSpace = spaces.find(s => s.id === toSpaceId);
    if (!fromSpace || !toSpace) return;

    const colIdx = fromSpace.collections.findIndex(c => c.id === colId);
    if (colIdx === -1) return;
    const col = fromSpace.collections[colIdx];

    if (action === 'copy') {
      const newCol = JSON.parse(JSON.stringify(col));
      newCol.id = StorageManager.generateId();
      newCol.spaceId = toSpaceId;
      newCol.tabs.forEach(tab => {
        tab.id = StorageManager.generateId();
        tab.collectionId = newCol.id;
      });
      toSpace.collections.unshift(newCol);
      toSpace.updatedAt = Date.now();
      await saveAll();
      showToast(t('copiedTo', toSpace.name));
    } else {
      fromSpace.collections.splice(colIdx, 1);
      fromSpace.updatedAt = Date.now();
      col.spaceId = toSpaceId;
      toSpace.collections.unshift(col);
      toSpace.updatedAt = Date.now();
      await saveAll();
      showToast(t('movedTo', toSpace.name));
    }

    renderSpaces();
    renderCollections();
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

      const favicon = tab.favIconUrl || DEFAULT_FAVICON;
      li.innerHTML = `
        <img src="${esc(favicon)}" alt="">
        <span>${esc(tab.title || tab.url || t('untitled'))}</span>
        <button class="tab-close-btn" title="${t('closeTab')}">&times;</button>
      `;

      // Fallback: use default favicon (no inline handler for CSP)
      li.querySelector('img').addEventListener('error', function () { this.src = DEFAULT_FAVICON; }, { once: true });

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
        dragSource = { type: 'browser', tabData: { title: tab.title || '', url: tab.url || '', favicon: tab.favIconUrl || '' } };
        e.dataTransfer.setData('application/json', JSON.stringify(dragSource.tabData));
        e.dataTransfer.effectAllowed = 'copy';
      });
      li.addEventListener('dragend', () => { dragSource = null; });

      $currentTabsList.appendChild(li);
    });
  }

  // ═══ Drop Handler ═══

  function handleDrop(e, targetSpaceId, targetColId) {
    let data;
    try { data = JSON.parse(e.dataTransfer.getData('application/json')); } catch { return; }
    if (!data || !data.url) return;

    const space = spaces.find(s => s.id === targetSpaceId);
    if (!space) return;
    const targetCol = space.collections.find(c => c.id === targetColId);
    if (!targetCol) return;

    if (dragSource && dragSource.type === 'card') {
      if (dragSource.collectionId === targetColId) return;
      if (targetCol.tabs.some(t => t.url === data.url)) { showToast(t('tabAlreadyExists')); return; }

      const srcSpace = spaces.find(s => s.id === dragSource.spaceId);
      if (srcSpace) {
        const srcCol = srcSpace.collections.find(c => c.id === dragSource.collectionId);
        if (srcCol) srcCol.tabs = srcCol.tabs.filter(t => t.id !== dragSource.tabId);
      }

      targetCol.tabs.push(makeTab(data, targetColId));
      renderCollections();
      saveAll();
      showToast(t('movedTo', targetCol.name));
      return;
    }

    if (targetCol.tabs.some(t => t.url === data.url)) { showToast(t('tabAlreadyExists')); return; }
    targetCol.tabs.push(makeTab(data, targetColId));
    renderCollections();
    saveAll();
    showToast(t('addedTo', targetCol.name));
  }

  function makeTab(data, collectionId) {
    return {
      id: StorageManager.generateId(),
      collectionId,
      title: data.title || '',
      url: data.url || '',
      favicon: data.favicon || '',
      order: 0,
      pinned: false,
      createdAt: Date.now(),
    };
  }

  // ═══ Event Binding ═══

  function bindEvents() {
    $addSpaceBtn.addEventListener('click', () => {
      showModal(t('modalNewSpace'), '', async (name) => {
        if (!name.trim()) return;
        const sp = await StorageManager.createSpace(name.trim(), randomEmoji());
        spaces = await StorageManager.getSpaces();
        switchSpace(sp.id);
      });
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
        await StorageManager.addCollection(activeSpaceId, name.trim());
        spaces = await StorageManager.getSpaces();
        renderCollections();
      });
    });

    $searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderCollections();
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
    $contextMenu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      const spaceId = $contextMenu.dataset.spaceId;
      hideContextMenu();
      if (!action || !spaceId) return;

      const space = spaces.find(s => s.id === spaceId);
      if (!space) return;

      if (action === 'rename') {
        showModal(t('modalEditSpaceName'), space.name, async (newName) => {
          if (newName.trim()) {
            space.name = newName.trim();
            await saveAll();
            renderSpaces();
            renderCollections();
          }
        });
      } else if (action === 'delete') {
        if (confirm(t('confirmDeleteSpace', space.name))) {
          spaces = spaces.filter(s => s.id !== spaceId);
          if (activeSpaceId === spaceId) activeSpaceId = spaces[0] ? spaces[0].id : null;
          saveAll().then(() => { renderSpaces(); renderCollections(); });
        }
      } else if (action === 'import-json') {
        pendingImportSpaceId = spaceId;
        $jsonFileInput.click();
      } else if (action === 'export-json') {
        const exportData = {
          groups: space.collections.map(col => ({
            name: col.name,
            tabs: col.tabs.map(t => ({
              title: t.title,
              url: t.url,
              favIconUrl: t.favicon,
            })),
          })),
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${space.name}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast(t('exportedSuccess'));
      } else if (action === 'change-icon') {
        showEmojiPicker((emoji) => {
          space.icon = emoji;
          saveAll();
          renderSpaces();
        });
      }
    });

    document.addEventListener('click', () => { hideContextMenu(); hideTabContextMenu(); });

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

      await StorageManager.addCollection(activeSpaceId, timestamp);
      spaces = await StorageManager.getSpaces();

      const space = spaces.find(s => s.id === activeSpaceId);
      if (!space) return;
      const col = space.collections[space.collections.length - 1];

      for (const tab of browserTabs) {
        col.tabs.push({
          id: StorageManager.generateId(),
          collectionId: col.id,
          title: tab.title || '',
          url: tab.url || '',
          favicon: tab.favIconUrl || '',
          order: col.tabs.length,
          pinned: false,
          createdAt: Date.now(),
        });
      }

      space.collections.pop();
      space.collections.unshift(col);
      space.collections.forEach((c, i) => c.order = i);

      await saveAll();
      renderCollections();

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

  function showTabContextMenu(e, spaceId, collectionId, tab) {
    tabMenuTarget = { spaceId, collectionId, tab };
    $tabContextMenu.hidden = false;
    const rect = e.target.getBoundingClientRect();
    $tabContextMenu.style.top = rect.bottom + 4 + 'px';
    $tabContextMenu.style.left = rect.left + 'px';
  }

  function hideTabContextMenu() {
    $tabContextMenu.hidden = true;
    tabMenuTarget = null;
  }

  $tabContextMenu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    const target = tabMenuTarget;
    hideTabContextMenu();
    if (!action || !target) return;

    const { spaceId, collectionId, tab } = target;
    const sp = spaces.find(s => s.id === target.spaceId);
    if (!sp) return;
    const col = sp.collections.find(c => c.id === target.collectionId);
    if (!col) return;
    const tt = col.tabs.find(x => x.id === target.tab.id);
    if (!tt) return;

    if (action === 'tab-rename') {
      showModal(t('modalRenameTab'), tt.title, (newName) => {
        if (newName.trim()) {
          tt.title = newName.trim();
          renderCollections();
          saveAll();
        }
      });
    } else if (action === 'tab-edit-url') {
      showModal(t('modalEditUrl'), tt.url, (newUrl) => {
        if (newUrl.trim()) {
          tt.url = newUrl.trim();
          renderCollections();
          saveAll();
        }
      });
    } else if (action === 'tab-delete') {
      col.tabs = col.tabs.filter(x => x.id !== target.tab.id);
      renderCollections();
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
    document.getElementById('settingTheme').value = currentSettings.theme || 'dark';
    document.getElementById('settingOpenTabMode').value = currentSettings.openTabMode || 'redirect';
    $settingsOverlay.hidden = false;
  }

  function closeSettings() {
    $settingsOverlay.hidden = true;
  }

  async function onSettingChange() {
    if (!currentSettings) return;
    currentSettings.language = document.getElementById('settingLanguage').value;
    currentSettings.theme = document.getElementById('settingTheme').value;
    currentSettings.openTabMode = document.getElementById('settingOpenTabMode').value;
    await StorageManager.saveSettings(currentSettings);
    applyTheme(currentSettings.theme);

    // Apply language change
    I18N.setLang(currentSettings.language);
    applyLanguage();
    renderSpaces();
    renderCollections();
    renderCurrentTabs();
  }

  function applyTheme(theme) {
    const root = document.documentElement;
    let resolved = theme;
    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    if (resolved === 'light') {
      root.style.setProperty('--bg-primary', '#e4e4ec');
      root.style.setProperty('--bg-sidebar', '#e4e4ec');
      root.style.setProperty('--bg-card', '#ffffff');
      root.style.setProperty('--bg-hover', '#e8e8f0');
      root.style.setProperty('--bg-input', '#f5f5fa');
      root.style.setProperty('--text-primary', '#1a1a2e');
      root.style.setProperty('--text-secondary', '#555555');
      root.style.setProperty('--text-muted', '#999999');
      root.style.setProperty('--border-color', '#d0d0dd');
    } else {
      root.style.setProperty('--bg-primary', '#0f0f1a');
      root.style.setProperty('--bg-sidebar', '#0f0f1a');
      root.style.setProperty('--bg-card', '#2a2a3e');
      root.style.setProperty('--bg-hover', '#33334d');
      root.style.setProperty('--bg-input', '#1e1e32');
      root.style.setProperty('--text-primary', '#e0e0e0');
      root.style.setProperty('--text-secondary', '#888888');
      root.style.setProperty('--text-muted', '#555555');
      root.style.setProperty('--border-color', '#3a3a55');
    }
  }

  // ═══ Preference Menu ═══

  $settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    $prefMenu.hidden = !$prefMenu.hidden;
  });

  $prefMenu.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    $prefMenu.hidden = true;
    if (action === 'settings') {
      openSettings();
    } else if (action === 'about') {
      openAbout();
    }
  });

  document.addEventListener('click', () => { $prefMenu.hidden = true; });

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

  ['settingLanguage', 'settingTheme', 'settingOpenTabMode'].forEach(id => {
    document.getElementById(id).addEventListener('change', onSettingChange);
  });

  // ═══ JSON Import ═══

  let pendingImportSpaceId = null;

  $jsonFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingImportSpaceId) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const space = spaces.find(s => s.id === pendingImportSpaceId);
      if (!space) return;

      let groups;
      if (data.groups && Array.isArray(data.groups)) {
        groups = data.groups;
      } else if (data.collections && Array.isArray(data.collections)) {
        groups = data.collections;
      } else if (Array.isArray(data)) {
        groups = [{ name: file.name.replace('.json', ''), tabs: data }];
      } else {
        showToast(t('unsupportedFormat'));
        return;
      }

      groups.reverse();

      for (const g of groups) {
        const col = {
          id: StorageManager.generateId(),
          spaceId: space.id,
          name: g.name || t('untitled'),
          icon: '',
          order: space.collections.length,
          tabs: (g.tabs || []).map((tt, i) => ({
            id: StorageManager.generateId(),
            collectionId: '',
            title: tt.title || tt.url || '',
            url: tt.url || '',
            favicon: tt.favIconUrl || tt.favicon || '',
            order: i,
            pinned: false,
            createdAt: Date.now(),
          })),
          collapsed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        col.tabs.forEach(tt => tt.collectionId = col.id);
        space.collections.push(col);
      }

      space.updatedAt = Date.now();
      await saveAll();

      switchSpace(space.id);
      showToast(t('importedCollections', groups.length));
    } catch (err) {
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
    $contextMenu.dataset.spaceId = spaceId;
    $contextMenu.hidden = false;
    const rect = e.target.getBoundingClientRect();
    $contextMenu.style.top = rect.bottom + 4 + 'px';
    $contextMenu.style.left = rect.left + 'px';
  }

  function hideContextMenu() { $contextMenu.hidden = true; $tabContextMenu.hidden = true; }

  // ═══ Helpers ═══

  function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  async function openUrl(url) {
    const settings = await StorageManager.getSettings();
    const mode = settings.openTabMode || 'redirect';
    try {
      if (mode === 'redirect') {
        chrome.tabs.update({ url });
      } else {
        chrome.tabs.create({ url });
      }
    } catch { window.open(url, '_blank'); }
  }

  async function saveAll() { await StorageManager.saveSpaces(spaces); }

  function filterTabs(tabs) {
    if (!searchQuery) return tabs;
    const q = searchQuery.toLowerCase();
    return tabs.filter(t => t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q));
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
