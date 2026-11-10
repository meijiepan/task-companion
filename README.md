# Task Companion / 任务伴侣

一个开源、中英双语的任务树。用户可在网页创建项目、多层子任务、勾选进度、前后切换、导出或删除数据；MCP 工具让 ChatGPT 读取和修改用户自己的任务。网页版通过 Sites 的 ChatGPT 登录识别用户。对话侧栏使用 MCP App 资源和 `open_task_panel` 入口。

## 当前状态

这是待公开审核的 V1 源码。GanttProject 清单是可选演示数据。原先 127.0.0.1:8765 的私人测试数据不会自动上传；新站点从空白账号开始。Mac ChatGPT 桌面 App 的侧栏显示仍须实机验证，不能保证与网页版相同。

## 目录

- `worker/index.js`：HTTP API、MCP 工具、用户隔离和任务操作。
- `worker/page.html`：中英双语响应式网页与侧栏资源。
- `drizzle/0000_initial.sql`：D1 数据库结构。
- `scripts/build.py`：将页面嵌入 Worker，输出 `dist/server/index.js`。
- `.openai/hosting.json`：Sites 部署配置。

## 数据与权限

所有项目和任务操作都按 Sites 转发的 `oai-authenticated-user-id` 查询。匿名访问只可看登录页；任务 API 不接受匿名请求。浏览器写入需要 JSON 和同源请求。插件工具仅在用户要求时修改状态。服务不存聊天全文或 API 密钥；支持 JSON 导出和删除全部数据。详见网页 `/privacy` 和 `/terms`。

## 构建

```bash
bash scripts/build.sh
```

部署前需要 Sites 项目、D1 数据库和 ChatGPT 登录。不能将此前无身份验证的 Phase 2 PoC 服务器公开。公开插件需要完成 OpenAI 审核与页面、视频、正反测试材料；见 [提交说明](https://developers.openai.com/plugins/deploy/submission)。

## 贡献

欢迎通过 Issue 报告问题。提交代码前请检查是否包含任务数据、私人运行密钥或其他账号凭证。许可证：MIT。
