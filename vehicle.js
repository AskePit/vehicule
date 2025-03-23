import { rpmToAngularVelocity, angularVelocityToRpm, wheelMomentOfInertia, msTokmh, clamp } from './physics.js'

export class Engine {
    maxTorque
    minRpm
    maxRpm

    currentRpm
    throttle // [0.0; 1.0] from no gas to floor pedal
    clutch   // [0.0; 1.0] from disengaged to fully engaged

    constructor(maxTorque, minRpm, maxRpm) {
        this.maxTorque = maxTorque
        this.minRpm = minRpm
        this.maxRpm = maxRpm

        this.currentRpm = minRpm
        this.throttle = 0
    }

    #getTorqueFactor() {
        const peakRpm = 4000  // Where max torque happens
        const spread = 4000   // How wide the peak is
    
        let factor = 1.0 - Math.pow((this.currentRpm - peakRpm) / spread, 2)
        return Math.max(0, factor)  // Ensure non-negative values
    }

    getProducedTorque() {
        return this.maxTorque * this.#getTorqueFactor(this.currentRpm) * this.throttle * this.clutch
    }

    getAngularVelocity() {
        return rpmToAngularVelocity(this.currentRpm)
    }

    matchRpm(targetVelocity) {
        const currentVelocity = rpmToAngularVelocity(this.currentRpm)
        const matchedVelocity = currentVelocity * (1 - this.clutch) + targetVelocity * this.clutch

        this.currentRpm = clamp(angularVelocityToRpm(matchedVelocity), this.minRpm, this.maxRpm)
    }

    update(dt) {

    }
}

export class Transmission {
    gearRatios
    currentGear
    currentTorque

    constructor() {
        this.gearRatios = [0, 3.6, 2.1, 1.4, 1.0, 0.8, 0.6]
        this.currentGear = 1
    }

    getOutputTorque(engineTorque) {
        this.currentTorque = engineTorque * this.gearRatios[this.currentGear]
        return this.currentTorque
    }

    shiftGear(gear) {
        if (gear > 0 && gear < this.gearRatios.length) {
            this.currentGear = gear
        }
    }

    getAngularVelocity(differentialVelocity) {
        return differentialVelocity / this.gearRatios[this.currentGear]
    }
}

export class Differential {
    getOutputTorque(inTorque) {
        return [inTorque/2, inTorque/2]
    }

    getAngularVelocity(lWheelVelocity, rWheelVelocity) {
        return (lWheelVelocity + rWheelVelocity) / 2
    }
}

export class Wheel {
    radius
    mass

    angularVelocity
    inTorque

    constructor(radius, mass) {
        this.radius = radius
        this.angularVelocity = 0
        this.mass = mass
    }

    setTorque(inTorque) {
        this.inTorque = inTorque
    }

    update(dt) {
        this.#applyTorque(dt)
    }

    #applyTorque(dt) {
        const I = wheelMomentOfInertia(this.radius, this.mass)
        const angularAcceleration = this.inTorque / I
        this.angularVelocity += angularAcceleration * dt
    }

    getLinearVelocity() {
        return this.angularVelocity * this.radius
    }
}

const LEFT = 0
const RIGHT = 0

export class Vehicle {
    engine
    transmission
    differential
    driveWheels
    passiveWheels

    constructor() {
        this.engine = new Engine(340, 1000, 4500)
        this.transmission = new Transmission()
        this.differential = new Differential()
        this.driveWheels = [new Wheel(0.23, 25), new Wheel(0.23, 25)]
        this.passiveWheels = [new Wheel(0.23, 25), new Wheel(0.23, 25)]
    }

    update(dt) {
        // get new torque from engine
        const producedTorque = this.engine.getProducedTorque()

        // match rpm: from wheels to engine
        const diffVelocity = this.differential.getAngularVelocity(this.getLeftDriveWheel().angularVelocity, this.getRightDriveWheel().angularVelocity)
        const transmissionVelocity = this.transmission.getAngularVelocity(diffVelocity)
        this.engine.matchRpm(transmissionVelocity)

        // apply new torque: from engine to wheels
        const transmissionTorque = this.transmission.getOutputTorque(producedTorque)
        const [lWheelVelocity, rWheelVelocity] = this.differential.getOutputTorque(transmissionTorque)
        this.getLeftDriveWheel().setTorque(lWheelVelocity)
        this.getRightDriveWheel().setTorque(rWheelVelocity)
        this.getLeftDriveWheel().update(dt)
        this.getRightDriveWheel().update(dt)
    }

    getLeftDriveWheel() {
        return this.driveWheels[LEFT]
    }

    getRightDriveWheel() {
        return this.driveWheels[RIGHT]
    }

    getKmh() {
        const ms = (this.getLeftDriveWheel().getLinearVelocity() + this.getRightDriveWheel().getLinearVelocity()) / 2
        return msTokmh(ms)
    }
}