import { Engine, Clutch, Transmission, Wheel } from './vehicle.js'

const engine = new Engine(340, 4500) // Nm, RPM max
const clutch = new Clutch()
const transmission = new Transmission()
const wheel = new Wheel(0.23, 25) // m radius, kg mass

let throttle = 0.2
let running = true

transmission.shiftGear(1)

function update(dt) {
    engine.throttle = throttle
    engine.update(dt)
    let engineTorque = engine.getTorque()
    let clutchTorque = clutch.transferTorque(engineTorque)
    let wheelTorque = transmission.getOutputTorque(clutchTorque)
    wheel.applyTorque(wheelTorque, dt)

    console.log(`Speed: ${(wheel.getLinearVelocity() * 3.6).toFixed(2)} km/h, RPM: ${engine.currentRPM}`)

    if (wheel.getLinearVelocity() < 2) {
        clutch.setEngagement(0.2) // Slip clutch at low speed
    } else {
        clutch.setEngagement(1.0) // Fully engaged at higher speed
    }
}

function mainLoop() {
    const dt = 0.1

    if (running) {
        update(dt)
        setTimeout(mainLoop, dt * 1000)
    }
}

mainLoop()

// Stop the loop after 10 seconds
setTimeout(() => {
    running = false
    console.log("Simulation stopped")
}, 100000)
