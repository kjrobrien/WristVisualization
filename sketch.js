colors = ['#8dd3c7', '#ffcc00', '#bebada', '#fb8072', '#80b1d3', '#fdb462',
			'#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f'];


function setup() {
	createCanvas(windowWidth, windowHeight, WEBGL);
	tDisplSlider = createSlider(0.000001, 2, 0.000001, 0.001);
	tDisplSlider.position(20, 20);
	rotSlider = createSlider(0, 2 * PI, 0, 0.001);
	rotSlider.position(20, 50);
	advSlider = createSlider(0, 25, 0, 0.1);
	advSlider.position(20, 80);
}

function draw() {

	background('white');
	let tDispl = tDisplSlider.value();
	let tubeAdv = advSlider.value();
	let tubeRot = rotSlider.value();

	translate(0, (windowHeight/2)*0.95);
	scale(windowHeight / 40);

	let points = kinematicsPoints(tDispl, tubeRot, tubeAdv);

	for (let i = 1; i < points.length; i++) {
		let start = points[i - 1];
		let end = points[i];
		strokeWeight(OD);
  		stroke(colors[i-1]);
		line(start[0], -start[2], start[1], end[0], -end[2], end[1]);
	}
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}