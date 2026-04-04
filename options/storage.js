// StorageManager — wraps chrome.storage.local for Spaces, Collections, SavedTabs

class StorageManager {
  static KEYS = {
    SPACES: 'tagtag_spaces',
    SETTINGS: 'tagtag_settings',
    ACCOUNT: 'tagtag_account',
  };

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ── Spaces ──

  static async getSpaces() {
    const data = await chrome.storage.local.get(StorageManager.KEYS.SPACES);
    return data[StorageManager.KEYS.SPACES] || [];
  }

  static async saveSpaces(spaces) {
    await chrome.storage.local.set({ [StorageManager.KEYS.SPACES]: spaces });
  }

  static async createSpace(name, icon) {
    const spaces = await StorageManager.getSpaces();
    const space = {
      id: StorageManager.generateId(),
      name,
      icon: icon || '',
      order: spaces.length,
      collections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    spaces.push(space);
    await StorageManager.saveSpaces(spaces);
    return space;
  }

  static async updateSpace(spaceId, updates) {
    const spaces = await StorageManager.getSpaces();
    const idx = spaces.findIndex(s => s.id === spaceId);
    if (idx === -1) return null;
    Object.assign(spaces[idx], updates, { updatedAt: Date.now() });
    await StorageManager.saveSpaces(spaces);
    return spaces[idx];
  }

  static async deleteSpace(spaceId) {
    let spaces = await StorageManager.getSpaces();
    spaces = spaces.filter(s => s.id !== spaceId);
    await StorageManager.saveSpaces(spaces);
  }

  // ── Collections ──

  static async addCollection(spaceId, name) {
    const spaces = await StorageManager.getSpaces();
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return null;
    const collection = {
      id: StorageManager.generateId(),
      spaceId,
      name,
      icon: '',
      order: space.collections.length,
      tabs: [],
      collapsed: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    space.collections.unshift(collection);
    space.updatedAt = Date.now();
    await StorageManager.saveSpaces(spaces);
    return collection;
  }

  static async updateCollection(spaceId, collectionId, updates) {
    const spaces = await StorageManager.getSpaces();
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return null;
    const col = space.collections.find(c => c.id === collectionId);
    if (!col) return null;
    Object.assign(col, updates, { updatedAt: Date.now() });
    space.updatedAt = Date.now();
    await StorageManager.saveSpaces(spaces);
    return col;
  }

  static async deleteCollection(spaceId, collectionId) {
    const spaces = await StorageManager.getSpaces();
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return;
    space.collections = space.collections.filter(c => c.id !== collectionId);
    space.updatedAt = Date.now();
    await StorageManager.saveSpaces(spaces);
  }

  // ── Tabs within Collections ──

  static async addTab(spaceId, collectionId, tabData) {
    const spaces = await StorageManager.getSpaces();
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return null;
    const col = space.collections.find(c => c.id === collectionId);
    if (!col) return null;
    const tab = {
      id: StorageManager.generateId(),
      collectionId,
      title: tabData.title || '',
      url: tabData.url || '',
      favicon: tabData.favicon || '',
      order: col.tabs.length,
      pinned: tabData.pinned || false,
      createdAt: Date.now(),
    };
    col.tabs.push(tab);
    col.updatedAt = Date.now();
    space.updatedAt = Date.now();
    await StorageManager.saveSpaces(spaces);
    return tab;
  }

  static async removeTab(spaceId, collectionId, tabId) {
    const spaces = await StorageManager.getSpaces();
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return;
    const col = space.collections.find(c => c.id === collectionId);
    if (!col) return;
    col.tabs = col.tabs.filter(t => t.id !== tabId);
    col.updatedAt = Date.now();
    space.updatedAt = Date.now();
    await StorageManager.saveSpaces(spaces);
  }

  // ── Default Data Seeding ──

  static async seedDefaults(spaceName = 'Default', collectionName = 'Collection', defaultIcon = '') {
    const spaces = await StorageManager.getSpaces();
    if (spaces.length > 0) return; // already seeded
    const spaceId = StorageManager.generateId();
    const colId = StorageManager.generateId();
    const defaultSpace = {
      id: spaceId,
      name: spaceName,
      icon: defaultIcon,
      order: 0,
      collections: [
        {
          id: colId,
          spaceId,
          name: collectionName,
          icon: '',
          order: 0,
          tabs: [
            {
              id: StorageManager.generateId(),
              collectionId: colId,
              title: '微博',
              url: 'https://weibo.com',
              favicon: 'https://www.google.com/s2/favicons?domain=weibo.com&sz=32',
              order: 0,
              pinned: false,
              createdAt: Date.now(),
            },
          ],
          collapsed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await StorageManager.saveSpaces([defaultSpace]);
    return [defaultSpace];
  }

  // ── Settings ──

  static async getSettings() {
    const data = await chrome.storage.local.get(StorageManager.KEYS.SETTINGS);
    return data[StorageManager.KEYS.SETTINGS] || {
      theme: 'dark',
      defaultSpace: '',
      gridColumns: 7,
      autoSave: true,
      syncEnabled: false,
      language: 'en',
      openTabMode: 'redirect',
      showFavicon: true,
      confirmDelete: true,
    };
  }

  static async saveSettings(settings) {
    await chrome.storage.local.set({ [StorageManager.KEYS.SETTINGS]: settings });
  }

  // ── Account ──

  static async getAccount() {
    const data = await chrome.storage.local.get(StorageManager.KEYS.ACCOUNT);
    return data[StorageManager.KEYS.ACCOUNT] || {
      name: 'User',
      plan: 'free',
      avatar: '',
    };
  }

  static async saveAccount(account) {
    await chrome.storage.local.set({ [StorageManager.KEYS.ACCOUNT]: account });
  }

  // ── Bookmark Import ──

  static async importBookmarks(spaceId) {
    const tree = await chrome.bookmarks.getTree();
    const spaces = await StorageManager.getSpaces();
    const space = spaces.find(s => s.id === spaceId);
    if (!space) return;

    function walkFolder(node) {
      if (!node.children) return null;
      const tabs = [];
      const subCollections = [];

      for (const child of node.children) {
        if (child.url) {
          tabs.push({
            id: StorageManager.generateId(),
            collectionId: '',
            title: child.title || child.url,
            url: child.url,
            favicon: `https://www.google.com/s2/favicons?domain=${new URL(child.url).hostname}&sz=32`,
            order: tabs.length,
            pinned: false,
            createdAt: Date.now(),
          });
        } else if (child.children) {
          subCollections.push(child);
        }
      }
      return { tabs, subCollections };
    }

    const root = tree[0];
    const barAndOther = root.children || [];

    for (const folder of barAndOther) {
      if (!folder.children) continue;
      for (const subfolder of folder.children) {
        if (!subfolder.children) {
          if (subfolder.url) {
            // top-level bookmark — add to a "Bookmarks" collection
            let col = space.collections.find(c => c.name === folder.title);
            if (!col) {
              col = {
                id: StorageManager.generateId(),
                spaceId,
                name: folder.title,
                icon: '',
                order: space.collections.length,
                tabs: [],
                collapsed: false,
                createdAt: Date.now(),
                updatedAt: Date.now(),
              };
              space.collections.push(col);
            }
            col.tabs.push({
              id: StorageManager.generateId(),
              collectionId: col.id,
              title: subfolder.title || subfolder.url,
              url: subfolder.url,
              favicon: `https://www.google.com/s2/favicons?domain=${new URL(subfolder.url).hostname}&sz=32`,
              order: col.tabs.length,
              pinned: false,
              createdAt: Date.now(),
            });
          }
          continue;
        }
        const result = walkFolder(subfolder);
        if (result && result.tabs.length > 0) {
          const col = {
            id: StorageManager.generateId(),
            spaceId,
            name: subfolder.title || 'Untitled',
            icon: '',
            order: space.collections.length,
            tabs: result.tabs,
            collapsed: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          col.tabs.forEach(t => t.collectionId = col.id);
          space.collections.push(col);
        }
      }
    }

    space.updatedAt = Date.now();
    await StorageManager.saveSpaces(spaces);
  }
}
