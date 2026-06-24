import type { HardwareDescription } from './types';

/**
 * Validate the structure of a HardwareDescription object.
 *
 * This is a structural check — field presence, types, enum values.
 * Semantic validation (CAN ID conflicts, power budgets) lives in validator.ts.
 *
 * Returns an array of field-level issues; empty array = structurally valid.
 */
export function validateSchema(hw: unknown): SchemaIssue[] {
  const issues: SchemaIssue[] = [];

  if (!hw || typeof hw !== 'object') {
    return [{ field: '', message: 'HardwareDescription must be an object' }];
  }

  const h = hw as Record<string, unknown>;

  // ---- robot ----
  if (!h.robot || typeof h.robot !== 'object') {
    issues.push({ field: 'robot', message: 'robot is required' });
  } else {
    const r = h.robot as Record<string, unknown>;
    if (!r.name || typeof r.name !== 'string') {
      issues.push({ field: 'robot.name', message: 'robot.name (string) is required' });
    }
    const validTypes = ['diff_drive', 'ackermann', 'quadruped', 'arm_6dof', 'custom'];
    if (typeof r.type !== 'string' || !validTypes.includes(r.type)) {
      issues.push({ field: 'robot.type', message: `robot.type must be one of: ${validTypes.join(', ')}` });
    }
    if (!r.mcu || typeof r.mcu !== 'string') {
      issues.push({ field: 'robot.mcu', message: 'robot.mcu (string) is required — references a knowledge base MCU ID' });
    }
  }

  // ---- joints ----
  if (!Array.isArray(h.joints)) {
    issues.push({ field: 'joints', message: 'joints must be an array' });
  } else if (h.joints.length === 0) {
    issues.push({ field: 'joints', message: 'At least one joint is required' });
  } else {
    const validRoles = ['drive', 'steering', 'manipulation', 'passive'];

    for (let i = 0; i < h.joints.length; i++) {
      const joint = h.joints[i] as Record<string, unknown>;
      const prefix = `joints.${i}`;

      if (!joint.name || typeof joint.name !== 'string') {
        issues.push({ field: `${prefix}.name`, message: 'joint name (string) is required' });
      }

      if (joint.type === 'active') {
        if (!joint.motor || typeof joint.motor !== 'string') {
          issues.push({ field: `${prefix}.motor`, message: 'Active joint requires motor (knowledge base ID)' });
        }
        if (!joint.driver || typeof joint.driver !== 'string') {
          issues.push({ field: `${prefix}.driver`, message: 'Active joint requires driver (knowledge base ID)' });
        }
        if (joint.canId !== undefined && typeof joint.canId !== 'number') {
          issues.push({ field: `${prefix}.canId`, message: 'canId must be a number (e.g. 0x201)' });
        }
        if (joint.role && typeof joint.role === 'string' && !validRoles.includes(joint.role)) {
          issues.push({ field: `${prefix}.role`, message: `role must be one of: ${validRoles.join(', ')}` });
        }
      } else if (joint.type !== 'passive') {
        issues.push({ field: `${prefix}.type`, message: `joint type must be "active" or "passive", got "${joint.type}"` });
      }
    }
  }

  // ---- sensors ----
  if (!Array.isArray(h.sensors)) {
    issues.push({ field: 'sensors', message: 'sensors must be an array' });
  } else {
    const validInterfaces = ['UART', 'SPI', 'I2C', 'USB', 'CAN', 'GPIO'];

    for (let i = 0; i < h.sensors.length; i++) {
      const s = h.sensors[i] as Record<string, unknown>;
      const prefix = `sensors.${i}`;

      if (!s.name || typeof s.name !== 'string') {
        issues.push({ field: `${prefix}.name`, message: 'sensor name (string) is required' });
      }
      if (!s.model || typeof s.model !== 'string') {
        issues.push({ field: `${prefix}.model`, message: 'sensor model (knowledge base ID) is required' });
      }
      if (typeof s.interface !== 'string' || !validInterfaces.includes(s.interface)) {
        issues.push({ field: `${prefix}.interface`, message: `interface must be one of: ${validInterfaces.join(', ')}` });
      }
      if (!s.port || typeof s.port !== 'string') {
        issues.push({ field: `${prefix}.port`, message: 'sensor port (string) is required' });
      }
    }
  }

  // ---- power ----
  if (!h.power || typeof h.power !== 'object') {
    issues.push({ field: 'power', message: 'power is required' });
  } else {
    const p = h.power as Record<string, unknown>;
    if (!p.battery || typeof p.battery !== 'string') {
      issues.push({ field: 'power.battery', message: 'power.battery (knowledge base ID) is required' });
    }
    if (typeof p.voltageNominal !== 'number') {
      issues.push({ field: 'power.voltageNominal', message: 'power.voltageNominal (number) is required' });
    }
    if (!Array.isArray(p.voltageRange) || p.voltageRange.length !== 2) {
      issues.push({ field: 'power.voltageRange', message: 'power.voltageRange must be [min, max]' });
    }
  }

  // ---- ros (optional) ----
  if (h.ros !== undefined && h.ros !== null) {
    const r = h.ros as Record<string, unknown>;
    const validVersions = ['humble', 'iron', 'jazzy', 'rolling'];
    if (r.version && typeof r.version === 'string' && !validVersions.includes(r.version)) {
      issues.push({ field: 'ros.version', message: `ROS version must be one of: ${validVersions.join(', ')}` });
    }
  }

  return issues;
}

export interface SchemaIssue {
  field: string;
  message: string;
}
