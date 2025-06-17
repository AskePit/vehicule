import { rpmToAngularVelocity, angularVelocityToRpm, msTokmh, clamp } from './physics.js'

export class Engine {
    maxTorque
    minRpm
    maxRpm

    currentRpm
    throttle // [0.0; 1.0] from no gas to floor pedal
    clutch   // [0.0; 1.0] from disengaged to fully engaged

    inertia = 0.15 // kg·m²

    constructor(maxTorque, minRpm, maxRpm) {
        this.maxTorque = maxTorque
        this.minRpm = minRpm
        this.maxRpm = maxRpm

        this.currentRpm = minRpm
        this.throttle = 0
    }

    #getTorqueFactor() {
        // asymmetric bell shape curve

        const range = this.maxRpm - this.minRpm
        const peakRpm = this.minRpm + range * 0.43
        let spread = this.minRpm + range * 0.57

        if (this.currentRpm < peakRpm) {
            spread = spread * 2.0 / 3.0
        }

        const factor = 1.0 - Math.pow((this.currentRpm - peakRpm) / spread, 2)
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
}

export class Transmission {
    gearRatios
    currentGear
    currentTorque
    transmissionEfficiency

    constructor() {
        this.gearRatios = [0, 3.6, 2.1, 1.4, 1.0, 0.8, 0.6]
        this.currentGear = 1
        this.transmissionEfficiency = 0.9 // 90% efficiency = 10% loss
    }

    getCurrentGear() {
        return this.currentGear
    }

    getCurrentRatio() {
        return this.gearRatios[this.currentGear]
    }

    getOutputTorque(engineTorque) {
        this.currentTorque = engineTorque * this.gearRatios[this.currentGear] * this.transmissionEfficiency
        return this.currentTorque
    }

    shiftGear(gear) {
        if (gear > 0 && gear < this.gearRatios.length) {
            this.currentGear = gear
        }
    }

    getAngularVelocity(differentialVelocity) {
        return differentialVelocity * this.gearRatios[this.currentGear]
    }
}

export class Differential {
    finalDriveRatio
    diffEfficiency

    constructor() {
        this.finalDriveRatio = 4.0
        this.diffEfficiency = 0.97 // 97% efficiency = 3% loss
    }

    getOutputTorque(inTorque) {
        const diffTorque = inTorque * this.diffEfficiency * this.finalDriveRatio / 2  // Split torque between left and right wheels
        return [diffTorque, diffTorque]
    }

    getAngularVelocity(lWheelVelocity, rWheelVelocity) {
        return (lWheelVelocity + rWheelVelocity) / 2 * this.finalDriveRatio
    }
}

export class Wheel {
    radius
    carryMass
    airDragCoeff
    rollingResistanceCoeff

    angularVelocity
    maxAngularVelocity
    inTorque

    constructor(radius, carryMass, airDragCoeff = 0.3, rollingResistanceCoeff = 30) {
        this.radius = radius
        this.angularVelocity = 0
        this.carryMass = carryMass
        this.airDragCoeff = airDragCoeff
        this.rollingResistanceCoeff = rollingResistanceCoeff
    }

    setTorque(inTorque) {
        this.inTorque = inTorque
        // if (this.angularVelocity > this.maxAngularVelocity) {
        //     this.inTorque = Math.min(0, this.inTorque)
        // }
    }

    setMaxAngularVelocity(maxVelocity) {
        this.maxAngularVelocity = maxVelocity
    }

    update(dt) {
        this.#applyTorque(dt)
    }

    #applyTorque(dt) {
        const staticFrictionThreshold = 5  // Nm

        if (Math.abs(this.angularVelocity) < 0.01 && Math.abs(this.inTorque) < staticFrictionThreshold) {
            // Not enough torque to overcome static friction, wheel stays still
            return
        }

        const v = this.getLinearVelocity()
        const sign = Math.sign(v)

        // Drag and rolling resistance approximated as torque
        const dragTorque = -this.airDragCoeff * v ** 2 * this.radius * sign
        const rollingTorque = -this.rollingResistanceCoeff * v * this.radius * sign

        const resistanceTorque = dragTorque + rollingTorque
        const netTorque = this.inTorque + resistanceTorque
        const driveForce = netTorque / this.radius
        let acceleration = driveForce / this.carryMass

        // console.log(`inTorque: ${this.inTorque}\ndragTorque: ${dragTorque}\nrollingTorque: ${rollingTorque}\nnetTorque: ${netTorque}\ndriveForce: ${driveForce}\nacceleration: ${acceleration}`)

        const angularAcceleration = acceleration / this.radius
        this.angularVelocity += angularAcceleration * dt
    }

    getLinearVelocity() {
        return this.angularVelocity * this.radius
    }
}

const LEFT = 0
const RIGHT = 0

export class Vehicle {
    mass
    engine
    transmission
    differential
    driveWheels
    passiveWheels

    constructor() {
        this.mass = 1200  // kg

        this.engine = new Engine(340, 1000, 4500) // maxTorque, minRpm, maxRpm
        this.transmission = new Transmission()
        this.differential = new Differential()
        this.driveWheels = [new Wheel(0.23, this.mass / 2), new Wheel(0.23, this.mass / 2)]
        this.passiveWheels = [new Wheel(0.23, 0), new Wheel(0.23, 0)]
    }

    update(dt) {
        const producedTorque = this.engine.getProducedTorque()
        const transmissionTorque = this.transmission.getOutputTorque(producedTorque)

        const [leftTorque, rightTorque] = this.differential.getOutputTorque(transmissionTorque)
        const totalRatio = this.getTotalRatio()
        const maxWheelAngularVelocity = rpmToAngularVelocity(this.engine.maxRpm / totalRatio) 

        const leftWheel = this.getLeftDriveWheel()
        const rightWheel = this.getRightDriveWheel()
        leftWheel.setMaxAngularVelocity(maxWheelAngularVelocity)
        rightWheel.setMaxAngularVelocity(maxWheelAngularVelocity)
        leftWheel.setTorque(leftTorque)
        rightWheel.setTorque(rightTorque)

        leftWheel.update(dt)
        rightWheel.update(dt)

        const avgWheelAngularVelocity = (leftWheel.angularVelocity + rightWheel.angularVelocity) / 2

        const diffAngularVelocity = avgWheelAngularVelocity
        const transmissionAngularVelocity = this.transmission.getAngularVelocity(diffAngularVelocity)
        this.engine.matchRpm(transmissionAngularVelocity)
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

    getTotalRatio() {
        return this.transmission.getCurrentRatio() * this.differential.finalDriveRatio
    }
}
