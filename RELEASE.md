# Task Companion V1 发布记录

## 已完成

- 网页版：中英文、项目和多级任务、勾选进度、上一/下一步、刷新持久化、导出与删除。
- 每个登录账号的数据按站点专属用户 ID 隔离；匿名任务 API 返回 401。
- 云端 MCP 工具和对话侧栏入口已部署；插件由 Sites 为站点创建。
- GitHub 源码公开，MIT 许可。原本的本机私人运行密钥、SQLite 数据库均未进入仓库。
- 2026-11-09 在线实测：登录、创建 GanttProject 示例、勾选 2/8、刷新保留、上一/下一步、英文界面。

## 待验证与审核

- ChatGPT 网页端的新云端插件侧栏需要在新对话中实测。之前的私人本机插件已经验证侧栏，但与此云端版本是不同插件。
- Mac ChatGPT 桌面 App 未实测。当前可承诺的是独立网页，不能承诺嵌入原生 App。
- 公开插件目录需要开发者验证、审核材料、正反测试、演示视频及审核通过。网站公开不等于插件上架。

## 公开插件审核材料草案

- 名称：Task Companion / 任务伴侣
- 说明：Keep bilingual, nested tasks beside your ChatGPT conversation. Create projects, check progress, and continue the selected task in chat.
- 网站：<https://task-companion-20261109.maggie-pan.chatgpt.site/>
- 隐私：<https://task-companion-20261109.maggie-pan.chatgpt.site/privacy>
- 条款：<https://task-companion-20261109.maggie-pan.chatgpt.site/terms>
- 支持：<https://task-companion-20261109.maggie-pan.chatgpt.site/support>
- MCP：<https://task-companion-20261109.maggie-pan.chatgpt.site/mcp>
- 正向测试 1：登录后创建空白项目并添加父子任务。
- 正向测试 2：勾选叶子任务后进度变化，刷新仍保留。
- 正向测试 3：选中任务并在同一对话继续聊天。
- 正向测试 4：切换中文/英文，任务树与按钮均切换。
- 正向测试 5：导出 JSON 后删除自己的测试数据。
- 反向测试 1：未登录时读写任务被拒绝。
- 反向测试 2：另一个账号不能通过项目 ID 读取或修改他人任务。
- 反向测试 3：父任务不能直接勾选，避免进度误算。

审核流程参考 [OpenAI 官方插件提交说明](https://developers.openai.com/plugins/deploy/submission) 与 [MCP 审核要求](https://developers.openai.com/plugins/deploy/app-review)。测试案例是草案，尚未全部以真实账号和 ChatGPT 插件执行。
