// Create the scene
const scene = new THREE.Scene();
scene.fog = new THREE.Fog( 0xcccccc, 0, 5 );

// Create a camera (PerspectiveCamera: FOV, Aspect Ratio, Near, Far)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 3;

// Create a renderer and attach it to the document
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth - 50, window.innerHeight - 50);
document.body.appendChild(renderer.domElement);

// Create a cylinder geometry
const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 30); // (radiusTop, radiusBottom, height, radialSegments)

// Flat-shaded material (no lighting)
const material = new THREE.MeshBasicMaterial({ color: 0x3498db, wireframe: true });
const cylinder = new THREE.Mesh(geometry, material);
scene.add(cylinder);

cylinder.rotateZ(Math.PI/2);
cylinder.rotateX(-Math.PI/4);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    cylinder.rotateY(0.01); // Rotate the cylinder
    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - 50, window.innerHeight - 50);
});

animate();
