# Diagnose Issues — AI Agent Workflow
> Generated for 巡检机器人-C3. Use: "Help me diagnose why left_front_wheel is not responding"
## Pre-flight Checks
1. Read `CLAUDE.md` — understand the full system architecture
2. Read `firmware/inc/can_config.h` — verify CAN topology
3. Read `firmware/inc/safety/limits.h` — check if safety limits triggered
4. Read `docs/BOM.md` — verify power budget
## Diagnostic Decision Tree
### Motor not responding?
```
├── Power check: Is the battery voltage within SAFE_BATTERY_MIN/MAX?
│   └── No → Charge/replace battery
├── CAN bus check: Is the motor CAN ID correct?
│   ├── Check CAN_BAUDRATE matches motor datasheet
│   ├── Check CAN_PERIPH_x is enabled in CubeMX/HAL
│   └── Check MCP2515 if using external CAN controller
├── Watchdog check: Has the motor timed out?
│   └── SAFE_WATCHDOG_TIMEOUT_MS may be too short
├── Safety check: Have any @ai-lock limits been tripped?
│   ├── Temperature > SAFE_*_MAX_TEMP_C?
│   ├── Current > SAFE_*_MAX_CURRENT_A?
│   └── Speed > SAFE_*_MAX_SPEED_RPM?
└── Driver check: Is the gate driver enabled?
└── DRV8301: check nFAULT pin / SPI fault register
```
### Sensor not reading?
```
├── Interface check: Correct port assignment?
│   ├── UART: baudrate match?
│   ├── SPI: CPOL/CPHA mode match?
│   ├── I2C: address scan (i2cdetect)?
│   └── GPIO: correct pin configured?
├── Power check: Is sensor getting correct voltage?
└── Init check: Has sensor been initialized in firmware?
```
## Checking @ai-lock Status
All `@ai-lock` parameters are listed in `docs/AI_ANNOTATIONS.md`. These are physical hardware limits — if any are tripped, the hardware must be inspected, not the code.
## Example
> "My left_front_wheel motor isn't spinning. Help me debug."
Agent should:
1. Walk the diagnostic tree (power → CAN → watchdog → safety → driver)
2. Check the generated CAN config and safety limits
3. Suggest specific commands to run (CAN bus sniffer, voltage measurement)
4. Never suggest bypassing @ai-lock safety limits