// StorageManager — wraps chrome.storage.local for TagTag data format
// Data structure matches tagtag_backup.json format

class StorageManager {
  static KEYS = {
    DATA: 'tagtag_data',  // Stores {version, space_list, spaces}
    SETTINGS: 'tagtag_settings',
    ACCOUNT: 'tagtag_account',
  };

  // Generate timestamp-based ID for spaces
  static generateId() {
    return Date.now().toString();
  }

  // Generate UUID for tabs (format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Generate group ID with prefix
  static generateGroupId() {
    return `group_${Date.now()}`;
  }

  // ── Data Structure Management ──

  static async getData() {
    const result = await chrome.storage.local.get(StorageManager.KEYS.DATA);
    return result[StorageManager.KEYS.DATA] || {
      version: Date.now(),
      space_list: [],
      spaces: {}
    };
  }

  static async saveData(data) {
    data.version = Date.now();
    await chrome.storage.local.set({ [StorageManager.KEYS.DATA]: data });
  }

  // ── Spaces ──

  static async getSpaces() {
    const data = await StorageManager.getData();
    return Object.values(data.spaces);
  }

  static async getSpaceList() {
    const data = await StorageManager.getData();
    return data.space_list;
  }

  static async createSpace(name, icon) {
    const data = await StorageManager.getData();
    const id = StorageManager.generateId();
    
    const space = {
      id,
      name,
      groups: [],
      pins: {}
    };

    // Add to spaces map
    data.spaces[id] = space;
    
    // Add to space_list
    data.space_list.push({
      id,
      name,
      icon: icon || ''
    });

    await StorageManager.saveData(data);
    return space;
  }

  static async updateSpace(spaceId, updates) {
    const data = await StorageManager.getData();
    const space = data.spaces[spaceId];
    if (!space) return null;

    Object.assign(space, updates);

    // Update space_list if name changed
    if (updates.name) {
      const listItem = data.space_list.find(s => s.id === spaceId);
      if (listItem) listItem.name = updates.name;
    }

    await StorageManager.saveData(data);
    return space;
  }

  static async deleteSpace(spaceId) {
    const data = await StorageManager.getData();
    delete data.spaces[spaceId];
    data.space_list = data.space_list.filter(s => s.id !== spaceId);
    await StorageManager.saveData(data);
  }

  static async updateSpaceIcon(spaceId, icon) {
    const data = await StorageManager.getData();
    const listItem = data.space_list.find(s => s.id === spaceId);
    if (listItem) {
      listItem.icon = icon;
      await StorageManager.saveData(data);
    }
  }

  // ── Groups (Collections) ──

  static async addGroup(spaceId, name) {
    const data = await StorageManager.getData();
    const space = data.spaces[spaceId];
    if (!space) return null;

    const group = {
      id: StorageManager.generateGroupId(),
      name,
      tabs: []
    };

    space.groups.unshift(group);
    await StorageManager.saveData(data);
    return group;
  }

  static async updateGroup(spaceId, groupId, updates) {
    const data = await StorageManager.getData();
    const space = data.spaces[spaceId];
    if (!space) return null;
    
    const group = space.groups.find(g => g.id === groupId);
    if (!group) return null;
    
    Object.assign(group, updates);
    await StorageManager.saveData(data);
    return group;
  }

  static async deleteGroup(spaceId, groupId) {
    const data = await StorageManager.getData();
    const space = data.spaces[spaceId];
    if (!space) return;
    
    space.groups = space.groups.filter(g => g.id !== groupId);
    await StorageManager.saveData(data);
  }

  // ── Tabs within Groups ──

  static async addTab(spaceId, groupId, tabData) {
    const data = await StorageManager.getData();
    const space = data.spaces[spaceId];
    if (!space) return null;
    
    const group = space.groups.find(g => g.id === groupId);
    if (!group) return null;

    const tab = {
      id: StorageManager.generateUUID(),
      title: tabData.title || '',
      url: tabData.url || '',
      favIconUrl: tabData.favIconUrl || tabData.favicon || '',
      kind: 'record'
    };

    group.tabs.push(tab);
    await StorageManager.saveData(data);
    return tab;
  }

  static async removeTab(spaceId, groupId, tabId) {
    const data = await StorageManager.getData();
    const space = data.spaces[spaceId];
    if (!space) return;
    
    const group = space.groups.find(g => g.id === groupId);
    if (!group) return;
    
    group.tabs = group.tabs.filter(t => t.id !== tabId);
    await StorageManager.saveData(data);
  }

  static async updateTab(spaceId, groupId, tabId, updates) {
    const data = await StorageManager.getData();
    const space = data.spaces[spaceId];
    if (!space) return null;
    
    const group = space.groups.find(g => g.id === groupId);
    if (!group) return null;
    
    const tab = group.tabs.find(t => t.id === tabId);
    if (!tab) return null;

    Object.assign(tab, updates);
    await StorageManager.saveData(data);
    return tab;
  }

  // ── Default Data Seeding ──

  static async seedDefaults(spaceName = 'Default', collectionName = 'Collection', defaultIcon = '') {
    const data = await StorageManager.getData();
    if (data.space_list.length > 0) return; // already seeded

    const spaceId = StorageManager.generateId();
    const groupId = StorageManager.generateGroupId();
    
    const defaultSpace = {
      id: spaceId,
      name: spaceName,
      groups: [
        {
          id: groupId,
          name: collectionName,
          tabs: [
            {
              id: StorageManager.generateUUID(),
              title: '微博',
              url: 'https://weibo.com',
              favIconUrl: 'https://www.google.com/s2/favicons?domain=weibo.com&sz=32',
              kind: 'record'
            }
          ]
        }
      ],
      pins: {}
    };

    data.spaces[spaceId] = defaultSpace;
    data.space_list.push({
      id: spaceId,
      name: spaceName,
      icon: defaultIcon
    });

    await StorageManager.saveData(data);
    return [defaultSpace];
  }

  // ── Settings ──

  static async getSettings() {
    const data = await chrome.storage.local.get(StorageManager.KEYS.SETTINGS);
    return data[StorageManager.KEYS.SETTINGS] || {
      theme: 'zinc',
      tabStyle: 'vertical',
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

  // ── Import from Backup ──

  static async importFromBackup(backupData) {
    // Validate backup format
    if (!backupData.spaces || !backupData.space_list) {
      throw new Error('Invalid backup format');
    }

    // Helper to generate random emoji
    const emojis = ['🪟','📌','📚','⏳','🚀','💡','🎯','🔥','⭐','💻','🎨','🎵','📝','📊','🔧','🌐','📁','🏠','🧪','🎮','📱','🛒','💼','🔍','❤️','🌟','🎬','📸','🍕','☕','🌈','🦄','🐱','🐶','🌺','🍀','🏆','🎁','🔔','💎','🧩','🗂️','📮','🛠️','🔒','🌍','🎓','📐'];
    const randomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

    // Helper to check if string is an emoji
    const isEmoji = (str) => {
      if (!str) return false;
      // Emoji regex pattern
      const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}]|[\u{2B06}]|[\u{2B07}]|[\u{2B05}]|[\u{27A1}]|[\u{2194}-\u{2199}]|[\u{2194}]|[\u{21A9}-\u{21AA}]|[\u{2934}-\u{2935}]|[\u{25AA}-\u{25AB}]|[\u{25FE}-\u{25FF}]|[\u{25FB}-\u{25FC}]|[\u{25FD}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{FE0F}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]/u;
      return emojiPattern.test(str);
    };

    const reverseGroups = (groups = []) => [...groups].reverse();

    const data = {
      version: Date.now(),
      space_list: backupData.space_list.map(s => ({
        id: s.id,
        name: s.name,
        // Assign random emoji if no icon or icon is not an emoji
        icon: isEmoji(s.icon) ? s.icon : randomEmoji()
      })),
      spaces: {}
    };

    // Convert spaces object
    for (const [spaceId, spaceData] of Object.entries(backupData.spaces)) {
      data.spaces[spaceId] = {
        id: spaceData.id,
        name: spaceData.name,
        groups: reverseGroups(spaceData.groups).map(g => ({
          id: g.id,
          name: g.name,
          tabs: (g.tabs || []).map(t => ({
            id: t.id,
            title: t.title || '',
            url: t.url || '',
            favIconUrl: t.favIconUrl || '',
            kind: t.kind || 'record'
          }))
        })),
        pins: spaceData.pins || {}
      };
    }

    await StorageManager.saveData(data);
    return data;
  }

  // ── Merge from Backup ──

  static async mergeFromBackup(backupData) {
    // Validate backup format
    if (!backupData.spaces || !backupData.space_list) {
      throw new Error('Invalid backup format');
    }

    const existingData = await StorageManager.getData();
    
    // Helper to generate random emoji
    const emojis = ['🪟','📌','📚','⏳','🚀','💡','🎯','🔥','⭐','💻','🎨','🎵','📝','📊','🔧','🌐','📁','🏠','🧪','🎮','📱','🛒','💼','🔍','❤️','🌟','🎬','📸','🍕','☕','🌈','🦄','🐱','🐶','🌺','🍀','🏆','🎁','🔔','💎','🧩','🗂️','📮','🛠️','🔒','🌍','🎓','📐'];
    const randomEmoji = () => emojis[Math.floor(Math.random() * emojis.length)];

    // Helper to check if string is an emoji
    const isEmoji = (str) => {
      if (!str) return false;
      const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}]|[\u{2B06}]|[\u{2B07}]|[\u{2B05}]|[\u{27A1}]|[\u{2194}-\u{2199}]|[\u{2194}]|[\u{21A9}-\u{21AA}]|[\u{2934}-\u{2935}]|[\u{25AA}-\u{25AB}]|[\u{25FE}-\u{25FF}]|[\u{25FB}-\u{25FC}]|[\u{25FD}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[\u{FE0F}]|[\u{200D}]|[\u{20E3}]|[\u{E0020}-\u{E007F}]/u;
      return emojiPattern.test(str);
    };

    const reverseGroups = (groups = []) => [...groups].reverse();

    // Merge space_list - add new spaces, keep existing ones
    const existingSpaceIds = new Set(existingData.space_list.map(s => s.id));
    
    for (const spaceInfo of backupData.space_list) {
      if (!existingSpaceIds.has(spaceInfo.id)) {
        // New space - add with random emoji if icon is not an emoji
        existingData.space_list.push({
          id: spaceInfo.id,
          name: spaceInfo.name,
          icon: isEmoji(spaceInfo.icon) ? spaceInfo.icon : randomEmoji()
        });
      }
    }

    // Merge spaces data
    for (const [spaceId, spaceData] of Object.entries(backupData.spaces)) {
      if (!existingData.spaces[spaceId]) {
        // New space - add it
        existingData.spaces[spaceId] = {
          id: spaceData.id,
          name: spaceData.name,
          groups: reverseGroups(spaceData.groups).map(g => ({
            id: g.id,
            name: g.name,
            tabs: (g.tabs || []).map(t => ({
              id: t.id,
              title: t.title || '',
              url: t.url || '',
              favIconUrl: t.favIconUrl || '',
              kind: t.kind || 'record'
            }))
          })),
          pins: spaceData.pins || {}
        };
      }
      // If space exists, we don't merge groups to avoid conflicts
      // User can manually import specific spaces if needed
    }

    existingData.version = Date.now();
    await StorageManager.saveData(existingData);
    return existingData;
  }

  // ── Export to Backup ──

  static async exportToBackup() {
    const data = await StorageManager.getData();
    const spaces = Object.fromEntries(
      Object.entries(data.spaces || {}).map(([spaceId, spaceData]) => {
        const { displayReverseGroups, ...exportableSpace } = spaceData || {};
        return [spaceId, exportableSpace];
      })
    );

    return {
      version: Date.now(),
      space_list: data.space_list,
      spaces
    };
  }

  // ── Bookmark Import ──

  static async importBookmarks(spaceId) {
    const tree = await chrome.bookmarks.getTree();
    const data = await StorageManager.getData();
    const space = data.spaces[spaceId];
    if (!space) return;

    function walkFolder(node) {
      if (!node.children) return null;
      const tabs = [];
      const subGroups = [];

      for (const child of node.children) {
        if (child.url) {
          tabs.push({
            id: StorageManager.generateUUID(),
            title: child.title || child.url,
            url: child.url,
            favIconUrl: `https://www.google.com/s2/favicons?domain=${new URL(child.url).hostname}&sz=32`,
            kind: 'record'
          });
        } else if (child.children) {
          subGroups.push(child);
        }
      }
      return { tabs, subGroups };
    }

    const root = tree[0];
    const barAndOther = root.children || [];

    for (const folder of barAndOther) {
      if (!folder.children) continue;
      for (const subfolder of folder.children) {
        if (!subfolder.children) {
          if (subfolder.url) {
            // top-level bookmark — add to a "Bookmarks" group
            let group = space.groups.find(g => g.name === folder.title);
            if (!group) {
              group = {
                id: StorageManager.generateGroupId(),
                name: folder.title,
                tabs: []
              };
              space.groups.push(group);
            }
            group.tabs.push({
              id: StorageManager.generateUUID(),
              title: subfolder.title || subfolder.url,
              url: subfolder.url,
              favIconUrl: `https://www.google.com/s2/favicons?domain=${new URL(subfolder.url).hostname}&sz=32`,
              kind: 'record'
            });
          }
          continue;
        }
        const result = walkFolder(subfolder);
        if (result && result.tabs.length > 0) {
          const group = {
            id: StorageManager.generateGroupId(),
            name: subfolder.title || 'Untitled',
            tabs: result.tabs
          };
          space.groups.push(group);
        }
      }
    }

    await StorageManager.saveData(data);
  }
}
