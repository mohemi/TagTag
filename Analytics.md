# TagTag Analytics 埋点需求文档

## 概述
- **埋点工具**: Google Analytics (GA4)
- **实现文件**: `options/analytics.js`
- **集成方式**: 在 `options.js` 中引入并调用

---

## 埋点需求列表

### 1. 页面生命周期事件

| 事件名 | 触发时机 | 上报参数 |
|--------|----------|----------|
| `page_open` | 页面首次打开 | - |
| `page_refresh` | 页面刷新 | - |
| `page_config` | 页面打开/刷新时 | `theme`, `tab_style`, `language`, `open_tab_mode`, `space_count`, `group_count`, `tab_count`, `auto_sync`, `webdav_enabled` |

**配置参数说明**:
- `theme`: 主题颜色 (midnight/snow/violet/zinc)
- `tab_style`: 标签样式 (vertical/horizontal)
- `language`: 语言 (en/zh)
- `open_tab_mode`: 打开标签方式 (redirect/new-tab)
- `space_count`: 空间数量
- `group_count`: 分组数量
- `tab_count`: 标签数量
- `auto_sync`: 自动同步状态 (true/false)
- `webdav_enabled`: WebDAV开关状态 (true/false)

---

### 2. Tab 相关事件

| 事件名 | 触发时机 | 上报参数 |
|--------|----------|----------|
| `tab_click` | 点击 Tab 卡片打开 | `space_id`, `group_id`, `tab_id` |
| `tab_rename` | Tab 重命名 | `space_id`, `group_id`, `tab_id` |
| `tab_edit_url` | Tab 编辑链接 | `space_id`, `group_id`, `tab_id` |
| `tab_delete` | 删除 Tab | `space_id`, `group_id`, `tab_id` |
| `tab_drag_reorder` | Tab 拖拽排序 | `space_id`, `group_id`, `from_index`, `to_index` |
| `tab_drag_move` | Tab 拖拽移动到其他分组 | `from_space_id`, `from_group_id`, `to_space_id`, `to_group_id`, `tab_id` |
| `tab_drag_copy` | Tab 拖拽复制到其他分组 | `from_space_id`, `from_group_id`, `to_space_id`, `to_group_id`, `tab_id` |
| `tab_menu_click` | 点击 Tab 的 x 按钮打开菜单 | `space_id`, `group_id`, `tab_id` |
| `tab_drag_start` | 开始拖拽 Tab | `space_id`, `group_id`, `tab_id` |
| `tab_drag_end` | 结束拖拽 Tab | `space_id`, `group_id`, `tab_id`, `dropped` |

---

### 3. Collection/分组 相关事件

| 事件名 | 触发时机 | 上报参数 |
|--------|----------|----------|
| `collection_create` | 创建分组 | `space_id`, `group_name` |
| `collection_rename` | 重命名分组 | `space_id`, `group_id`, `old_name`, `new_name` |
| `collection_delete` | 删除分组 | `space_id`, `group_id` |
| `collection_collapse` | 收起/展开分组 | `space_id`, `group_id`, `collapsed` |
| `collection_drag_start` | 开始拖拽分组 | `space_id`, `group_id` |
| `collection_drag_end` | 结束拖拽分组 | `space_id`, `group_id`, `dropped` |
| `collection_drag_reorder` | 拖拽分组排序 | `space_id`, `from_index`, `to_index` |
| `collection_move_to_space` | 移动分组到其他 Space | `from_space_id`, `to_space_id`, `group_id`, `mode` (copy/move) |

---

### 4. Space 相关事件

---

### 3. Space 相关事件

| 事件名 | 触发时机 | 上报参数 |
|--------|----------|----------|
| `space_click` | 点击 Space 切换 | `space_id`, `space_name` |
| `space_create` | 创建 Space | `space_id`, `space_name` |
| `space_import` | 导入 Space (JSON) | `space_id`, `source` (file/bookmark) |
| `space_export` | 导出 Space (JSON) | `space_id` |
| `space_edit_icon` | 编辑 Space 图标 | `space_id`, `icon` |
| `space_edit_name` | 编辑 Space 名称 | `space_id`, `old_name`, `new_name` |
| `space_delete` | 删除 Space | `space_id` |
| `space_drag_reorder` | 拖拽 Space 排序 | `from_index`, `to_index` |
| `space_menu_create` | 命名空间菜单-创建空间 | - |
| `space_menu_import` | 命名空间菜单-导入空间 | `source` (json/bookmark) |

---

### 4. 当前标签页 (Current Tabs) 事件

| 事件名 | 触发时机 | 上报参数 |
|--------|----------|----------|
| `current_tab_close` | 点击当前标签页 X 关闭 | `tab_id` |
| `current_tab_save` | 点击保存按钮 | `tab_count` |
| `current_tab_collapse` | 点击收起按钮 | - |
| `current_tab_drag` | 从当前标签拖拽到 Collection | `target_space_id`, `target_group_id` |

---

### 5. 搜索与选择事件

| 事件名 | 触发时机 | 上报参数 |
|--------|----------|----------|
| `search_tabs` | 搜索标签页 | `query_length` |
| `add_collection` | 添加标签组 | `space_id` |
| `select_tabs_mode` | 进入选择标签模式 | - |
| `select_tabs_cancel` | 取消选择标签 | `selected_count` |
| `select_tabs_create_group` | 选择标签后创建分组 | `selected_count` |
| `select_tabs_delete` | 选择标签后删除 | `selected_count` |
| `select_tabs_move` | 选择标签后移动 | `selected_count`, `target_space_id` |

---

### 6. 侧边栏与导航事件

| 事件名 | 触发时机 | 上报参数 |
|--------|----------|----------|
| `sidebar_collapse` | 收起/展开 Space 侧边栏 | `collapsed` (true/false) |
| `pref_menu_open` | 点击偏好设置菜单 | - |
| `settings_open` | 点击设置 | - |
| `backup_sync_open` | 点击备份和同步 | - |
| `about_open` | 点击关于我 | - |

---

### 7. 设置事件

| 事件名 | 触发时机 | 上报参数 |
|--------|----------|----------|
| `setting_theme` | 设置主题颜色 | `theme` |
| `setting_tab_style` | 设置标签样式 | `tab_style` |
| `setting_language` | 设置语言 | `language` |
| `setting_open_mode` | 设置打开标签方式 | `mode` |

---

### 8. 备份与同步事件

| 事件名 | 触发时机 | 上报参数 |
|--------|----------|----------|
| `webdav_test_connect` | WebDAV 测试连接点击 | - |
| `webdav_upload` | 本地覆盖远程点击 | - |
| `webdav_download` | 远程覆盖本地点击 | - |
| `webdav_auto_sync_toggle` | 自动同步开关点击 | `enabled` (true/false) |
| `github_gist_click` | GitHub Gist Sync 点击 | - |
| `backup_export` | 导出备份 | - |
| `backup_import` | 导入备份 | `mode` (merge/overwrite) |

---

### 9. 关于我事件

| 事件名 | 触发时机 | 上报参数 |
|--------|----------|----------|
| `about_weibo_click` | 微博链接点击 | - |

---

## 实现说明

### GA 初始化
```javascript
// 在 analytics.js 中初始化
gtag('config', 'GA_MEASUREMENT_ID', {
  send_page_view: false, // 手动控制页面浏览事件
});
```

### 事件上报方法
```javascript
// 通用事件上报
Analytics.track(eventName, parameters);

// 页面配置上报
Analytics.trackPageConfig(config);

// 用户属性设置
Analytics.setUserProperties(properties);
```

### 隐私合规
- 不上报用户敏感数据 (URL、标题等具体内容)
- 仅上报操作行为和统计数据
- 遵循 GA4 的隐私政策和数据收集最佳实践
