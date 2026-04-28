# 使用体验问题修复改进清单

## 摘要

本清单只保留与程序日常使用体验、构建验证和发布稳定性直接相关的问题，不包含安全加固类事项。

目标是优先修复确定会影响使用的运行时问题，同时补齐构建验证和诊断能力，降低后续发布或维护时遗漏问题的概率。

## 1. AI 助手页面卸载时报错

- 位置：`src/renderer/views/AiAssistant.vue`
- 类型：确定运行时 bug
- 现象：`handleBeforeUnload` 定义在 `onMounted` 内部，但在 `onUnmounted` 中被外层作用域引用。
- 影响：切换离开 AI 助手页面时可能出现 `ReferenceError`，并影响聊天历史保存或 Live2D/PIXI 资源释放。
- 修复：将 `handleBeforeUnload` 提到组件顶层作用域，在挂载时注册、卸载时移除。

## 2. AI 流式输出解析异常被静默吞掉

- 位置：
  - `src/renderer/stores/api.js`
  - `web/src/stores/api.js`
- 类型：可靠性与诊断问题
- 现象：OpenAI / Claude / Gemini 流式解析中存在空 `catch {}`。
- 影响：服务商返回格式异常或网络流切分异常时，回复可能缺字、中断，但没有任何日志或提示。
- 修复：保留兼容行为，不因单条异常片段中断整个流；同时记录解析异常计数，并在流结束后输出一次 `console.warn` 便于定位。

## 3. Web 版未纳入根构建验证

- 位置：`package.json`、`web/vite.config.js`
- 类型：构建覆盖问题
- 现象：根目录 `npm run build` 只构建 Electron renderer，不能验证 `web/` 子项目。
- 影响：Electron 版构建正常时，web 版仍可能存在未发现的编译错误。
- 修复：增加根脚本：
  - `build:web`
  - `build:all`

## 4. 打包配置依赖 NSIS include 文件

- 位置：`package.json`、`build/uninstaller.nsh`
- 类型：发布稳定性问题
- 现象：Electron Builder 的 NSIS 配置引用 `build/uninstaller.nsh`。
- 影响：如果该文件未随代码保存，换机器或 CI 打包会失败。
- 修复：确保 `build/uninstaller.nsh` 保留在项目中，并在最终变更中提示需要一并提交。

## 5. 构建包体积警告

- 位置：`vite.config.js`，可选 `web/vite.config.js`
- 类型：加载体验优化
- 现象：Vite 构建提示部分 chunk 超过 500KB。
- 影响：首屏加载或页面切换可能变慢，尤其是包含 Live2D、PIXI、CodeMirror 的功能页。
- 修复：采用低风险 `manualChunks` 拆分稳定第三方依赖，不改动页面加载逻辑。

## 6. Electron / Web 重复逻辑维护风险

- 位置示例：
  - `src/renderer/stores/api.js`
  - `web/src/stores/api.js`
  - `src/renderer/views/PackageExport.vue`
  - `web/src/views/PackageExport.vue`
- 类型：维护性问题
- 现象：两套代码实现类似功能，容易只修一边。
- 影响：用户在 Electron 版和 web 版中可能遇到行为不一致。
- 修复：本轮不做大规模重构；对本轮触碰到的 API 流式逻辑保持两端一致，并在后续重构时考虑抽共享模块。

## 验证清单

- `npm run build`
- `npm run build:web`
- `npm run build:all`
- 如涉及打包发布验证，再运行 `npm run dist`
- 手动验证 AI 助手页面：进入 AI 助手后切换到其他页面，确认控制台不再出现 `handleBeforeUnload is not defined`。
