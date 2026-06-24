import { describe, it, expect } from 'vitest';
import type { HardwareDescription } from '../types';
import { validateHardware } from '../validator';
import { validateSchema } from '../schema';

const validHw: HardwareDescription = {
  robot: {
    name: '测试小车',
    type: 'diff_drive',
    mcu: 'stm32f407',
  },
  joints: [
    {
      name: 'left_wheel',
      type: 'active',
      motor: 'dji-m3508',
      driver: 'drv8301',
      canId: 0x201,
      role: 'drive',
    },
    {
      name: 'right_wheel',
      type: 'active',
      motor: 'dji-m3508',
      driver: 'drv8301',
      canId: 0x202,
      role: 'drive',
    },
  ],
  sensors: [
    {
      name: 'imu',
      model: 'bmi088',
      interface: 'SPI',
      port: 'SPI2',
    },
  ],
  power: {
    battery: '6s-lipo',
    voltageNominal: 22.2,
    voltageRange: [18.0, 25.2],
  },
};

// ---- Schema Tests ----

describe('validateSchema', () => {
  it('passes a valid HardwareDescription', () => {
    const issues = validateSchema(validHw);
    expect(issues).toEqual([]);
  });

  it('rejects missing robot', () => {
    const issues = validateSchema({ joints: [], sensors: [], power: {} });
    expect(issues.some((i) => i.field === 'robot')).toBe(true);
  });

  it('rejects invalid robot.type', () => {
    const hw = {
      ...validHw,
      robot: { ...validHw.robot, type: 'hexapod' },
    };
    const issues = validateSchema(hw);
    expect(issues.some((i) => i.field === 'robot.type')).toBe(true);
  });

  it('rejects empty joints array', () => {
    const hw = { ...validHw, joints: [] };
    const issues = validateSchema(hw);
    expect(issues.some((i) => i.field === 'joints')).toBe(true);
  });

  it('rejects active joint without motor', () => {
    const hw = {
      ...validHw,
      joints: [{ name: 'bad', type: 'active', driver: 'x' }],
    };
    const issues = validateSchema(hw);
    expect(issues.some((i) => i.field === 'joints.0.motor')).toBe(true);
  });

  it('rejects sensor with invalid interface', () => {
    const hw = {
      ...validHw,
      sensors: [{ name: 'bad', model: 'x', interface: 'WIFI', port: 'x' }],
    };
    const issues = validateSchema(hw);
    expect(issues.some((i) => i.field === 'sensors.0.interface')).toBe(true);
  });

  it('rejects missing voltageRange', () => {
    const hw = {
      ...validHw,
      power: { battery: 'x', voltageNominal: 12 },
    };
    const issues = validateSchema(hw);
    expect(issues.some((i) => i.field === 'power.voltageRange')).toBe(true);
  });

  it('rejects non-object input', () => {
    const issues = validateSchema(null);
    expect(issues.length).toBeGreaterThan(0);
  });
});

// ---- Validator Tests ----

describe('validateHardware', () => {
  it('passes a valid config with no CAN conflicts', () => {
    const results = validateHardware(validHw);
    const errors = results.filter((r) => r.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('detects duplicate CAN IDs', () => {
    const hw: HardwareDescription = {
      ...validHw,
      joints: [
        {
          name: 'left_wheel',
          type: 'active',
          motor: 'dji-m3508',
          driver: 'drv8301',
          canId: 0x201,
          role: 'drive',
        },
        {
          name: 'right_wheel',
          type: 'active',
          motor: 'dji-m3508',
          driver: 'drv8301',
          canId: 0x201, // DUPLICATE
          role: 'drive',
        },
      ],
    };
    const results = validateHardware(hw);
    const canErrors = results.filter((r) => r.field?.includes('canId'));
    expect(canErrors.length).toBeGreaterThan(0);
    expect(canErrors[0].severity).toBe('error');
  });

  it('allows joints without explicit CAN IDs', () => {
    const hw: HardwareDescription = {
      ...validHw,
      joints: [
        {
          name: 'motor_a',
          type: 'active',
          motor: 'dji-m3508',
          driver: 'drv8301',
          role: 'drive',
          // canId intentionally omitted — defaults handled by generator
        },
        {
          name: 'motor_b',
          type: 'active',
          motor: 'dji-m3508',
          driver: 'drv8301',
          role: 'drive',
        },
      ],
    };
    const results = validateHardware(hw);
    const canErrors = results.filter((r) => r.field?.includes('canId'));
    expect(canErrors).toEqual([]);
  });

  it('passes passive joints without conflict checks', () => {
    const hw: HardwareDescription = {
      ...validHw,
      joints: [
        {
          name: 'drive_wheel',
          type: 'active',
          motor: 'dji-m3508',
          driver: 'drv8301',
          canId: 0x201,
          role: 'drive',
        },
        {
          name: 'caster',
          type: 'passive',
          role: 'passive',
        },
      ],
    };
    const results = validateHardware(hw);
    const errors = results.filter((r) => r.severity === 'error');
    expect(errors).toEqual([]);
  });
});
