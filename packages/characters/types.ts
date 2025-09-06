// 味方ユニット設定
export type AllyUnitConfig = {
	id: string;
	unitType: 'soldier' | 'archer' | 'mage' | string;
	maxHealth: number;
	speed: number;
  battleEffectId?: string;
  attackDamage: number;
  attackRange: number;
};

// 敵ユニット設定
export type EnemyUnitConfig = {
	id: string;
  charachip: string;
	charachipConfig?: {
		frameWidth: number;
		frameHeight: number;
		displayWidth: number;
	}
	unitType: 'basic' | 'fast' | 'heavy' | string;
	maxHealth: number;
	speed: number;
  battleEffectId?: string;
  attackDamage: number;
  attackRange: number;
	rewardValue?: number;
	structureTargetPriority?: 'gate' | 'defense' | 'any';
};

// 砲台（構造物）設定
export type TurretConfig = {
	id: string;
	structureType: 'cannon' | 'tower' | 'gate' | 'wall' | 'barracks' | string;
  attackDamage?: number;
  attackRange?: number;
	isCriticalForLose?: boolean;
	attackableType?: 'none' | 'with-unit' | 'auto';
	deployedUnitId?: string;
	maxUnits?: number;
};