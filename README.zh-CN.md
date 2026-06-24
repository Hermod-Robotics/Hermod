<p align="center">
  <img src="https://raw.githubusercontent.com/Hermod-Robotics/.github/main/assets/Hermod_Logo.png" alt="Hermod" height="100">
</p>

<h1 align="center">Hermod</h1>

<p align="center">
  <strong>机器人工程的 AI Agent 原生基础设施。</strong>
</p>

<p align="center">
  <a href="README.md">English</a>
  &nbsp;|&nbsp;
  <a href="https://github.com/Hermod-Robotics/hermod/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D20-success" alt="Node.js >= 20"></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-9-orange" alt="pnpm"></a>
  <img src="https://img.shields.io/badge/tests-19%20passed-brightgreen" alt="19 tests passed">
</p>

---

## Hermod 是什么？

**一份硬件描述文件，生成从固件到仿真的完整机器人项目。**

你描述机器人的组成 — 电机、传感器、MCU、电池。Hermod 自动生成它需要的一切 — 固件、URDF、ROS 2 驱动包、仿真配置、BOM 物料清单、AI Agent 上下文。所有输出文件都带有 `@ai-*` 标注，AI Agent 从第一天就理解你的硬件约束。

---

## 30 秒演示

```yaml
# robot.hardware.yaml — 你唯一需要写的文件

robot:
  name: "巡检机器人"
  type: "diff_drive"
  mcu: "stm32f407"

joints:
  - name: "left_wheel"
    type: "active"
    motor: "dji-m3508"        # 引用知识库
    driver: "drv8301"
    canId: 0x201
    role: "drive"
  - name: "right_wheel"
    type: "active"
    motor: "dji-m3508"
    driver: "drv8301"
    canId: 0x202
    role: "drive"

sensors:
  - name: "imu"
    model: "bmi088"
    interface: "SPI"
    port: "SPI2"
  - name: "lidar"
    model: "rplidar-a3"
    interface: "UART"
    port: "/dev/ttyUSB0"

power:
  battery: "6s-lipo"
  voltageNominal: 22.2
  voltageRange: [18.0, 25.2]
```

```bash
# 一条命令 → 11 个文件 → 可运行的机器人项目
npx tsx scripts/generate.ts
docker compose up   # 启动 Gazebo 仿真
```

---

## 生成了什么？

| 类别 | 文件 | 说明 |
|---|---|---|
| **固件** | `can_config.h`, `motor_foc.cpp`, `safety/limits.h` | CAN 总线配置 + FOC 控制 + `@ai-lock` 安全限位 |
| **机器人模型** | `robot.urdf.xacro` | 完整运动学树 + 传感器安装位姿 |
| **ROS 2 驱动** | `hardware_interface.cpp`, `bringup.launch.py` | `ros2_control` 硬件接口 + 传感器驱动 |
| **仿真** | `robot.sdf`, `docker-compose.yml` | Gazebo 世界 + 一键启动 |
| **文档** | `BOM.md`, `AI_ANNOTATIONS.md` | 物料清单、AI 标注参考 |
| **AI 上下文** | `CLAUDE.md` | 硬件配置、构建命令、安全约束 |

---

## 架构

```
robot.hardware.yaml          # 你只需要写这个
        │
        ▼
┌───────────────────────────┐
│   Hermod 引擎              │
│   ├── Schema 校验          │  结构检查（字段类型、枚举值）
│   ├── 硬件校验             │  CAN ID 冲突、功耗预算、外设限制
│   └── 代码生成             │  8 个 EJS 模板 × 7 个生成器
└───────────────────────────┘
        │
        ▼
  完整机器人项目              # 11 个文件，可直接编译和仿真
```

### 三层引擎

```
第三层：AI 安全标注 — @ai-lock / @ai-critical / @ai-extend
第二层：硬件描述 → 代码生成
第一层：标准件参数知识库（电机、传感器、驱动、MCU）
```

---

## 项目状态

### Phase 1 ✅ 已完成

- **引擎**：类型系统、结构校验、硬件校验、代码生成
- **知识库**：7 条（2 电机、1 驱动、2 传感器、1 MCU、1 电池）
- **模板**：8 个 EJS 模板，覆盖固件、URDF、ROS 2、仿真、文档
- **测试**：19 个测试全部通过
- **Demo**：`examples/diff-drive-inspector/` — 一个 YAML → 11 个文件 → Gazebo 仿真

| 模块 | 状态 | 测试 |
|--------|:------:|:-----:|
| `@hermod/engine` — 类型、校验 | ✅ | 12 |
| `@hermod/engine` — 生成器 | ✅ | 7 |
| `@hermod/knowledge` — 知识库 | ✅ 7 条 | — |
| `@hermod/cli` — 交互式 CLI | ⏳ Phase 3 | — |
| EJS 模板 | ✅ 8 个 | — |
| Demo — 差速巡检小车 | ✅ | — |

### 路线图

| 阶段 | 目标 | 状态 |
|-------|------|:------:|
| **Phase 1** | 核心引擎 + 演示 | ✅ |
| **Phase 2** | 30+ 知识库条目、4 种机器人类型、接线图 | ⏳ |
| **Phase 3** | CLI 向导、Agent 工作流集成、npm 发布 | ⏳ |

---

## 仓库结构

```
Hermod/
├── packages/
│   ├── engine/                     # 核心引擎
│   │   └── src/
│   │       ├── types.ts              # 15+ 类型定义
│   │       ├── schema.ts             # 结构校验
│   │       ├── validator.ts          # CAN/功耗/外设检测
│   │       ├── renderer.ts           # EJS 渲染 + 文件 I/O
│   │       └── generators/           # 7 个代码生成器
│   │           ├── firmware.ts       # CAN 配置、FOC、安全限位
│   │           ├── urdf.ts           # 机器人模型
│   │           ├── ros2-driver.ts    # ros2_control 接口
│   │           ├── gazebo.ts         # SDF 世界 + Docker
│   │           ├── bom.ts            # 物料清单
│   │           ├── claude-md.ts      # AI Agent 上下文
│   │           └── annotations.ts    # AI 标注参考
│   ├── knowledge/                   # 标准件参数库 (YAML)
│   │   ├── motors/                   # dji_m3508, tmotor_ak80-9
│   │   ├── sensors/                  # bmi088, rplidar_a3
│   │   ├── drivers/                  # drv8301
│   │   ├── mcus/                     # stm32f407
│   │   ├── batteries/                # 6s_lipo
│   │   └── INDEX.yaml
│   └── cli/                         # 交互式 CLI (Phase 3)
├── templates/                       # EJS 模板 (8 个)
│   ├── firmware/
│   ├── urdf/
│   ├── ros2/
│   └── docs/
├── examples/
│   └── diff-drive-inspector/        # 完整演示
│       ├── robot.hardware.yaml       # ← 你唯一需要写的文件
│       ├── scripts/generate.ts       # 演示运行脚本
│       └── generated/                # ← 11 个输出文件
└── package.json                     # pnpm monorepo 根
```

---

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/Hermod-Robotics/hermod.git
cd hermod

# 安装依赖
pnpm install

# 构建引擎
pnpm -C packages/engine build

# 运行测试
pnpm test

# 生成演示项目
pnpm exec tsx examples/diff-drive-inspector/scripts/generate.ts

# 查看输出
tree examples/diff-drive-inspector/generated
```

---

## AI Agent 原生设计

每个生成文件都包含 AI Agent（Claude Code、Cursor、Copilot）可理解的 `@ai-*` 标注：

| 标注 | 含义 | Agent 行为约束 |
|------------|---------|---------------|
| `@ai-lock` | 物理安全边界 | 只读 — 修改需操作者显式授权 |
| `@ai-critical` | 关键参数 | 可提出修改建议，需用户批准 |
| `@ai-default` | 经验默认值 | 可修改，需注明理由 |
| `@ai-context` | 模块说明 | 纯信息，帮助 Agent 理解系统 |
| `@ai-extend` | 扩展点 | Agent 可在此安全添加新代码 |
| `@ai-telemetry` | 可观测通道 | Agent 可在运行时读取用于调试 |

---

## 参与贡献

Hermod 是开源项目。欢迎参与：

- **硬件参数**：提交新的电机、传感器、驱动芯片、MCU 条目
- **模板**：新增或改进 EJS 模板
- **生成器**：扩展或新增代码生成器
- **Bug 反馈和想法**：[Discussions](https://github.com/Hermod-Robotics/hermod/discussions)

---

<p align="center">
  <sub>以北欧神话信使 Hermóðr 命名 — 他在九个世界之间传递消息，不畏任何边界。正如 Hermod 在硬件、软件与 AI 之间传递设计意图。</sub>
</p>
