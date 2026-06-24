import type { HardwareDescription, ActiveJoint, ValidationResult, MotorEntry, McuEntry } from './types';

/**
 * Semantic validation of a HardwareDescription.
 *
 * Checks (with knowledge base context when available):
 *  1. CAN ID conflicts — duplicate IDs across active joints
 *  2. Power budget — total peak current vs battery capability
 *  3. Peripheral budget — MCU peripheral count vs required interfaces
 *
 * Structural validation (field types, enums) is handled by schema.ts.
 */
export function validateHardware(
  hw: HardwareDescription,
  kb?: KnowledgeContext,
): ValidationResult[] {
  const results: ValidationResult[] = [];

  results.push(...checkCanConflicts(hw));
  results.push(...checkPowerBudget(hw, kb));
  results.push(...checkPeripheralBudget(hw, kb));

  return results;
}

// ---- CAN ID Conflicts ----

function checkCanConflicts(hw: HardwareDescription): ValidationResult[] {
  const results: ValidationResult[] = [];
  const activeJoints = hw.joints.filter((j): j is ActiveJoint => j.type === 'active');
  const seen = new Map<number, string>();

  for (const joint of activeJoints) {
    if (joint.canId === undefined) continue;

    if (seen.has(joint.canId)) {
      results.push({
        severity: 'error',
        message: `CAN ID 0x${joint.canId.toString(16)} conflict: "${seen.get(joint.canId)}" and "${joint.name}" share the same ID`,
        field: `joints.${hw.joints.indexOf(joint)}.canId`,
      });
    } else {
      seen.set(joint.canId, joint.name);
    }
  }

  return results;
}

// ---- Power Budget ----

function checkPowerBudget(hw: HardwareDescription, kb?: KnowledgeContext): ValidationResult[] {
  const results: ValidationResult[] = [];

  // Without KB data, we can't compute power budget precisely
  if (!kb) return results;

  const activeJoints = hw.joints.filter((j): j is ActiveJoint => j.type === 'active');
  let totalPeakCurrentA = 0;

  for (const joint of activeJoints) {
    const motor = kb.motors.get(joint.motor);
    if (motor) {
      totalPeakCurrentA += motor.electrical.peakCurrentA;
    }
  }

  for (const sensor of hw.sensors) {
    const sensorEntry = kb.sensors.get(sensor.model);
    if (sensorEntry) {
      totalPeakCurrentA += sensorEntry.electrical.currentMa / 1000;
    }
  }

  // Battery check
  const battery = kb.batteries.get(hw.power.battery);
  if (battery) {
    const batteryMaxCurrent = (battery.capacityMah / 1000) * battery.continuousDischargeC;
    if (totalPeakCurrentA > batteryMaxCurrent) {
      results.push({
        severity: 'warning',
        message: `Peak current draw (${totalPeakCurrentA.toFixed(1)}A) exceeds battery continuous rating (${batteryMaxCurrent.toFixed(1)}A)`,
        field: 'power.battery',
      });
    }
  }

  return results;
}

// ---- Peripheral Budget ----

function checkPeripheralBudget(hw: HardwareDescription, kb?: KnowledgeContext): ValidationResult[] {
  const results: ValidationResult[] = [];

  if (!kb) return results;

  const mcu = kb.mcus.get(hw.robot.mcu);
  if (!mcu) return results;

  // Count required interfaces
  let spiNeeded = 0;
  let uartNeeded = 0;
  let i2cNeeded = 0;
  let canNeeded = 0;

  // Each active joint with CAN motor = 1 CAN peripheral
  const activeJoints = hw.joints.filter((j): j is ActiveJoint => j.type === 'active');
  for (const joint of activeJoints) {
    const motor = kb.motors.get(joint.motor);
    if (motor?.control.protocol === 'CAN') {
      canNeeded++;
    }
  }

  // Sensors
  for (const sensor of hw.sensors) {
    const sensorEntry = kb.sensors.get(sensor.model);
    if (sensorEntry) {
      switch (sensorEntry.electrical.interface) {
        case 'SPI': spiNeeded++; break;
        case 'UART': uartNeeded++; break;
        case 'I2C': i2cNeeded++; break;
        case 'CAN': canNeeded++; break;
      }
    }
  }

  // Check against MCU limits
  // Note: Multiple SPI devices can share a bus (CS pins), multiple CAN on one controller.
  // These are worst-case warnings — a real pin mapper would be more precise.
  if (spiNeeded > mcu.peripherals.spi) {
    results.push({
      severity: 'warning',
      message: `${spiNeeded} SPI devices declared, MCU has ${mcu.peripherals.spi} SPI controllers (may share bus with separate CS)`,
      field: 'sensors',
    });
  }

  if (uartNeeded > mcu.peripherals.uart) {
    results.push({
      severity: 'error',
      message: `${uartNeeded} UART devices declared, but ${mcu.id} has only ${mcu.peripherals.uart} UART controllers`,
      field: 'sensors',
    });
  }

  if (canNeeded > mcu.peripherals.can * 8) {
    // Rough: ~8 nodes per CAN bus is typical
    results.push({
      severity: 'warning',
      message: `${canNeeded} CAN nodes declared, MCU has ${mcu.peripherals.can} CAN controllers`,
      field: 'joints',
    });
  }

  return results;
}

// ---- Knowledge Context (built from YAML knowledge base) ----

export interface KnowledgeContext {
  motors: Map<string, MotorEntry>;
  sensors: Map<string, import('./types').SensorEntry>;
  mcus: Map<string, McuEntry>;
  drivers: Map<string, import('./types').DriverEntry>;
  batteries: Map<string, import('./types').BatteryEntry>;
}
