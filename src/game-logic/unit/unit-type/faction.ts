import { FACTION } from "@/constants";

/**
 * 派閥（味方または敵）
 */
export type Faction = typeof FACTION [keyof typeof FACTION];
