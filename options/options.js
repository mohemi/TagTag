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
  const $saveBtn = document.getElementById('saveBtn');
  const $userName = document.getElementById('userName');
  const $planBadge = document.getElementById('planBadge');
  const $modalOverlay = document.getElementById('modalOverlay');
  const $modalTitle = document.getElementById('modalTitle');
  const $modalInput = document.getElementById('modalInput');
  const $modalConfirm = document.getElementById('modalConfirm');
  const $modalCancel = document.getElementById('modalCancel');
  const $modalClose = document.getElementById('modalClose');
  const $contextMenu = document.getElementById('contextMenu');
  const $jsonFileInput = document.getElementById('jsonFileInput');

  // ═══ Init ═══

  async function init() {
    await StorageManager.seedDefaults();
    spaces = await StorageManager.getSpaces();

    const settings = await StorageManager.getSettings();
    activeSpaceId = settings.defaultSpace || (spaces[0] && spaces[0].id);

    await loadBrowserTabs();
    await loadAccount();

    renderSpaces();
    renderCollections();
    renderCurrentTabs();
    bindEvents();
  }

  async function loadBrowserTabs() {
    try {
      browserTabs = await chrome.tabs.query({});
    } catch {
      browserTabs = [];
    }
  }

  async function loadAccount() {
    const account = await StorageManager.getAccount();
    $userName.textContent = account.name;
    $planBadge.textContent = account.plan === 'pro' ? 'Pro' : 'Free';
    if (account.plan === 'pro') $planBadge.classList.add('pro');
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

      // ── Header (draggable for reorder) ──
      const header = document.createElement('div');
      header.className = 'collection-header';
      header.draggable = true;
      header.innerHTML = `
        <span class="collection-drag-handle" title="Drag to reorder">⠿</span>
        <span class="collection-toggle ${col.collapsed ? 'collapsed' : ''}">▼</span>
        <span class="collection-name">${esc(col.name)}</span>
        <div class="collection-actions">
          <button class="btn-icon collection-rename-btn" title="Rename" style="font-size:13px">✎</button>
          <button class="btn-icon collection-delete-btn" title="Delete" style="font-size:14px">&times;</button>
        </div>
      `;

      // Collection drag reorder
      header.addEventListener('dragstart', (e) => {
        dragSource = { type: 'collection', spaceId: space.id, collectionId: col.id };
        e.dataTransfer.setData('text/plain', col.id);
        e.dataTransfer.effectAllowed = 'move';
        section.classList.add('dragging');
      });
      header.addEventListener('dragend', () => {
        section.classList.remove('dragging');
        dragSource = null;
        document.querySelectorAll('.collection-section.drag-above, .collection-section.drag-below').forEach(el => {
          el.classList.remove('drag-above', 'drag-below');
        });
      });

      // Drop target for collection reorder
      section.addEventListener('dragover', (e) => {
        if (!dragSource || dragSource.type !== 'collection') return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const rect = section.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        section.classList.remove('drag-above', 'drag-below');
        if (e.clientY < midY) {
          section.classList.add('drag-above');
        } else {
          section.classList.add('drag-below');
        }
      });
      section.addEventListener('dragleave', () => {
        section.classList.remove('drag-above', 'drag-below');
      });
      section.addEventListener('drop', (e) => {
        e.preventDefault();
        section.classList.remove('drag-above', 'drag-below');
        if (!dragSource || dragSource.type !== 'collection') return;
        if (dragSource.collectionId === col.id) return;

        const fromIdx = space.collections.findIndex(c => c.id === dragSource.collectionId);
        const toIdx = space.collections.findIndex(c => c.id === col.id);
        if (fromIdx === -1 || toIdx === -1) return;

        const [moved] = space.collections.splice(fromIdx, 1);
        const rect = section.getBoundingClientRect();
        const midY = e.clientY;
        const insertIdx = midY < rect.top + rect.height / 2 ? toIdx : toIdx + (fromIdx < toIdx ? 0 : 1);
        space.collections.splice(insertIdx, 0, moved);

        space.collections.forEach((c, i) => c.order = i);
        renderCollections();
        saveAll();
        showToast(`Moved "${moved.name}"`);
      });

      header.addEventListener('click', (e) => {
        if (e.target.closest('.collection-actions') || e.target.closest('.collection-drag-handle')) return;
        col.collapsed = !col.collapsed;
        renderCollections();
        saveAll();
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
      const grid = document.createElement('div');
      grid.className = 'tab-grid' + (col.collapsed ? ' hidden' : '');
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

      const tabs = filterTabs(col.tabs);
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
      <img class="tab-favicon" src="${esc(faviconUrl)}" alt=""
        onerror="this.onerror=null;this.src='https://www.google.com/s2/favicons?domain=${esc(domain)}&sz=32'">
      <span class="tab-title">${esc(tab.title)}</span>
      <span class="tab-domain">${esc(domain)}</span>
      <button class="tab-remove" title="Remove">&times;</button>
    `;

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

    // Remove
    card.querySelector('.tab-remove').addEventListener('click', () => {
      const sp = spaces.find(s => s.id === spaceId);
      if (!sp) return;
      const c = sp.collections.find(c => c.id === collectionId);
      if (!c) return;
      c.tabs = c.tabs.filter(t => t.id !== tab.id);
      renderCollections();
      saveAll();
    });

    return card;
  }

  // ═══ Render: Right Sidebar (Current Browser Tabs) ═══

  function renderCurrentTabs() {
    $currentTabsList.innerHTML = '';
    const list = searchQuery
      ? browserTabs.filter(t =>
          (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.url || '').toLowerCase().includes(searchQuery.toLowerCase()))
      : browserTabs;

    list.forEach(tab => {
      const li = document.createElement('li');
      li.className = 'current-tab-item';
      li.draggable = true;

      const favicon = tab.favIconUrl || `https://www.google.com/s2/favicons?domain=${getDomain(tab.url)}&sz=16`;
      li.innerHTML = `
        <img src="${esc(favicon)}" alt="" onerror="this.style.display='none'">
        <span>${esc(tab.title || tab.url || 'Untitled')}</span>
      `;

      li.addEventListener('click', () => {
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
        const sp = await StorageManager.createSpace(name.trim());
        spaces = await StorageManager.getSpaces();
        switchSpace(sp.id);
      });
    });

    $addCollectionBtn.addEventListener('click', () => {
      if (!activeSpaceId) return;
      showModal('New Collection', '', async (name) => {
        if (!name.trim()) return;
        await StorageManager.addCollection(activeSpaceId, name.trim());
        spaces = await StorageManager.getSpaces();
        renderCollections();
      });
    });

    $saveBtn.addEventListener('click', async () => {
      await saveAll();
      showToast('Saved!');
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
      }
    });

    document.addEventListener('click', () => hideContextMenu());

    document.getElementById('settingsBtn').addEventListener('click', () => showToast('Settings coming soon'));
  }

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

  function hideContextMenu() { $contextMenu.hidden = true; }

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

  // ═══ Start ═══
  await init();
})();
