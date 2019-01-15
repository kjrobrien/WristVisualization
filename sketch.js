/*jshint esversion: 6 */

colors = ['#8dd3c7', '#ffcc00', '#bebada', '#fb8072', '#80b1d3', '#fdb462',
			'#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];

var displacement_mm = 0.000001;
var displacement_mmMin = 0.000001;
var displacement_mmMax = 1;
var displacement_mmStep = 0.001;

var advancement_mm = 0;
var advancement_mmMin = 0;
var advancement_mmMax = 25;
var advancement_mmStep = 0.1;

var rotation_deg = 0;
var rotation_degMin = 0;
var rotation_degMax = 360;
var rotation_degStep = 1;

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	ortho();
	gui = createGui('Kinematics Control');
	gui.addGlobals('displacement_mm', 'advancement_mm', 'rotation_deg');
}

function draw() {
	background('white');

	translate(0, (windowHeight / 2) * 0.95);
	let scaleFactor = windowHeight / 40;
	scale(scaleFactor);
	let radians = rotation_deg * PI / 180.0;
	let points = kinematicsPoints(displacement_mm, radians, advancement_mm);
	let rots = rotations(displacement_mm, radians, advancement_mm);

	for (let i = 1; i < points.length; i++) {
		let start = points[i - 1];
		let end = points[i];
		let rotation = rots[i - 1];
		rotateX(rotation[0]);
		rotateY(rotation[2]);
		rotateZ(rotation[1]);
		stroke(colors[i-1]);
		// p5.js uses the center of the cylinder as its origin, therefore
		// we translate half the length before and after creating the cylinder
		translate(0, -distance(start, end) / 2);
		cylinder(OD / 2, distance(start, end), 24, 16, false, false);
		translate(0, -distance(start, end) / 2);
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
}