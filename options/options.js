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

  // ═══ Init ═══

  async function init() {
    await StorageManager.seedDefaults();
    spaces = await StorageManager.getSpaces();

    const settings = await StorageManager.getSettings();
    activeSpaceId = settings.defaultSpace || (spaces[0] && spaces[0].id);

    await loadBrowserTabs();

    renderSpaces();
    renderCollections();
    renderCurrentTabs();
    bindEvents();
  }

  const DEFAULT_FAVICON = chrome.runtime.getURL('assets/icons/icon48.png');
  const SELF_URL = chrome.runtime.getURL('options/options.html');

  async function loadBrowserTabs() {
    try {
      const all = await chrome.tabs.query({});
      browserTabs = all.filter(t => !t.url || !t.url.startsWith(SELF_URL));
    } catch {
      browserTabs = [];
    }
  }

  // ═══ Render: Spaces Sidebar ═══

  function renderSpaces() {
    $spacesList.innerHTML = '';
    spaces.forEach(space => {
      const li = document.createElement('li');
      li.className = 'space-item' + (space.id === activeSpaceId ? ' active' : '');
      li.dataset.id = space.id;
      li.innerHTML = `
        <span class="space-icon">${space.icon || '•'}</span>
        <span class="space-name">${esc(space.name)}</span>
        <button class="space-menu-btn" data-id="${space.id}" title="More">···</button>
      `;
      li.addEventListener('click', (e) => {
        if (e.target.closest('.space-menu-btn')) return;
        switchSpace(space.id);
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
    if (!space) return;

    $currentSpaceName.textContent = space.name;
    $collectionsArea.innerHTML = '';

    if (!space.collections || space.collections.length === 0) {
      $collectionsArea.innerHTML = `
        <div class="empty-state">
          <p>No collections yet. Click "+ Add collection" or import JSON via space menu.</p>
        </div>`;
      $tabCount.textContent = 'Tabs (0)';
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
        <span class="collection-drag-handle" title="Drag to reorder">⠿</span>
        <span class="collection-toggle ${col.collapsed ? 'collapsed' : ''}">▼</span>
        <span class="collection-name">${esc(col.name)}</span>
        <div class="collection-actions">
          <button class="btn-icon collection-rename-btn" title="Rename" style="font-size:13px">✎</button>
          <button class="btn-icon collection-delete-btn" title="Delete" style="font-size:14px">&times;</button>
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

      header.querySelector('.collection-rename-btn').addEventListener('click', () => {
        showModal('Rename Collection', col.name, (newName) => {
          if (newName.trim()) {
            col.name = newName.trim();
            renderCollections();
            saveAll();
          }
        });
      });

      header.querySelector('.collection-delete-btn').addEventListener('click', () => {
        if (confirm(`Delete collection "${col.name}"?`)) {
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
      emptyPlaceholder.textContent = 'Drag tabs here';
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

    $tabCount.textContent = `Tabs (${totalTabs})`;
  }

  function createTabCard(tab, spaceId, collectionId) {
    const card = document.createElement('div');
    card.className = 'tab-card';
    card.draggable = true;

    let domain = '';
    try { domain = new URL(tab.url).hostname.replace('www.', ''); } catch {}

    const faviconUrl = tab.favicon || tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    const firstChar = (tab.title || 'U').charAt(0).toUpperCase();

    card.innerHTML = `
      <img class="tab-favicon" src="${esc(faviconUrl)}" alt="">
      <span class="tab-title">${esc(tab.title)}</span>
      <button class="tab-remove" title="More">···</button>
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

  function startCollectionDrag(e, sectionEl, colId, space) {
    const allSections = Array.from($collectionsArea.querySelectorAll('.collection-section'));
    const fromIdx = allSections.indexOf(sectionEl);
    if (fromIdx === -1) return;

    const rect = sectionEl.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;

    // Create floating clone
    const clone = sectionEl.cloneNode(true);
    clone.className = 'collection-section collection-drag-clone';
    clone.style.width = rect.width + 'px';
    clone.style.left = rect.left + 'px';
    clone.style.top = (e.clientY - offsetY) + 'px';
    document.body.appendChild(clone);

    // Hide original and add placeholder
    sectionEl.classList.add('collection-drag-placeholder');

    let currentIdx = fromIdx;

    function onMove(e2) {
      clone.style.top = (e2.clientY - offsetY) + 'px';

      // Find which section we're hovering over
      for (let i = 0; i < allSections.length; i++) {
        if (allSections[i] === sectionEl) continue;
        const r = allSections[i].getBoundingClientRect();
        const midY = r.top + r.height / 2;
        if (e2.clientY > r.top && e2.clientY < r.bottom) {
          const targetIdx = i;
          if (targetIdx !== currentIdx) {
            // Move the placeholder element in DOM
            if (e2.clientY < midY) {
              $collectionsArea.insertBefore(sectionEl, allSections[i]);
            } else {
              $collectionsArea.insertBefore(sectionEl, allSections[i].nextSibling);
            }
            // Refresh order
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

      // Compute new order from DOM
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

  // ═══ Render: Right Sidebar (Current Browser Tabs) ═══

  function renderCurrentTabs() {
    $currentTabsList.innerHTML = '';
    const list = searchQuery
      ? browserTabs.filter(t =>
          (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.url || '').toLowerCase().includes(searchQuery.toLowerCase()))
      : browserTabs;

    $currentTabsCount.textContent = `Tabs (${browserTabs.length})`;

    list.forEach(tab => {
      const li = document.createElement('li');
      li.className = 'current-tab-item';
      li.draggable = true;

      const favicon = tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${getDomain(tab.url)}&sz=32`;
      li.innerHTML = `
        <img src="${esc(favicon)}" alt="">
        <span>${esc(tab.title || tab.url || 'Untitled')}</span>
        <button class="tab-close-btn" title="Close tab">&times;</button>
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

    // Move from another collection
    if (dragSource && dragSource.type === 'card') {
      if (dragSource.collectionId === targetColId) return;
      if (targetCol.tabs.some(t => t.url === data.url)) { showToast('Tab already in this collection'); return; }

      const srcSpace = spaces.find(s => s.id === dragSource.spaceId);
      if (srcSpace) {
        const srcCol = srcSpace.collections.find(c => c.id === dragSource.collectionId);
        if (srcCol) srcCol.tabs = srcCol.tabs.filter(t => t.id !== dragSource.tabId);
      }

      targetCol.tabs.push(makeTab(data, targetColId));
      renderCollections();
      saveAll();
      showToast(`Moved to "${targetCol.name}"`);
      return;
    }

    // Copy from browser tabs
    if (targetCol.tabs.some(t => t.url === data.url)) { showToast('Tab already in this collection'); return; }
    targetCol.tabs.push(makeTab(data, targetColId));
    renderCollections();
    saveAll();
    showToast(`Added to "${targetCol.name}"`);
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
      showModal('New Space', '', async (name) => {
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
      showModal('New Collection', timestamp, async (name) => {
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
        showModal('Edit Space Name', space.name, async (newName) => {
          if (newName.trim()) {
            space.name = newName.trim();
            await saveAll();
            renderSpaces();
            renderCollections();
          }
        });
      } else if (action === 'delete') {
        if (confirm(`Delete space "${space.name}"?`)) {
          spaces = spaces.filter(s => s.id !== spaceId);
          if (activeSpaceId === spaceId) activeSpaceId = spaces[0] ? spaces[0].id : null;
          saveAll().then(() => { renderSpaces(); renderCollections(); });
        }
      } else if (action === 'import-json') {
        pendingImportSpaceId = spaceId;
        $jsonFileInput.click();
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

      // Create collection with timestamp name
      await StorageManager.addCollection(activeSpaceId, timestamp);
      spaces = await StorageManager.getSpaces();

      const space = spaces.find(s => s.id === activeSpaceId);
      if (!space) return;
      const col = space.collections[space.collections.length - 1];

      // Add all browser tabs to the collection
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

      // Move new collection to the top
      space.collections.pop();
      space.collections.unshift(col);
      space.collections.forEach((c, i) => c.order = i);

      await saveAll();
      renderCollections();

      // Close all tabs except the current TagTag page
      const currentTab = await new Promise(resolve => {
        chrome.tabs.getCurrent((t) => resolve(t));
      });
      const tabsToClose = browserTabs.filter(t => t.id !== (currentTab && currentTab.id));
      const idsToClose = tabsToClose.map(t => t.id);
      if (idsToClose.length > 0) {
        try { await chrome.tabs.remove(idsToClose); } catch {}
      }

      // Refresh browser tabs list
      await loadBrowserTabs();
      renderCurrentTabs();
      showToast(`Saved ${tabsToClose.length} tabs!`);
    });
  }

  // ═══ Tab Context Menu ═══

  let tabMenuTarget = null; // { spaceId, collectionId, tab }

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
    const t = col.tabs.find(x => x.id === target.tab.id);
    if (!t) return;

    if (action === 'tab-rename') {
      showModal('Rename Tab', t.title, (newName) => {
        if (newName.trim()) {
          t.title = newName.trim();
          renderCollections();
          saveAll();
        }
      });
    } else if (action === 'tab-edit-url') {
      showModal('Edit URL', t.url, (newUrl) => {
        if (newUrl.trim()) {
          t.url = newUrl.trim();
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
        hideEmojiPicker();
        if (emojiCallback) emojiCallback(emoji);
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

      // Detect format:
      // Format A (TabTab export): { groups: [{ name, tabs: [{ title, url, favIconUrl }] }] }
      // Format B: { collections: [{ name, tabs: [...] }] }
      // Format C: [{ title, url }] — flat array
      let groups;
      if (data.groups && Array.isArray(data.groups)) {
        groups = data.groups;
      } else if (data.collections && Array.isArray(data.collections)) {
        groups = data.collections;
      } else if (Array.isArray(data)) {
        groups = [{ name: file.name.replace('.json', ''), tabs: data }];
      } else {
        showToast('Unsupported JSON format');
        return;
      }

      // Reverse to preserve original order from source
      groups.reverse();

      for (const g of groups) {
        const col = {
          id: StorageManager.generateId(),
          spaceId: space.id,
          name: g.name || 'Untitled',
          icon: '',
          order: space.collections.length,
          tabs: (g.tabs || []).map((t, i) => ({
            id: StorageManager.generateId(),
            collectionId: '',
            title: t.title || t.url || '',
            url: t.url || '',
            favicon: t.favIconUrl || t.favicon || '',
            order: i,
            pinned: false,
            createdAt: Date.now(),
          })),
          collapsed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        col.tabs.forEach(t => t.collectionId = col.id);
        space.collections.push(col);
      }

      space.updatedAt = Date.now();
      await saveAll();

      // Switch to the imported space so middle area shows the result
      switchSpace(space.id);
      showToast(`Imported ${groups.length} collections!`);
    } catch (err) {
      showToast('Failed to import JSON');
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
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  }

  function openUrl(url) {
    try { chrome.tabs.create({ url }); } catch { window.open(url, '_blank'); }
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
