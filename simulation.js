import { Vehicle } from './vehicle.js'

let running = true

export const vehicle = new Vehicle()
vehicle.transmission.shiftGear(1)
vehicle.engine.throttle = 0.0
vehicle.engine.clutch = 1.0

function update(dt) {
    vehicle.update(dt)
    //console.log(`Speed: ${(vehicle.driveWheels[0].getLinearVelocity() * 3.6).toFixed(2)} km/h, RPM: ${vehicle.engine.currentRpm}`)
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
// setTimeout(() => {
//     running = false
//     console.log("Simulation stopped")
// }, 100000)
