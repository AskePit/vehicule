export class Engine {
    constructor(maxTorque, maxRPM) {
        this.maxTorque = maxTorque
        this.maxRPM = maxRPM
        this.currentRPM = 0
        this.throttle = 0
    }

    getTorqueFactor(rpm) {
        const peakRPM = this.maxRPM * 0.66
        return rpm < peakRPM
            ? rpm / peakRPM // Rising section
            : 1.0 - (rpm - peakRPM) / (this.maxRPM - peakRPM) // Falling section
    }

    getTorque() {
        return this.maxTorque * this.getTorqueFactor(this.currentRPM)
    }

    update(dt) {
        let rpmIncrease = this.throttle * this.maxRPM * dt
        this.currentRPM += rpmIncrease
        if (this.currentRPM > this.maxRPM) this.currentRPM = this.maxRPM
    }
}

export class Clutch {
    constructor() {
        this.engagement = 1.0 // 1.0 = fully engaged, 0.0 = fully disengaged
    }

    setEngagement(value) {
        this.engagement = Math.max(0, Math.min(1, value)) // Clamp between 0 and 1
    }

    transferTorque(engineTorque) {
        return engineTorque * this.engagement
    }
}

export class Transmission {
    constructor() {
        this.gearRatios = [0, 3.6, 2.1, 1.4, 1.0, 0.8, 0.6] // Example gear ratios
        this.currentGear = 1
    }

    getOutputTorque(engineTorque) {
        return engineTorque * this.gearRatios[this.currentGear]
    }

    shiftGear(gear) {
        if (gear > 0 && gear < this.gearRatios.length) {
            this.currentGear = gear
        }
    }
}

export class Wheel {
    constructor(radius, mass) {
        this.radius = radius
        this.angularVelocity = 0
        this.mass = mass
    }

    applyTorque(inputTorque, dt) {
        let I = 0.5 * this.mass * this.radius ** 2 // Moment of inertia
        let angularAcceleration = inputTorque / I
        this.angularVelocity += angularAcceleration * dt
    }

    getLinearVelocity() {
        return this.angularVelocity * this.radius
    }
}
