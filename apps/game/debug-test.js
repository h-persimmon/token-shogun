// Simple debug test
const distance = 80;
const baseRange = 50;
const pursuitMultiplier = 1.5;
const pursuitRange = baseRange * pursuitMultiplier;

console.log("Distance:", distance);
console.log("Base range:", baseRange);
console.log("Pursuit multiplier:", pursuitMultiplier);
console.log("Pursuit range:", pursuitRange);
console.log("Is in range?", distance <= pursuitRange);

// Test calculateDistance
const pos1 = { x: 0, y: 0 };
const pos2 = { x: 80, y: 0 };
const calculatedDistance = Math.sqrt((pos2.x - pos1.x) ** 2 + (pos2.y - pos1.y) ** 2);
console.log("Calculated distance:", calculatedDistance);