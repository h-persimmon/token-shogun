# Design Document

## Overview

The enemy target switching system will enhance combat dynamics by making enemies respond intelligently to attacks from allied units. When an enemy receives a melee attack, it will evaluate whether to switch its target to the attacking unit based on configurable criteria such as proximity, threat level, and cooldown periods. This system integrates with the existing ECS architecture, leveraging the current TargetingSystem, AttackSystem, and component structure.

## Architecture

The target switching functionality will be implemented as an extension to the existing TargetingSystem rather than a separate system. This approach ensures seamless integration with current targeting logic and maintains the single responsibility principle for target management.

### Key Integration Points

1. **AttackSystem Integration**: The AttackSystem already records damage sources in the HealthComponent via `recordDamageSource()`. This provides the trigger mechanism for target switching.

2. **TargetingSystem Enhancement**: The existing `updateEnemyTarget()` method will be extended to check for recent damage sources and evaluate target switching opportunities.

3. **Component Utilization**: 
   - HealthComponent's `lastDamageFrom` and `lastDamageTime` fields provide attack tracking
   - TargetComponent manages current targets and can be extended for switching logic
   - EnemyComponent can store target switching configuration per enemy type

## Components and Interfaces

### Enhanced HealthComponent
The existing HealthComponent already tracks damage sources:
```typescript
type HealthComponent = {
  // ... existing fields
  lastDamageTime?: number;
  lastDamageFrom?: string; // Attacker entity ID
}
```

### Enhanced EnemyComponent
Extend the EnemyComponent to include target switching configuration:
```typescript
type EnemyTargetSwitchingConfig = {
  enabled: boolean;
  cooldownMs: number;
  pursuitRange: number;
  threatThreshold: number;
}

type EnemyComponent = {
  // ... existing fields
  targetSwitching?: EnemyTargetSwitchingConfig;
  lastTargetSwitchTime?: number;
}
```

### Enhanced TargetComponent
Add target switching state tracking:
```typescript
type TargetComponent = {
  // ... existing fields
  originalTargetId?: string; // Store original target for potential reversion
  switchReason?: 'attack' | 'proximity' | 'threat';
  canSwitchTarget?: boolean; // Flag to prevent rapid switching
}
```

## Data Models

### Target Switching Configuration
```typescript
interface TargetSwitchingConfig {
  globalEnabled: boolean;
  defaultCooldownMs: number;
  defaultPursuitRange: number;
  defaultThreatThreshold: number;
  enemyTypeConfigs: Record<string, EnemyTargetSwitchingConfig>;
}
```

### Target Switch Evaluation Result
```typescript
interface TargetSwitchEvaluation {
  shouldSwitch: boolean;
  newTargetId?: string;
  reason: 'cooldown' | 'no_attacker' | 'out_of_range' | 'lower_priority' | 'switch_approved';
  priority: number;
}
```

## Error Handling

### Invalid Target Scenarios
- **Attacker No Longer Exists**: If the attacking entity is destroyed before target switching occurs, the system will ignore the switch request
- **Attacker Out of Range**: If the attacker moves beyond pursuit range, the enemy may revert to its original target
- **Invalid Original Target**: If the original target becomes invalid during combat, the system will select a new target using existing targeting logic

### Cooldown Management
- **Rapid Attack Handling**: Multiple attacks within the cooldown period will update the damage source but not trigger additional switches
- **System Performance**: Target switching evaluation will be limited to enemies that have recently taken damage to avoid unnecessary processing

### Configuration Validation
- **Invalid Cooldown Values**: Negative or zero cooldown values will default to 2000ms
- **Invalid Range Values**: Negative pursuit ranges will default to 150% of the enemy's attack range
- **Missing Enemy Type Config**: Enemies without specific configuration will use global defaults

## Implementation Flow

### Target Switch Trigger (AttackSystem)
1. AttackSystem applies damage via `calculateAndApplyDamage()`
2. `recordDamageSource()` updates HealthComponent with attacker info
3. No immediate target switching - evaluation happens in TargetingSystem update

### Target Switch Evaluation (TargetingSystem)
1. `updateEnemyTarget()` checks for recent damage sources
2. If damage source exists and cooldown has passed, evaluate target switch
3. Calculate switch priority based on distance, threat, and configuration
4. If switch is approved, update TargetComponent and MovementComponent

### Target Switch Execution
1. Store original target in TargetComponent for potential reversion
2. Set new target to attacking entity
3. Update movement destination to pursue new target
4. Record switch time to enforce cooldown
5. Clear damage source to prevent repeated evaluation

### Target Reversion Logic
1. Monitor distance between enemy and switched target
2. If target moves beyond pursuit range, evaluate reversion
3. Check if original target is still valid and within reasonable range
4. Revert to original target or select new target using standard logic

## Configuration System

### Default Configuration
```typescript
const DEFAULT_TARGET_SWITCHING_CONFIG: TargetSwitchingConfig = {
  globalEnabled: true,
  defaultCooldownMs: 2000,
  defaultPursuitRange: 1.5, // Multiplier of attack range
  defaultThreatThreshold: 0.5,
  enemyTypeConfigs: {
    'basic': { enabled: true, cooldownMs: 2000, pursuitRange: 1.5, threatThreshold: 0.5 },
    'fast': { enabled: true, cooldownMs: 1500, pursuitRange: 2.0, threatThreshold: 0.3 },
    'heavy': { enabled: true, cooldownMs: 3000, pursuitRange: 1.2, threatThreshold: 0.7 }
  }
};
```

### Configuration Loading
The configuration will be loaded during TargetingSystem initialization and can be updated at runtime through a configuration management interface. This allows for gameplay balancing without code changes.