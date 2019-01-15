/*jshint esversion: 6 */

colors = ['#8dd3c7', '#ffcc00', '#bebada', '#fb8072', '#80b1d3', '#fdb462',
			'#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];

var tendon_displacement_mm = 0.000001;
var tube_advancement_mm = 0;
var tube_rotation_degrees = 0;

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	ortho();
	gui = createGui('Kinematics Control');
	sliderRange(0.000001, 1, 0.001);
	gui.addGlobals('tendon_displacement_mm');
	sliderRange(0, 25, 0, 0.1);
	gui.addGlobals('tube_advancement_mm');
	sliderRange(0, 360, 1);
	gui.addGlobals('tube_rotation_degrees');
}

function draw() {
	background('white');

	translate(0, (windowHeight / 2) * 0.95);
	let scaleFactor = windowHeight / 40;
	scale(scaleFactor);
	let radians = tube_rotation_degrees * PI / 180.0;
	let points = kinematicsPoints(tendon_displacement_mm, radians, tube_advancement_mm);
	let rots = rotations(tendon_displacement_mm, radians, tube_advancement_mm);

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