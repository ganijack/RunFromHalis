/**
 * Config.js — Game constants and configuration
 * 
 * Central configuration for all gameplay parameters, visual settings,
 * and color palettes. Modify values here to tune the game without
 * touching any logic files.
 */

// ===== GAMEPLAY & WORLD CONSTANTS =====
export const CONFIG = {
    // World layout
    LANE_WIDTH: 2.5,
    LANE_POSITIONS: [-2.5, 0, 2.5],
    TRACK_WIDTH: 10,
    VISIBLE_DISTANCE: 100,
    GROUND_Y: 0,
    PLAYER_HEIGHT: 1.8,

    // Camera
    CAMERA_HEIGHT: 8,
    CAMERA_DISTANCE: 12,
    CAMERA_FOV: 65,

    // Player movement
    JUMP_HEIGHT: 3.5,
    JUMP_DURATION: 550,
    SLIDE_DURATION: 500,
    LANE_CHANGE_DURATION: 180,

    // Speed progression
    BASE_SPEED: 15,
    MAX_SPEED: 35,
    ACCELERATION: 0.5,

    // Scoring
    COIN_VALUE: 10,
    DISTANCE_SCORE_MULTIPLIER: 1,

    // Visual / fog
    FOG_COLOR: 0x0a0a2e,
    FOG_NEAR: 30,
    FOG_FAR: 120
};

// ===== COLOR PALETTE =====
export const COLORS = {
    SKY_TOP: 0x050520,
    SKY_BOTTOM: 0x1a1040,
    GROUND: 0x222222,
    RAIL: 0xA0A0B0,
    PLAYER_SKIN: 0xF4C7A1,
    PLAYER_SHIRT: 0x4A90D9,
    PLAYER_PANTS: 0x2C3E50,
    PLAYER_SHOES: 0xE74C3C,
    COIN: 0xFFD700,
    BARRIER: 0xFF6B35,
    TRAIN: 0x3a3a5a,
    OVERHEAD: 0x27AE60,
    BUILDING: [0x1a1a2e, 0x2a2a4e, 0x1e2d3d, 0x2d1b3d, 0x1b2d2d],
    WINDOW_WARM: 0xFFE4AA,
    WINDOW_COOL: 0x99CCFF,
    WALL: 0x2a2a3a
};
