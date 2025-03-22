export function rpmToAngularVelocity(rpm) {
    return rpm * 2 * Math.PI / 60
}

export function angularVelocityToRpm(angularVelocity) {
    return angularVelocity * 60 / (2 * Math.PI)
}

export function wheelMomentOfInertia(radius, mass) {
    return 0.5 * mass * radius ** 2
}