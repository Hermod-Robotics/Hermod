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
│   └── cli/              # 交互式命令行（Phase 3）
├── templates/            # EJS 模板文件 (11 files)
│   ├── firmware/
│   ├── urdf/             # mobile + serial chain
│   ├── ros2/launch/      # bringup + sim
│   ├── sim/gazebo/       # SDF world + plugins
│   └── docs/
├── examples/
│   ├── diff-drive-inspector/
│   └── arm-6dof/
├── CONTRIBUTING.md       # 社区贡献指南
└── CLAUDE.md             # 本文件
```

## 当前阶段
**Phase 2 完成 → 进入 Phase 3**

Phase 2 交付：
- 知识库：8 → 30 条（7 motors, 8 sensors, 6 drivers, 5 MCUs, 4 batteries）
- 机器人类型：diff-drive + arm_6dof（串行链 URDF）
- 仿真：Gazebo 差分驱动 + LiDAR + IMU 插件，Docker Compose 可启动
- 模板：8 → 11 个（新增 world.sdf.ejs, sim.launch.py.ejs）
- 生成器：urdf.ts 支持串行链，gazebo.ts 用 EJS 模板，ros2-driver.ts 生成 sim launch
- Demo：2 个示例（diff-drive 13 files, arm-6dof 11 files）
- 社区：CONTRIBUTING.md 含知识库贡献模板
- 19 tests 全部通过

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
