// read arguments:
const speed = arguments.speed || 0.01;
const distance = arguments.distance || 0.35;
const degreesZ = arguments.degreesZ || 2;
const degreesX = arguments.degreesX || 4;
const phaseZ = arguments.phaseZ || 0.94;
const phaseX = arguments.phaseX || 0.97;
console.log(`float behavior init(${speed}, ${distance})`);

const initialY = this.position.y;
const initialRotation = this.rotation;
let tick = 0;

this.on('update', () => {
    this.position.y = initialY + Math.sin(tick * speed) * distance;
    this.rotation.z = initialRotation.z + Math.sin(tick * phaseZ * speed) * degreesZ;
    this.rotation.x = initialRotation.x + Math.sin(tick * phaseX * speed) * degreesX;
    ++tick;
});
