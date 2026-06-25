# CLAUDE.md — Hermod

## 项目定位
机器人工程的 AI Agent 原生基础设施。三层引擎：
1. **知识库** — 电机/传感器/驱动/MCU 结构化参数
2. **硬件描述解析** — `robot.hardware.yaml` → 代码生成
3. **AI 安全标注** — `@ai-lock` / `@ai-critical` 等六层标注体系

## 技术栈
- **语言**: TypeScript
- **运行时**: Node.js ≥ 20
- **包管理**: pnpm workspaces
- **构建**: tsup
- **模板引擎**: EJS
- **CLI**: Commander.js + @clack/prompts
- **YAML 解析**: js-yaml
- **测试**: Vitest

## 仓库结构
```
Hermod/
├── packages/
│   ├── engine/           # 核心引擎（类型、校验、生成器）
│   │   └── src/
│   │       ├── types.ts        # HardwareDescription 类型
│   │       ├── schema.ts       # robot.hardware.yaml JSON Schema
│   │       ├── validator.ts    # 冲突检测
│   │       ├── generators/     # 代码生成器集合
│   │       └── renderer.ts     # EJS 渲染 + 文件输出
│   ├── knowledge/        # 标准件参数库 (YAML)
│   │   ├── motors/          # 7 entries
│   │   ├── sensors/         # 8 entries
│   │   ├── drivers/         # 6 entries
│   │   ├── mcus/            # 5 entries
│   │   ├── batteries/       # 4 entries
│   │   └── INDEX.yaml       # 30 entries total
│   └── cli/              # CLI wizard + kb-loader
│       └── src/
│           ├── index.ts
│           ├── kb-loader.ts
│           └── commands/create.ts
├── templates/            # EJS 模板文件 (13 files)
│   ├── firmware/         # can_config.h, motor_foc.cpp, safety/limits.h
│   ├── urdf/             # mobile + serial chain
│   ├── ros2/launch/      # bringup + sim
│   ├── sim/gazebo/       # SDF world + plugins
│   ├── ai-workflows/     # add-sensor, tune-pid, diagnose
│   └── docs/             # BOM, CLAUDE.md
├── examples/
│   ├── diff-drive-inspector/
│   └── arm-6dof/
├── CONTRIBUTING.md       # 社区贡献指南
└── CLAUDE.md             # 本文件
```

## 当前阶段
**Phase 3 完成 — 项目已可发布**

Phase 1-3 完整交付：
- types.ts — 15+ 类型定义
- schema.ts + validator.ts — 结构 + 语义校验
- renderer.ts — EJS 渲染引擎
- 8 个生成器 (firmware, urdf, ros2-driver, gazebo, bom, claude-md, annotations, ai-workflows)
- 13 个 EJS 模板 (firmware×3, urdf×1, ros2×3, sim×1, docs×2, ai-workflows×3)
- 30 条知识库 (7 motors, 8 sensors, 6 drivers, 5 MCUs, 4 batteries)
- 2 个示例项目 (diff-drive 16 files, arm-6dof 11 files)
- CLI 交互式向导 (create-hermod@0.1.0, 10 steps)
- 3 个 AI Agent 工作流 (add-sensor, tune-pid, diagnose)
- 19 tests 全部通过

下一步：
- 文档站点 (VitePress)
- Demo 视频
- MoveIt 仿真集成
- 四足机器人类型
- npm publish

## 关键设计决策
- **CAN ID 分配**：自动分配（按 motor 声明顺序递增），用户可在 YAML 显式覆盖
- **引脚冲突检测**：生成前强制检查，冲突时报错阻止生成
- **冲突严重度**：error（阻止生成）vs warning（提醒但允许）
- **标注标准**：六层 — @ai-lock, @ai-critical, @ai-default, @ai-context, @ai-extend, @ai-telemetry
- **知识库 YAML 字段**：每个条目统一包含 identity → physical → electrical → mechanical → control → safety → source
- **模板文件**：统一用 .ejs 后缀，变量命名 camelCase

## 命名规范
- **TypeScript 文件**：kebab-case（`motor-config.ts`, `can-bus.ts`）
- **YAML 知识库条目**：snake_case（`dji_m3508.yaml`, `stm32f407.yaml`）
- **函数**：camelCase（`validateHardware`, `generateFirmware`）
- **类型/接口**：PascalCase（`HardwareDescription`, `ValidationResult`）

## 编码约定
- 所有 TypeScript 文件使用 explicit return types
- 生成器函数签名统一：`(hw: HardwareDescription, options: GenerateOptions) => GeneratedFile[]`
- 知识库 YAML 必须包含 `safety` 字段（至少一个 `max_*` 约束）
- 校验函数返回 `ValidationResult[]`，空数组表示通过
