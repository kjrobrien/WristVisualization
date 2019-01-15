/*jshint esversion: 6 */

colors = ['#8dd3c7', '#ffcc00', '#bebada', '#fb8072', '#80b1d3', '#fdb462',
			'#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];

var tendonDisplmm = 0.000001;
var tendonDisplmmMin = 0.000001;
var tendonDisplmmMax = 1;
var tendonDisplmmStep = 0.001;

var tubeAdvmm = 0;
var tubeAdvmmMin = 0;
var tubeAdvmmMax = 25;
var tubeAdvmmStep = 0.1;

var tubeRotDeg = 0;
var tubeRotDegMin = 0;
var tubeRotDegMax = 360;
var tubeRotDegStep = 1;

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	ortho();
	gui = createGui('Kinematics Control');
	gui.addGlobals('tendonDisplmm', 'tubeAdvmm', 'tubeRotDeg');
}

function draw() {
	background('white');

	translate(0, (windowHeight / 2) * 0.95);
	let scaleFactor = windowHeight / 40;
	scale(scaleFactor);
	let radians = tubeRotDeg * PI / 180.0;
	let points = kinematicsPoints(tendonDisplmm, radians, tubeAdvmm);
	let rots = rotations(tendonDisplmm, radians, tubeAdvmm);

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