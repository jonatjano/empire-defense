export function rad2deg(angle) {
    return angle * 360 / (2*Math.PI)
}
export function deg2rad(angle) {
    return angle * (2*Math.PI) / 360
}

export function clampAngleRad(angle) {
    return (angle + 4 * Math.PI) % (2 * Math.PI)
}
export function clampAngleDeg(angle) {
    return (angle + 720) % 360
}