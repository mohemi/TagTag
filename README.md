# TagTag

TagTag 是一个基于 Chrome Manifest V3 的标签管理扩展，用于把浏览器标签按 `Space -> Collection -> Tab` 组织起来。

主入口是新标签页，扩展图标弹窗也可以快速打开主界面。

## 功能概览

### 1. Spaces 空间管理

- 创建空间
- 切换空间
- 重命名空间
- 删除空间
- 修改空间图标
- 左侧空间列表支持收起

### 2. Collections 分组管理

- 在当前空间下创建 Collection
- 重命名 Collection
- 删除 Collection
- 将 Collection 移动到其他 Space
- 分组支持拖拽排序
- 分组 hover 菜单支持中英文文案

### 3. Tab 管理

- 中间区域以卡片网格展示已保存标签
- 点击卡片打开标签
- 卡片支持拖拽到其他 Collection
- 支持批量选择、批量移动、批量删除、批量创建新分组
- 右侧展示当前浏览器打开的标签列表
- 右侧标签可点击切换、关闭、拖入 Collection
- 支持一键保存右侧当前打开标签到当前 Space

### 4. 搜索与交互

- 支持按标题和 URL 搜索标签
- 支持深色 / 浅色 / 跟随系统主题
- 支持中英文界面
- 支持标签打开方式设置：
  - 当前标签页打开
  - 新标签页打开

### 5. 导入导出

- 导出完整备份 JSON
- 导入完整备份 JSON
- 支持导入模式：
  - 覆盖本地
  - 合并到本地
- 支持导出单个 Space 的 JSON
- 支持把 JSON 导入到已有 Space
- 支持从 Chrome 书签导入

说明：

- 现在所有 JSON 导入相关功能，导入后的 `Collections` 顺序都会按文件中的逆序写入本地。

### 6. WebDAV 远程同步

当前已支持坚果云 WebDAV：

- 测试连接
- 探测服务是否在线
- 校验目录是否存在
- 目录不存在时自动创建
- 本地覆盖远程
- 远程覆盖本地
- 自动同步上传

默认目录：

- `https://dav.jianguoyun.com/dav/TagTag/`

远程文件名：

- `tagtag_backup.json`

### 7. Popup / Background

- Popup 显示当前浏览器标签数量
- Popup 可直接打开主界面
- 安装扩展后会自动打开主界面

## 安装方式

### 开发模式加载

1. 打开 `chrome://extensions`
2. 打开右上角 `Developer mode`
3. 点击 `Load unpacked`
4. 选择当前项目根目录

## 权限说明

扩展当前使用到的权限：

- `tabs`
- `bookmarks`
- `storage`
- `tabGroups`
- `https://dav.jianguoyun.com/*`

## 目录结构

```text
TagTag/
├── manifest.json
├── README.md
├── SPEC.md
├── assets/
│   └── icons/
├── background/
│   └── service-worker.js
├── options/
│   ├── options.html
│   ├── options.css
│   ├── options.js
│   ├── storage.js
│   └── i18n.js
└── popup/
    ├── popup.html
    └── popup.js
```

## 数据结构

核心数据保存在 `chrome.storage.local`，主要结构如下：

```json
{
  "version": 0,
  "space_list": [],
  "spaces": {}
}
```

其中：

- `space_list` 用于左侧空间列表
- `spaces[spaceId].groups` 用于中间 Collections
- `groups[].tabs` 用于每个分组下的标签数据

## 已知限制

- GitHub Gist Sync 入口已保留，但当前仍是开发中，点击只会提示“暂未提供”
- WebDAV 自动同步目前是页面级监听：
  - 只有在主界面打开时，本地数据变化才会触发自动上传
  - 还没有下沉到 background service worker
- WebDAV 当前只针对坚果云路径做了默认兼容

## 建议测试项

- 创建 / 删除 / 重命名 Space
- 创建 / 删除 / 重命名 / 移动 Collection
- 拖拽标签卡片到其他分组
- 从右侧当前标签列表拖入 Collection
- 导出备份并重新导入
- 从书签导入
- WebDAV 测试连接
- WebDAV 本地覆盖远程
- WebDAV 远程覆盖本地
- 开启 Auto Sync 后修改本地数据并观察远程文件更新时间
