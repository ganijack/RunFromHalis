/**
 * helpers.js — Shared math/easing utility functions
 * 
 * Pure functions used across multiple modules for interpolation,
 * easing, and value clamping.
 */

export function easeOutQuad(t) {
    return t * (2 - t);
}

export function easeInQuad(t) {
    return t * t;
}

export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function lerp(start, end, t) {
    return start + (end - start) * t;
}
