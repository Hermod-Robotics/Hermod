// ============================================================
// Hermod Engine — Core Type Definitions
// ============================================================

// ---- Robot Identity ----

export type RobotType = 'diff_drive' | 'ackermann' | 'quadruped' | 'arm_6dof' | 'custom';

export interface RobotInfo {
  /** Project / robot name */
  name: string;
  /** Kinematic type */
  type: RobotType;
  /** Knowledge base ID for the MCU (e.g. "stm32f407") */
  mcu: string;
  /** Optional free-text description */
  description?: string;
}

// ---- Joints ----

export type JointRole = 'drive' | 'steering' | 'manipulation' | 'passive';

export interface ActiveJoint {
  name: string;
  type: 'active';
  /** Knowledge base ID for the motor (e.g. "dji-m3508") */
  motor: string;
  /** Knowledge base ID for the motor driver (e.g. "drv8301") */
  driver: string;
  /** CAN bus identifier (auto-assigned if omitted) */
  canId?: number;
  /** Functional role of this joint */
  role: JointRole;
}

export interface PassiveJoint {
  name: string;
  type: 'passive';
  role: 'passive';
}

export type Joint = ActiveJoint | PassiveJoint;

// ---- Sensors ----

export type SensorInterface = 'UART' | 'SPI' | 'I2C' | 'USB' | 'CAN' | 'GPIO';

export interface SensorMount {
  /** Position relative to robot base_link (meters) */
  x: number;
  y: number;
  z: number;
  /** Orientation in Euler angles (radians) */
  roll?: number;
  pitch?: number;
  yaw?: number;
}

export interface Sensor {
  name: string;
  /** Knowledge base ID (e.g. "rplidar-a3", "bmi088") */
  model: string;
  /** Physical interface */
  interface: SensorInterface;
  /** Interface port/path (e.g. "/dev/ttyUSB0", "SPI2") */
  port: string;
  /** Baud rate for UART (optional) */
  baudrate?: number;
  /** Mount position and orientation */
  mount?: SensorMount;
}

// ---- Power ----

export interface Power {
  /** Knowledge base ID for the battery (e.g. "6s-lipo") */
  battery: string;
  /** Nominal voltage */
  voltageNominal: number;
  /** Voltage operating range [min, max] */
  voltageRange: [number, number];
}

// ---- ROS ----

export type RosVersion = 'humble' | 'iron' | 'jazzy' | 'rolling';

export interface RosConfig {
  version: RosVersion;
  /** ROS namespace for all nodes */
  namespace?: string;
}

// ---- Top-Level Hardware Description ----

export interface HardwareDescription {
  robot: RobotInfo;
  joints: Joint[];
  sensors: Sensor[];
  power: Power;
  ros?: RosConfig;
}

// ---- Knowledge Base Types ----

export interface MotorEntry {
  id: string;
  category: 'motor';
  type: 'BLDC' | 'DC' | 'Stepper' | 'Servo';
  tags: string[];
  physical: {
    weightG: number;
    dimensionsMm: [number, number, number];
    shaftDiameterMm: number;
    mounting: string;
  };
  electrical: {
    ratedVoltageV: number;
    ratedCurrentA: number;
    peakCurrentA: number;
    phaseResistanceOhm: number;
    phaseInductanceMh: number;
    polePairs: number;
    kvRpmPerV: number;
  };
  mechanical: {
    ratedTorqueNm: number;
    peakTorqueNm: number;
    maxSpeedRpm: number;
    reductionRatio: number;
    backlashDeg?: number;
  };
  control: {
    protocol: 'CAN' | 'PWM' | 'UART' | 'SPI';
    canBaudrate?: number;
    defaultCanId?: number;
    controlMode: ('position' | 'speed' | 'current')[];
    feedback: ('angle' | 'speed' | 'current' | 'temperature')[];
  };
  pidDefaults: {
    currentLoop?: PidValues;
    speedLoop?: PidValues;
    positionLoop?: PidValues;
  };
  safety: SafetyLimits;
  source: SourceInfo;
}

export interface DriverEntry {
  id: string;
  category: 'driver';
  type: string;
  tags: string[];
  supportedMotors: string[];
  electrical: {
    maxVoltageV: number;
    maxCurrentA: number;
    continuousCurrentA: number;
  };
  interface: {
    controlProtocol: 'SPI' | 'PWM' | 'UART' | 'CAN';
    spiMode?: number;
    maxFrequencyHz?: number;
  };
  features: string[];
  safety: SafetyLimits;
  source: SourceInfo;
}

export interface SensorEntry {
  id: string;
  category: 'sensor';
  type: 'IMU' | 'LIDAR' | 'Camera' | 'ToF' | 'Encoder' | 'GPS';
  tags: string[];
  physical: {
    weightG: number;
    dimensionsMm: [number, number, number];
  };
  electrical: {
    voltageV: number;
    currentMa: number;
    interface: SensorInterface;
  };
  performance: Record<string, unknown>;
  safety: SafetyLimits;
  source: SourceInfo;
}

export interface McuEntry {
  id: string;
  category: 'mcu';
  architecture: 'ARM-Cortex-M' | 'ARM-Cortex-A' | 'RISC-V' | 'Xtensa';
  tags: string[];
  specs: {
    core: string;
    maxFrequencyMhz: number;
    flashKb: number;
    sramKb: number;
  };
  peripherals: {
    uart: number;
    spi: number;
    i2c: number;
    can: number;
    gpio: number;
    pwm: number;
    adc: number;
  };
  packages: string[];
  safety: SafetyLimits;
  source: SourceInfo;
}

export interface BatteryEntry {
  id: string;
  category: 'battery';
  type: 'LiPo' | 'LiIon' | 'LiFePO4' | 'NiMH';
  cells: number;
  configuration: string;
  nominalVoltageV: number;
  capacityMah: number;
  continuousDischargeC: number;
  peakDischargeC: number;
  safety: SafetyLimits;
  source: SourceInfo;
}

export type KnowledgeEntry = MotorEntry | DriverEntry | SensorEntry | McuEntry | BatteryEntry;

// ---- Shared Types ----

export interface PidValues {
  kp: number;
  ki: number;
  kd: number;
}

export interface SafetyLimits {
  [key: string]: number | string | undefined;
}

export interface SourceInfo {
  datasheet?: string;
  vendor?: string;
  verifiedBy: string[];
  lastUpdated: string;
  notes?: string;
}

// ---- Validation ----

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationResult {
  severity: ValidationSeverity;
  message: string;
  /** Related field path (e.g. "joints.0.canId") */
  field?: string;
}

// ---- Code Generation ----

export interface GenerateOptions {
  /** Target output directory */
  outputDir: string;
  /** Robot type specific generation flags */
  flags?: {
    /** Generate simulation files */
    sim?: boolean;
    /** Simulation backend */
    simBackend?: 'gazebo' | 'mujoco';
    /** Generate wiring diagram */
    wiring?: boolean;
  };
}

export interface GeneratedFile {
  /** Relative path within the output directory */
  path: string;
  /** File content (rendered) */
  content: string;
}
