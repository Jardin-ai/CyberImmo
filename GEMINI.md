# MULTI-AGENT COLLABORATION PROTOCOL
**CRITICAL**: 本项目由多个 AI Agent 共同开发。`docs/diary.md` 是全局唯一的状态同步中心。
1. **任务前 (Pre-task)**: 在执行任何复杂文件修改前，你必须先读取 `docs/diary.md` 的最新内容，了解其他 Agent（如 Cursor, Gemini）的进度和决议。
2. **任务后 (Post-task)**: 在完成你的代码生成后，你必须使用 Bash 工具向 `docs/diary.md` 追加记录。
3. **写入格式**:
   ### [YYYY-MM-DD HH:MM:SS] [Gemini Cli]
   - **Action**: [简述你修改了哪些文件和核心逻辑]
   - **Opinion/Decision**: [你在架构实现上的取舍原因]
   - **Handoff**: [留给下一个环节或 Cursor 的注意事项/技术债]
