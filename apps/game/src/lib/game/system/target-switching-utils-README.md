# Target Switching Utility Functions

This module provides utility functions for implementing intelligent target switching behavior in the enemy AI system. These functions help enemies make informed decisions about when and how to switch targets based on various factors like distance, threat level, and cooldown periods.

## Overview

The target switching utilities are designed to work with the existing ECS (Entity-Component-System) architecture and provide helper functions for:

1. **Target switching decisions** - Determining when an enemy should switch targets
2. **Pursuit range calculations** - Calculating effective ranges for target pursuit
3. **Threat assessment** - Evaluating the threat level of potential targets
4. **Priority scoring** - Calculating priority scores for target selection
5. **Validation** - Ensuring target switching decisions meet all criteria

## Core Functions

### Distance and Range Calculations

#### `calculateDistancePriority(distance, maxConsideredDistance?)`
Calculates a priority score based on distance to target.
- **Returns**: 0-40 points (closer targets get higher scores)
- **Usage**: Used in target selection algorithms to prefer closer targets

#### `calculatePursuitRange(enemyComponent, baseAttackRange)`
Calculates the effective pursuit range for an enemy based on its configuration.
- **Returns**: Pursuit range in pixels
- **Usage**: Determines how far an enemy will chase a target

#### `calculatePursuitRangeWithMargin(enemyComponent, baseAttackRange, safetyMargin?)`
Calculates pursuit range with an additional safety margin.
- **Default margin**: 1.1 (10% extra range)
- **Usage**: Used for target abandonment decisions to prevent oscillation

### Threat Assessment

#### `calculateThreatLevel(targetEntity, enemyEntity)`
Calculates a comprehensive threat level score for a target.
- **Factors**: Attack power, health ratio, relative damage potential, unit type
- **Returns**: 0-100 threat score
- **Usage**: Used to prioritize high-threat targets

#### `shouldConsiderThreatBasedSwitch(currentThreat, newThreat, threatThreshold)`
Determines if a target switch should be considered based on threat levels.
- **Threshold**: 0-1 range (converted to 0-100 points internally)
- **Returns**: Boolean indicating if switch should be considered
- **Usage**: Prevents switching to marginally better targets

### Priority Scoring

#### `calculateAttackPriority(damage?)`
Calculates priority score based on target's attack power.
- **Returns**: 0-30 points
- **Usage**: Prioritizes high-damage targets

#### `calculateHealthPriority(currentHealth?, maxHealth?)`
Calculates priority score based on target's health ratio.
- **Returns**: 0-20 points (lower health = higher priority)
- **Usage**: Prioritizes weakened targets for quick elimination

#### `calculateUnitTypePriority(isUnit)`
Calculates priority bonus for unit vs structure targets.
- **Returns**: 10 points for units, 0 for structures
- **Usage**: Generally prioritizes mobile units over static structures

### Target Selection

#### `selectOptimalTarget(enemyEntity, candidates, enemyComponent?)`
Selects the best target from a list of candidates using comprehensive scoring.
- **Scoring factors**: Distance, attack power, health, unit type
- **Range filtering**: Only considers targets within pursuit range
- **Returns**: Best target entity or null
- **Usage**: Main target selection function

### Validation and Cooldowns

#### `validateTargetSwitchDecision(enemyEntity, currentTargetId?, newTargetId, entityManager, currentTime?)`
Validates if a target switching decision meets all criteria.
- **Checks**: Component existence, switching enabled, cooldown, target validity, range, threat improvement
- **Returns**: `{isValid: boolean, reason?: string}`
- **Usage**: Ensures target switches are valid before execution

#### `calculateTargetSwitchCooldownRemaining(lastSwitchTime?, cooldownMs?, currentTime?)`
Calculates remaining cooldown time for target switching.
- **Returns**: Milliseconds remaining (0 if no cooldown)
- **Usage**: Prevents rapid target switching

#### `shouldAbandonTarget(enemyEntity, targetEntity, enemyComponent?)`
Determines if an enemy should abandon its current target due to range constraints.
- **Uses**: Pursuit range with additional margin (default 1.2x)
- **Returns**: Boolean indicating if target should be abandoned
- **Usage**: Prevents enemies from chasing targets indefinitely

## Integration with Existing Systems

### With TargetingSystem
The utility functions are designed to integrate with the existing `TargetingSystem`:

```typescript
// Example usage in TargetingSystem
const switchEvaluation = evaluateTargetSwitch(enemyEntity, attackerId, entityManager);
if (switchEvaluation.shouldSwitch) {
  const optimalTarget = selectOptimalTarget(enemyEntity, candidates);
  if (optimalTarget && validateTargetSwitchDecision(enemyEntity, currentTargetId, optimalTarget.id, entityManager).isValid) {
    // Execute target switch
  }
}
```

### With EnemyComponent
The functions work with the existing `EnemyComponent` structure and its target switching configuration:

```typescript
type EnemyTargetSwitchingConfig = {
  enabled: boolean;
  cooldownMs: number;
  pursuitRange: number;
  threatThreshold: number;
}
```

## Performance Considerations

1. **Pre-passed Components**: Many functions accept optional pre-passed components to avoid repeated lookups
2. **Range Filtering**: Target selection functions filter by range early to avoid unnecessary calculations
3. **Minimal Calculations**: Priority calculations are kept simple and fast
4. **Caching Opportunities**: Results can be cached when appropriate (e.g., threat levels for static targets)

## Testing

The utility functions are thoroughly tested with unit tests covering:
- Edge cases (undefined inputs, zero values)
- Boundary conditions (maximum/minimum values)
- Mathematical correctness (priority calculations, range checks)
- Integration scenarios (multiple candidates, complex configurations)

## Requirements Satisfied

This implementation satisfies the following requirements from the target switching specification:

- **Requirement 2.2**: Intelligent target switching with priority-based selection
- **Requirement 2.3**: Threat assessment logic for target prioritization  
- **Requirement 4.3**: Configurable target switching behavior parameters

The utility functions provide the foundation for implementing sophisticated target switching behavior while maintaining good performance and integration with the existing codebase.