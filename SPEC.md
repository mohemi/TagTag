# TagTag - Chrome 标签管理插件 开发规格文档 (Spec)

## 1. 产品概述

**产品名称**: TagTag - Tab Management Tool  
**产品类型**: Chrome 浏览器扩展 (Extension)  
**核心定位**: 模仿 TabTab，提供强大的标签页分组管理、空间隔离和数据导入功能，帮助用户高效管理大量浏览器标签页。  
**入口**: 新标签页 (New Tab Override) 自动打开主界面；也可通过插件图标弹窗进入

---

## 2. 核心功能模块

### 2.1 空间管理 (Spaces)

#### 功能描述
左侧边栏提供 **Spaces（空间）** 概念，用于将标签页按工作场景/项目进行逻辑隔离分组。

#### 功能点
- **默认空间**: 系统预置空间列表
- **自定义空间**: 用户可创建自定义空间，每个空间有独立名称
- **空间切换**: 点击左侧空间名称即可切换到对应空间
- **空间管理**: 支持新建空间（左侧栏顶部 `+` 按钮）

#### 已识别的空间列表（从截图提取）
| 空间名称 | 说明 |
|---------|------|
| Window | 当前窗口标签页 |
| Fix | 固定标签页 |
| Imported from Bookmarks | 从书签导入的标签页 |
| Temp | 临时标签页空间 |

#### 技术要点
- 使用 `chrome.storage` API 持久化空间数据
- 空间与窗口 (Window) 可关联也可独立
- 支持从 Chrome 书签 (Bookmarks) 导入

---

### 2.2 标签页集合 (Collections / Sections)

#### 功能描述
在每个空间内部，标签页可进一步按 **集合/分区 (Section)** 进行分组管理，每个集合可折叠/展开。

#### 已识别的集合分区（从截图提取）
| 分区名称 | 包含内容 |
|---------|---------|
| 常用 | 微博、网易云音乐、少数派、LINUX DO、My Reviews、Weibo Client Team 等常用站点 |
| 微博 | 微博相关开发/运维链接（微博客户端首页友助手、iOS 首推打包平台、开关二维码生成器、线上微博信息存档 等） |
| 微博Log | Pecker-iOS、Pecker-Android、GIF 流量分析相关C端-Kibana、Discover-Elastic 等日志监控工具 |
| Bookmarks | Compiler Explorer、首页-KuangStudy、各类开发资源和工具收藏 |
| AI | 大模型Maas平台、Models(心选开放平台)、智能AI开放平台、Sitecast、ZAPI、Backend、Stitch-Design with AI 等 |

#### 功能点
- **折叠/展开**: 每个分区可折叠和展开（分区名左侧箭头图标）
- **新建集合**: 顶部 `+ Add collection` 按钮
- **分区排序**: 分区间可能支持拖拽排序

---

### 2.3 标签页展示 (Tab Display)

#### 功能描述
主内容区域以 **网格 (Grid)** 布局展示标签页卡片。

#### 单个标签页卡片信息
- **网站图标 (Favicon)**: 标签页对应网站的图标
- **标签页标题 (Title)**: 页面标题文字
- **网站域名/描述**: 简短的站点描述或URL

#### 布局方式
- 网格布局，每行约 6-7 个卡片（响应式）
- 卡片统一尺寸，紧凑排列
- 深色主题 (Dark Theme) UI

---

### 2.4 顶部操作栏 (Top Bar)

#### 功能点
| 功能 | 描述 |
|-----|------|
| **Window 切换** | 左上角显示当前空间名 "Window"，可能支持多窗口切换 |
| **搜索标签页** | 🔍 `Search Tabs` 搜索框，支持按标题/URL快速过滤标签页 |
| **添加集合** | `+ Add collection` 按钮，在当前空间新建集合 |
| **标签页计数** | `Tabs (8)` 显示当前空间/选中集合的标签页数量 |
| **保存** | `Save` 按钮，保存当前空间配置 |
| **设置入口** | 右上角可能有设置/更多选项 |

---

### 2.5 右侧面板 (Right Sidebar)

#### 功能描述
右侧展示一个竖向面板，呈现当前打开的所有浏览器标签页列表。

#### 已识别的标签页列表（从截图提取）
- WeCode Analysis - Weibao
- Change is329a387 - iicommons打好下方评...
- Understand AnythingREADME.zh-...
- alidocs.dingtalk.com
- 大图无分辨率优化 - ETC交互...
- LivePhoto视频帧URL直读改造 相关交互优化修改 - ETC交...
- WeiboLLMGateway
- 开头一 (MediaProducer...）

#### 功能点
- 显示所有当前打开的 Chrome 标签页
- 每个标签显示 favicon + 标题
- 可能支持点击跳转到对应标签页
- 可能支持拖拽标签页到左侧空间/集合中

---

### 2.6 底部状态栏 (Bottom Bar)

#### 功能点
- **用户信息**: 显示登录用户名（如 "Sheldon Huang"）
- **账户类型标识**: 显示 `Pro` 标签（红色徽章），表明付费/高级版本
- **设置入口**: ⚙️ `Settings` 按钮

---

## 3. 关键交互流程

### 3.1 标签页组织流程
```
用户打开 TagTag → 查看当前窗口所有标签 → 创建/选择空间 → 
在空间中创建集合 → 将标签拖拽/分配到对应集合 → 保存
```

### 3.2 标签页搜索流程
```
用户点击 Search Tabs → 输入关键词 → 
实时过滤匹配的标签页 → 点击目标标签页 → 切换到对应标签
```

### 3.3 书签导入流程
```
用户选择 "Imported from Bookmarks" 空间 → 
系统读取 Chrome 书签 → 按书签文件夹映射为集合 → 展示书签内容
```

---

## 4. 技术架构

### 4.1 Chrome Extension API 依赖

| API | 用途 |
|-----|------|
| `chrome.tabs` | 获取/管理当前打开的标签页 |
| `chrome.windows` | 获取/管理浏览器窗口 |
| `chrome.bookmarks` | 读取/导入用户书签 |
| `chrome.storage` | 持久化空间、集合等用户数据 |
| `chrome.tabGroups` | Chrome 标签组功能集成（可选） |
| `chrome.sidePanel` | 侧边栏面板（如右侧标签列表，可选） |

### 4.2 Extension 结构

```
TagTag/
├── manifest.json              # 插件清单文件 (Manifest V3)
├── options/
│   ├── options.html           # 选项页主页面（主界面）
│   ├── options.js             # 选项页逻辑
│   └── options.css            # 样式
├── background/
│   └── service-worker.js      # 后台服务工作线程
├── popup/
│   ├── popup.html             # 弹出页（可选，快捷入口）
│   └── popup.js
├── sidepanel/                 # 侧边栏（可选）
│   ├── sidepanel.html
│   └── sidepanel.js
├── assets/
│   └── icons/                 # 插件图标
└── lib/                       # 第三方库
```

### 4.3 manifest.json 关键配置

```json
{
  "manifest_version": 3,
  "name": "TagTag - Tab Management Tool",
  "version": "1.0.0",
  "description": "A powerful tab management tool for organizing browser tabs into spaces and collections.",
  "permissions": [
    "tabs",
    "bookmarks",
    "storage",
    "tabGroups"
  ],
  "options_page": "options/options.html",
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "assets/icons/icon16.png",
      "48": "assets/icons/icon48.png",
      "128": "assets/icons/icon128.png"
    }
  }
}
```

---

## 5. UI / 设计规格

### 5.1 整体布局

```
┌──────────────────────────────────────────────────────────────────────┐
│  [TagTag Logo]  Window            🔍 Search Tabs  + Add collection  │
│                                                      Tabs(8)  Save  │
├──────────┬──────────────────────────────────────────┬───────────────┤
│          │                                          │               │
│ Spaces   │   集合标题 (常用)  ▾                       │  当前标签页    │
│          │   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │  列表         │
│ • Window │   │ Tab │ │ Tab │ │ Tab │ │ Tab │       │               │
│ • Fix    │   └─────┘ └─────┘ └─────┘ └─────┘       │  • Tab 1     │
│ • Import │   ┌─────┐ ┌─────┐ ┌─────┐               │  • Tab 2     │
│ • Temp   │   │ Tab │ │ Tab │ │ Tab │               │  • Tab 3     │
│          │   └─────┘ └─────┘ └─────┘               │  • Tab 4     │
│          │                                          │               │
│          │   集合标题 (微博)  ▾                       │               │
│          │   ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐       │               │
│          │   │ Tab │ │ Tab │ │ Tab │ │ Tab │       │               │
│          │   └─────┘ └─────┘ └─────┘ └─────┘       │               │
├──────────┴──────────────────────────────────────────┴───────────────┤
│  👤 Sheldon Huang                                                    │
│  ⚙️ Settings                                                         │
└──────────────────────────────────────────────────────────────────────┘
```

### 5.2 设计规范

| 属性 | 值 |
|-----|-----|
| **主题** | 深色主题 (Dark Theme) |
| **背景色** | 主背景 `#1a1a2e` ~ `#16213e`（深蓝灰） |
| **侧边栏背景** | `#0f0f1a`（更深色） |
| **卡片背景** | `#2a2a3e`（稍浅灰） |
| **文字颜色** | 主文字 `#e0e0e0`，次要文字 `#888888` |
| **强调色** | 蓝色系 / 紫色系 |
| **卡片圆角** | `8px` |
| **卡片间距** | `12px` |
| **字体** | 系统默认 sans-serif |

---

## 6. 数据模型

### 6.1 核心数据结构

```typescript
// 空间
interface Space {
  id: string;
  name: string;
  icon?: string;
  order: number;
  collections: Collection[];
  createdAt: number;
  updatedAt: number;
}

// 集合
interface Collection {
  id: string;
  spaceId: string;
  name: string;
  icon?: string;
  order: number;
  tabs: SavedTab[];
  collapsed: boolean;
  createdAt: number;
  updatedAt: number;
}

// 保存的标签页
interface SavedTab {
  id: string;
  collectionId: string;
  title: string;
  url: string;
  favicon: string;
  order: number;
  pinned: boolean;
  createdAt: number;
}

// 用户配置
interface UserSettings {
  theme: 'dark' | 'light';
  defaultSpace: string;
  gridColumns: number;
  autoSave: boolean;
  syncEnabled: boolean;
}

// 用户账户
interface UserAccount {
  name: string;
  plan: 'free' | 'pro';
  avatar?: string;
}
```

---

## 7. 功能优先级 (MVP)

### P0 - 核心功能
- [ ] 空间 (Spaces) 的创建、切换、删除
- [ ] 集合 (Collections) 的创建、折叠、删除
- [ ] 标签页读取与网格展示
- [ ] 标签页分配到集合（拖拽或菜单操作）
- [ ] 数据持久化 (chrome.storage)
- [ ] 深色主题 UI

### P1 - 重要功能
- [ ] 标签页搜索 (Search Tabs)
- [ ] 右侧当前标签页列表面板
- [ ] 书签导入功能
- [ ] 标签页点击跳转
- [ ] 保存/恢复空间配置

### P2 - 增强功能
- [ ] 用户账户系统 (登录/Pro标识)
- [ ] 拖拽排序（标签页、集合、空间）
- [ ] 亮色主题切换
- [ ] 数据云同步
- [ ] 设置页面

---

## 8. 非功能需求

| 需求 | 描述 |
|-----|------|
| **性能** | 支持管理 100+ 标签页不卡顿，选项页加载 < 1s |
| **兼容性** | Chrome 88+（Manifest V3 最低要求） |
| **存储** | 使用 `chrome.storage.local`，数据上限 ~5MB；Pro 版可用 `chrome.storage.sync` 跨设备同步 |
| **安全** | 不收集用户浏览数据，所有数据本地存储；最小权限原则 |
| **无障碍** | 支持键盘导航，合理的 ARIA 标签 |

---

## 9. 参考信息

- **截图来源**: `TagTag截图.jpg`
- **Chrome Extension 文档**: https://developer.chrome.com/docs/extensions/
- **Manifest V3 迁移指南**: https://developer.chrome.com/docs/extensions/develop/migrate
