//
// a few functions used to do stuff with angles
//

export function rad2deg(angle) {
    return angle * 360 / (2*Math.PI)
}
export function deg2rad(angle) {
    return angle * (2*Math.PI) / 360
}

/**
 * clamp the angle to the range [0, 2*PI]
 * @param {number} angle
 * @return {number}
 */
export function clampAngleRad(angle) {
    return (angle + 4 * Math.PI) % (2 * Math.PI)
}

/**
 * clamp the angle to the range [0, 360]
 * @param {number} angle
 * @return {number}
 */
export function clampAngleDeg(angle) {
    return (angle + 720) % 360
}