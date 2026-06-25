# Contributing to Hermod

Thank you for your interest in contributing! Hermod is an open-source project and welcomes contributions of all kinds.

## Ways to Contribute

### 1. Add Hardware Parameters (easiest, highest impact)

The knowledge base (`packages/knowledge/`) is the foundation of Hermod. Adding new motor, sensor, driver, MCU, or battery entries directly improves what everyone can generate.

#### How to submit a new hardware entry

1. **Copy the template** from the relevant category below
2. **Fill in all fields** — use datasheets and community knowledge
3. **Place it** in the correct directory under `packages/knowledge/`
4. **Update `INDEX.yaml`** — add your entry to the correct category
5. **Open a Pull Request**

#### Knowledge Base Entry Template

```yaml
# ============================================================
# <Part Name> — <Brief Description>
# ============================================================

id: "vendor-model"           # Unique ID, lowercase, kebab-case
category: "motor"            # motor | driver | sensor | mcu | battery
type: "BLDC"                 # Sub-type (see category-specific options)
tags: ["标签1", "tag2"]      # 2-5 tags for discoverability

# ── Physical ──
physical:
  weightG: 100               # Weight in grams
  dimensionsMm: [30, 30, 50] # [length, width, height] in mm
  shaftDiameterMm: 5         # Shaft diameter in mm (motors only, omit for others)
  mounting: "M3×4"           # Mounting hole pattern

# ── Electrical ──
electrical:                  # Fields vary by category — see examples
  ratedVoltageV: 24
  ratedCurrentA: 2.0
  peakCurrentA: 8.0
  # ...category-specific fields

# ── Control Interface (motors only) ──
control:
  protocol: "CAN"            # CAN | PWM | UART | SPI
  canBaudrate: 1000000       # only for CAN motors
  defaultCanId: 0x201        # optional, typical default ID
  controlMode: ["position", "speed", "current"]
  feedback: ["angle", "speed", "current", "temperature"]

# ── PID Defaults (motors only) ──
pidDefaults:
  currentLoop:  { kp: 1.0, ki: 0.1, kd: 0.0 }   # optional
  speedLoop:    { kp: 0.5, ki: 0.1, kd: 0.02 }   # optional
  positionLoop: { kp: 3.0, ki: 0.0, kd: 0.2 }    # optional

# ── Safety Boundaries (@ai-lock) ──
safety:
  maxCurrentA: 7.0            # REQUIRED — physical current limit
  maxTempC: 80               # REQUIRED — thermal limit
  # ...category-specific safety fields
  watchdogTimeoutMs: 100     # optional

# ── Source ──
source:
  datasheet: "https://..."   # URL to datasheet (if available)
  vendor: "Manufacturer"
  verifiedBy: ["community"]  # ["community"] or ["your-github-username"]
  lastUpdated: "YYYY-MM-DD"
  notes: "Additional context, common use cases, known issues."
```

#### Quality Guidelines

- **All `safety` fields are mandatory** — without them, Hermod cannot generate `@ai-lock` annotations
- **Use SI units** — grams, millimeters, volts, amps, newton-meters
- **Cite sources** — datasheet URL preferred; "community" if from experience
- **Be conservative with safety limits** — prefer datasheet values over "I pushed it harder once"
- **Keep tags in both English and Chinese** when applicable
- **Use 2-space indentation** in YAML

### 2. Add or Improve Templates

Templates are EJS files in `templates/`. They dictate what gets generated.

- **Fix templates**: if a generated file has a bug, fix the `.ejs` template
- **Add templates**: if you need a new output type (e.g., a new firmware module)
- **Template variables** are documented in the generator source (`packages/engine/src/generators/`)

### 3. Code Contributions

#### Setup

```bash
git clone https://github.com/Hermod-Robotics/hermod.git
cd hermod
pnpm install
pnpm -C packages/engine build
pnpm test
```

#### Project Structure

```
packages/engine/    — Core engine (types, validation, code generators)
packages/knowledge/ — Hardware knowledge base (YAML)
packages/cli/       — Interactive CLI (Phase 3)
templates/          — EJS templates
examples/           — Example robot projects
```

#### Before Submitting Code

- All existing tests must pass: `pnpm test`
- Add tests for new functionality
- Follow existing code conventions (see repo `CLAUDE.md`)
- Commit messages should follow the existing style

### 4. Report Bugs & Suggest Features

Use [GitHub Discussions](https://github.com/Hermod-Robotics/hermod/discussions) for ideas and questions, and Issues for confirmed bugs.

---

## Review Process

- **Hardware entries** are reviewed for datasheet accuracy and safety field completeness
- **Code contributions** require passing tests and maintainer review
- First-time contributors: your PR will be labeled `good first issue` — we'll help you through it

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/). Be respectful, be constructive, be collaborative.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

<p align="center">
  <sub>Questions? Open a <a href="https://github.com/Hermod-Robotics/hermod/discussions">Discussion</a>.</sub>
</p>
