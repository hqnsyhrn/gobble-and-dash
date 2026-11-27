// Gobble & Dash — config tuning, one place for all the numbers.
export const CONFIG = {
  tile: 40,                     // grid cell size in px
  worldCols: 60,                // stage width in cells (camera follows the turkey)
  timeStep: 1 / 60,             // fixed physics step
  turkey: {
    speed: 3.4,                 // cells per second on ground
    sprintSpeed: 5.0,           // while sprinting (stamina drains)
    staminaMax: 4.0,            // seconds of sprint
    staminaRegen: 1.6,          // stamina per second when not sprinting
    radius: 0.34,               // collision radius in cells
    squashAnim: 0.25,
  },
  farmer: {
    walkSpeed: 2.6,
    runSpeed: 4.4,              // chasing speed
    sightRange: 9,              // cells; needs line of sight
    fovDeg: 110,                // field of view
    searchTime: 3.5,            // seconds searching last-known spot
    cornerSpeed: 5.2,           // burst when close (cornering)
  },
  danger: {
    knifeSpeed: 3.2,            // carving knife patrol speed
    ovenCooldown: 1.4,          // seconds between oven flame bursts
    ovenRange: 1.1,             // cells the flame reaches
  },
  corn: {
    score: 25,                  // per kernel
    staminaBoost: 1.2,          // seconds restored
  },
  goalScore: 1500,              // bonus for escaping through the kitchen door
  lives: 3,
  stageNames: ['Barnyard', 'Cornfield', 'Farmyard Fence', 'Kitchen Approach', 'The Kitchen'],
};
