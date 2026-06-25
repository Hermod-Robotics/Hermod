<p align="center">
  <img src="https://raw.githubusercontent.com/Hermod-Robotics/.github/main/assets/Hermod_Logo.png" alt="Hermod" height="100">
</p>

<h1 align="center">Hermod</h1>

<p align="center">
  <strong>AI-native infrastructure for robot engineering.</strong>
</p>

<p align="center">
  <a href="README.zh-CN.md">中文</a>
  &nbsp;|&nbsp;
  <a href="https://github.com/Hermod-Robotics/hermod/actions"><img src="https://img.shields.io/badge/build-passing-brightgreen" alt="Build"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D20-success" alt="Node.js >= 20"></a>
  <a href="https://pnpm.io"><img src="https://img.shields.io/badge/pnpm-9-orange" alt="pnpm"></a>
  <img src="https://img.shields.io/badge/tests-19%20passed-brightgreen" alt="19 tests passed">
</p>

---

## What is Hermod?

**One hardware description file. A complete robot project — from firmware to simulation.**

You describe what your robot *is* — motors, sensors, MCU, battery. Hermod generates everything it *needs* — firmware, URDF, ROS 2 drivers, simulation config, BOM, and AI agent context. All annotated so AI agents understand your hardware constraints from day one.

---

## 30-Second Demo

```yaml
# robot.hardware.yaml — the only file you write

robot:
  name: "Inspection Robot"
  type: "diff_drive"
  mcu: "stm32f407"

joints:
  - name: "left_wheel"
    type: "active"
    motor: "dji-m3508"        # references knowledge base
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
# One command → 11 files → runnable robot project
npx tsx scripts/generate.ts
docker compose up   # Gazebo simulation
```

---

## What Gets Generated?

| Category | Files | Description |
|---|---|---|
| **Firmware** | `can_config.h`, `motor_foc.cpp`, `safety/limits.h` | CAN topology + FOC control + `@ai-lock` safety boundaries |
| **URDF** | `robot.urdf.xacro` | Full kinematic tree with sensor mounts |
| **ROS 2** | `hardware_interface.cpp`, `bringup.launch.py` | `ros2_control` SystemInterface + sensor drivers |
| **Simulation** | `robot.sdf`, `docker-compose.yml` | Gazebo world + one-command startup |
| **Docs** | `BOM.md`, `AI_ANNOTATIONS.md` | Bill of materials, annotation reference |
| **AI Context** | `CLAUDE.md` | Hardware config, build commands, safety constraints |

---

## Architecture

```
robot.hardware.yaml          # You write this
        │
        ▼
┌───────────────────────────┐
│   Hermod Engine            │
│   ├── Schema Validation    │  Structural check (field types, enums)
│   ├── Hardware Validation  │  CAN conflicts, power budget, peripheral limits
│   └── Code Generation      │  8 EJS templates × 7 generators
└───────────────────────────┘
        │
        ▼
  Complete Robot Project     # 11 files, ready to build and simulate
```

### Three-Layer Engine

```
Layer 3: AI Safety Annotations — @ai-lock / @ai-critical / @ai-extend
Layer 2: Hardware Description → Code Generation
Layer 1: Standard Parts Knowledge Base (motors, sensors, drivers, MCUs)
```

---

## Project Status

### Phase 1 ✅ Complete

- **Engine**: types, schema validation, hardware validation, code generation
- **Knowledge Base**: 7 entries
- **Templates**: 8 EJS templates
- **Tests**: 19 tests
- **Demo**: `examples/diff-drive-inspector/` — YAML → 13 files → Gazebo simulation

### Phase 2 ✅ Complete

- **Knowledge Base**: 30 entries (7 motors, 8 sensors, 6 drivers, 5 MCUs, 4 batteries)
- **Robot Types**: diff-drive (wheeled) + arm_6dof (serial chain manipulator)
- **Simulation**: Gazebo with diff-drive, LiDAR, and IMU plugins
- **Community**: `CONTRIBUTING.md` with YAML template and quality guidelines
- **Demo**: `examples/arm-6dof/` — 6-DOF manipulator arm with CAN + UART motors

| Module | Status | Notes |
|--------|:------:|-------|
| `@hermod/engine` — types, schema, validator | ✅ | 12 tests |
| `@hermod/engine` — generators (7 modules) | ✅ | 7 tests |
| `@hermod/knowledge` | ✅ | 30 entries |
| EJS Templates | ✅ | 11 templates |
| Robot Types | ✅ | diff-drive, arm_6dof |
| Gazebo Simulation | ✅ | diff-drive + LiDAR + IMU plugins |
| `@hermod/cli` — interactive wizard | ✅ | 10-step, npm publish ready |
| `CONTRIBUTING.md` | ✅ | Hardware contribution guide |
| AI Agent Workflows | ✅ | 3 task guides (add-sensor, tune-pid, diagnose) |

### Quick Install

```bash
npm create hermod@latest my-robot
# or: npx create-hermod my-robot
```

### Roadmap

| Phase | Goal | Status |
|-------|------|:------:|
| **Phase 1** | Core engine + demo | ✅ |
| **Phase 2** | 30 KB entries, 2 robot types, runnable sim | ✅ |
| **Phase 3** | CLI wizard, agent workflows, npm publish | ✅ |
| **Phase 4** | Docs site, demo video, MoveIt, quadruped, wiring | ⏳ |

---

## Repository Structure

```
Hermod/
├── packages/
│   ├── engine/                     # Core engine
│   │   └── src/
│   │       ├── types.ts              # 15+ type definitions
│   │       ├── schema.ts             # Structural validation
│   │       ├── validator.ts          # CAN/power/peripheral checks
│   │       ├── renderer.ts           # EJS rendering + file I/O
│   │       └── generators/           # 7 code generators
│   │           ├── firmware.ts       # CAN config, FOC, safety
│   │           ├── urdf.ts           # Robot model
│   │           ├── ros2-driver.ts    # ros2_control interface
│   │           ├── gazebo.ts         # SDF world + Docker
│   │           ├── bom.ts            # Bill of materials
│   │           ├── claude-md.ts      # AI agent context
│   │           └── annotations.ts    # AI annotation reference
│   ├── knowledge/                   # Standard parts library (YAML)
│   │   ├── motors/                   # dji_m3508, tmotor_ak80-9
│   │   ├── sensors/                  # bmi088, rplidar_a3
│   │   ├── drivers/                  # drv8301
│   │   ├── mcus/                     # stm32f407
│   │   ├── batteries/                # 6s_lipo
│   │   └── INDEX.yaml
│   └── cli/                         # Interactive CLI (Phase 3)
├── templates/                       # EJS templates (11 files)
│   ├── firmware/                    # can_config.h, motor_foc.cpp, safety/limits.h
│   ├── urdf/                        # robot.urdf.xacro (mobile + serial chain)
│   ├── ros2/launch/                 # bringup + sim launch
│   ├── sim/gazebo/                  # SDF world with plugins
│   └── docs/                        # BOM.md, CLAUDE.md
├── examples/
│   ├── diff-drive-inspector/        # Diff-drive demo (13 files)
│   │   ├── robot.hardware.yaml
│   │   ├── scripts/generate.ts
│   │   └── generated/
│   └── arm-6dof/                    # 6-DOF arm demo (11 files)
│       ├── robot.hardware.yaml
│       ├── scripts/generate.ts
│       └── generated/
└── CONTRIBUTING.md                  # Hardware contribution guide
```

---

## Quick Start

```bash
# Clone
git clone https://github.com/Hermod-Robotics/hermod.git
cd hermod

# Install
pnpm install

# Build engine
pnpm -C packages/engine build

# Run tests
pnpm test

# Generate the demo project
pnpm exec tsx examples/diff-drive-inspector/scripts/generate.ts

# Explore the output
tree examples/diff-drive-inspector/generated
```

---

## AI Agent-Native Design

Every generated file includes `@ai-*` annotations that AI agents (Claude Code, Cursor, Copilot) understand:

| Annotation | Meaning | Agent Behavior |
|------------|---------|---------------|
| `@ai-lock` | Physical safety boundary | Read-only — requires operator override to modify |
| `@ai-critical` | Important parameter | May suggest changes, must request approval |
| `@ai-default` | Experience-based default | May modify with documented reasoning |
| `@ai-context` | Module description | Informational only |
| `@ai-extend` | Extension point | Safe to add new code here |
| `@ai-telemetry` | Observable data channel | May read at runtime for debugging |

---

## Contribute

Hermod is open source. Contributions welcome:

- **Hardware parameters**: submit new motor, sensor, driver, and MCU entries
- **Templates**: add or improve EJS templates
- **Generators**: extend or add new code generators
- **Bug reports & ideas**: [Discussions](https://github.com/Hermod-Robotics/hermod/discussions)

---

<p align="center">
  <sub>Named after Hermóðr, the Norse messenger who crossed boundaries between worlds — carrying intent across hardware, software, and AI.</sub>
</p>
