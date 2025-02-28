const scene = new THREE.Scene()

const CameraPreset = {
    LEFT_SIDE: 'LEFT_SIDE',
    RIGHT_SIDE: 'RIGHT_SIDE',
    TOP_BACK: 'TOP_BACK',
    LEFT_DIAGONAL: 'LEFT_DIAGONAL',
    RIGHT_DIAGONAL: 'RIGHT_DIAGONAL',
}

function getCameraPresetPosition(preset) {
    const SIDE_LIFT = 1
    const SIDE_DIST = 6

    switch (preset) {
        case CameraPreset.LEFT_SIDE:
            return new THREE.Vector3(-SIDE_DIST, SIDE_LIFT, 0)
        case CameraPreset.RIGHT_SIDE:
            return new THREE.Vector3(SIDE_DIST, SIDE_LIFT, 0)
        case CameraPreset.TOP_BACK:
            return new THREE.Vector3(0, 5, 4)
        case CameraPreset.LEFT_DIAGONAL:
            return new THREE.Vector3(-SIDE_DIST/1.5, 4.5, 2)
        case CameraPreset.RIGHT_DIAGONAL:
            return new THREE.Vector3(SIDE_DIST/1.5, 4.5, 2)
    }
}

function getCameraPreset(preset) {
    const LOOK_AT = new THREE.Vector3(0, 0, 0)
    const UP = new THREE.Vector3(0, 1, 0)

    const position = getCameraPresetPosition(preset)

    const matrix = new THREE.Matrix4()
    matrix.setPosition(position)
    matrix.lookAt(position, LOOK_AT, UP)

    return matrix
}

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const startCameraPreset = getCameraPreset(CameraPreset.TOP_BACK)
camera.matrix.copy(startCameraPreset)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth - 50, window.innerHeight - 50)
document.body.appendChild(renderer.domElement)

const wheels = []
const axises = []

function addWheel(position) { // -> Wheel
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 30) // (radiusTop, radiusBottom, height, radialSegments)
    const material = new THREE.MeshBasicMaterial({ color: 0x3498db, wireframe: true })
    const wheel = new THREE.Mesh(geometry, material)
    
    wheel.rotateZ(Math.PI/2)
    wheel.position.set(position.x, position.y, position.z)

    wheels.push(wheel)
    scene.add(wheel)

    return wheel
}

function addAxis(wheelL, wheelR, thickness = 0.05) { // -> Axis
    // Calculate distance between wheels for cylinder length
    const length = wheelR.position.x - wheelL.position.x
    
    const geometry = new THREE.CylinderGeometry(thickness, thickness, length, 20)
    const material = new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true })
    const axis = new THREE.Mesh(geometry, material)
    
    // Position axis at midpoint between wheels
    const midX = (wheelL.position.x + wheelR.position.x) / 2
    const midY = (wheelL.position.y + wheelR.position.y) / 2
    const midZ = (wheelL.position.z + wheelR.position.z) / 2
    
    axis.position.set(midX, midY, midZ)
    axis.rotateZ(Math.PI/2)
    
    axises.push(axis)
    scene.add(axis)
    
    return axis
}

function addBase(axisFront, axisBack, width = 1.5, thickness = 0.1) {
    // Calculate dimensions based on axis positions
    const length = axisBack.position.z - axisFront.position.z

    // Create box geometry for the base
    const geometry = new THREE.BoxGeometry(width, thickness, length)
    const material = new THREE.MeshBasicMaterial({ color: 0x95a5a6, wireframe: true })
    const base = new THREE.Mesh(geometry, material)

    // Position base at midpoint between axises
    const midX = (axisFront.position.x + axisBack.position.x) / 2
    const midY = axisFront.position.y // Removed thickness/2 to align with axes
    const midZ = (axisFront.position.z + axisBack.position.z) / 2
    
    base.position.set(midX, midY, midZ)
    
    scene.add(base)
    return base
}

function addCar() {
    const wheelFrontL = addWheel(new THREE.Vector3(-1, 0, -1))
    const wheelFrontR = addWheel(new THREE.Vector3(1, 0, -1))
    const wheelBackL = addWheel(new THREE.Vector3(-1, 0, 1))
    const wheelBackR = addWheel(new THREE.Vector3(1, 0, 1))
    const axisFront = addAxis(wheelFrontL, wheelFrontR)
    const axisBack = addAxis(wheelBackL, wheelBackR)
    const base = addBase(axisFront, axisBack)
    
    return {
        wheels: [wheelFrontL, wheelFrontR, wheelBackL, wheelBackR],
        axes: [axisFront, axisBack],
        base
    }
}

function addTerrain() {
    const geometry = new THREE.PlaneGeometry(20, 100)
    const material = new THREE.MeshPhongMaterial({ 
        color: 0x0000ff,
        side: THREE.DoubleSide,
        shininess: 1,
    })
    const plane = new THREE.Mesh(geometry, material)
    plane.rotateX(Math.PI/2)
    plane.position.y = -0.5
    scene.add(plane)
    return plane
}

const terrain = addTerrain()
const car = addCar()

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
scene.add(ambientLight)

let time = 0
const INTERPOLATION_TIMES = {
    'RIGHT_SIDE_TO_RIGHT_DIAGONAL': 3,
    'RIGHT_DIAGONAL_TO_TOP_BACK': 4.5,
    'TOP_BACK_TO_LEFT_DIAGONAL': 4.5,
    'LEFT_DIAGONAL_TO_LEFT_SIDE': 3,
    'LEFT_SIDE_TO_LEFT_DIAGONAL': 3,
    'LEFT_DIAGONAL_TO_TOP_BACK': 4.5,
    'TOP_BACK_TO_RIGHT_DIAGONAL': 4.5,
    'RIGHT_DIAGONAL_TO_RIGHT_SIDE': 3
}
const INTERPOLATION_TIME_FACTOR = 1.7

function getInterpolationTime(from, to) {
    const key = `${from}_TO_${to}`
    return (INTERPOLATION_TIMES[key] || 3) * INTERPOLATION_TIME_FACTOR
}

const positions = [
    CameraPreset.RIGHT_SIDE,
    CameraPreset.RIGHT_DIAGONAL,
    CameraPreset.TOP_BACK,
    CameraPreset.LEFT_DIAGONAL,
    CameraPreset.LEFT_SIDE,
]
let currentIndex = 0
let interpolationTime = 0
let forward = true

function animate() {
    requestAnimationFrame(animate)
    
    time += 1/60 // Assuming 60fps
    if (time >= interpolationTime) {
        time = 0
        // Update indices for next interpolation
        if (forward) {
            currentIndex++
            if (currentIndex >= positions.length - 1) forward = false
        } else {
            currentIndex--
            if (currentIndex <= 0) forward = true
        }
    }

    const startPreset = positions[currentIndex]
    const endPreset = positions[forward ? currentIndex + 1 : currentIndex - 1]

    interpolationTime = getInterpolationTime(startPreset, endPreset)
    const progress = time / interpolationTime
    
    const pos1 = getCameraPreset(startPreset)
    const pos2 = getCameraPreset(endPreset)
    
    // Extract position and quaternion from matrices
    const startPos = new THREE.Vector3()
    const startQuat = new THREE.Quaternion()
    const startScale = new THREE.Vector3()
    pos1.decompose(startPos, startQuat, startScale)
    
    const endPos = new THREE.Vector3()
    const endQuat = new THREE.Quaternion()
    const endScale = new THREE.Vector3()
    pos2.decompose(endPos, endQuat, endScale)
    
    // Interpolate position and rotation
    const currentPos = new THREE.Vector3()
    currentPos.lerpVectors(startPos, endPos, progress)
    
    const currentQuat = new THREE.Quaternion()
    currentQuat.slerpQuaternions(startQuat, endQuat, progress)
    
    // Apply interpolated transform to camera
    camera.position.copy(currentPos)
    camera.quaternion.copy(currentQuat)
    
    // Rotate wheels and axes
    for (wheel of wheels) {
        wheel.rotateY(0.01)
    }
    for (axis of axises) {
        axis.rotateY(0.01)
    }
    
    renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth - 50, window.innerHeight - 50)
})

animate()
