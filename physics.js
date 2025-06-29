export function rpmToAngularVelocity(rpm) {
    return rpm * 2 * Math.PI / 60
}

export function angularVelocityToRpm(angularVelocity) {
    return angularVelocity * 60 / (2 * Math.PI)
}

export function wheelMomentOfInertia(radius, mass) {
    return 0.5 * mass * radius ** 2
}

export function msTokmh(ms) {
    return ms * 3600 / 1000
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

export function remap(x, inMin, inMax, outMin, outMax) {
    return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin
}
