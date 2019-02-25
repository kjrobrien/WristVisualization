/*jshint esversion: 6 */

colors = ['#8dd3c7', '#ffcc00', '#bebada', '#fb8072', '#80b1d3', '#fdb462',
			'#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];

// Initial values
var motion = {
	displacement : 0.000001,
	advancement : 0,
	rotation: 0
};

var settings;
let notch;

function preload() {
	notch = loadModel('SingleNotch.obj');
}

function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	ortho();
	settingsInit();
	startConnection();
}

function settingsInit() {
	settings = QuickSettings.create(0, 0, "Wrist Control");
	settings.setKey("h");
	settings.addHTML("SCREAM Visualization",
		`2018-19 <a href="https://wpi.edu">WPI</a> MQP.<br />
		Distances are in millimeters.<br/>Angles are in degrees.`);
	settings.addDropDown('sensor', ['displacement', 'advancement', 'rotation']);
	settings.hideControl('sensor');
	settings.bindRange('displacement', 0.000001, 1, 0.000001, 0.001, motion);
	settings.bindRange('advancement', 0, 25, 0, 0.1, motion);
	settings.bindRange('rotation', 0, 360, 0, 1, motion);
}

function draw() {
	background('white');

	translate(0, (windowHeight / 2) * 0.95);
	let scaleFactor = windowHeight / 40;
	scale(scaleFactor);
	let radians = motion.rotation * PI / 180.0;
	let points = kinematicsPoints(motion.displacement, radians, motion.advancement);
	let rots = rotations(motion.displacement, radians, motion.advancement);
	for (let i = 1; i < points.length; i++) {
		let start = points[i - 1];
		let end = points[i];
		let rotation = rots[i - 1];
		rotateX(rotation[0]);
		rotateY(rotation[2]);
		rotateZ(rotation[1]);
		stroke(colors[i-1]);
		// p5.js uses the center of the object as its origin, therefore
		// we translate half the length before and after
		translate(0, -distance(start, end) / 2);
		if (i > 2) {
			// it is a notch
			model(notch);
		} else {
			// it is the base length or advancement
			cylinder(OD / 2, distance(start, end), 24, 16, false, false);
		}
		translate(0, -distance(start, end) / 2);
	}
}

function windowResized() {
	resizeCanvas(windowWidth, windowHeight);
	ortho();
}