import { FACTION } from "@/constants";

/**
 * 派閥（味方または敵）  
 * "ally" | "enemy"
 */
export type Faction = typeof FACTION [keyof typeof FACTION];
