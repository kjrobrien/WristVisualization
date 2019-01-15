/**
 * wrist.js
 * 
 * wrist.js implements the kinematics of a notched-wrist manipulator.
 * 
 */
/*jshint esversion: 6 */


const ID = 1.6;          //   [mm] tube inner diameter
const OD = 1.8;          //   [mm] tube outer diameter
const baseLength = 4;    //   [mm] length of the robot before notches
const nCutouts = 4;      //   total number of cutouts
const uncutLength = 1;   //   [mm] spacing between cuts
const cutoutHeight = 1;  //   [mm] height of the cutout (length of the cut)
const cutoutWidth = 1.6; //   [mm] width of the cutout (depth of the cut)

function forwardKinematics(tDispl, tubeRot, tubeAdv) {        
    let result = math.identity(4);

    // Perform the rotation
    result = math.multiply(result, zRotation(tubeRot));

    // Perform the advancement
    result = math.multiply(result, zTranslation(tubeAdv));

    // Account for base length of the tube
    result = math.multiply(result, zTranslation(baseLength));

    let notch = notchKinematics(tDispl);

    // Add each notch
    for (let i = 0; i < nCutouts; i++) {
    result = math.multiply(result, notch);
    }

    return result;
};

function kinematicsPoints(tDispl, tubeRot, tubeAdv) {
    let result = [];
    result[0] = [0,0,0];
    let currentMatrix = zRotation(tubeRot);
    currentMatrix = math.multiply(currentMatrix, zTranslation(tubeAdv));
    result[1] = coordinates(currentMatrix);
    currentMatrix = math.multiply(currentMatrix, zTranslation(baseLength));
    result[2] = coordinates(currentMatrix);

    let notch = notchKinematics(tDispl);
    for (let i = 3; i < nCutouts + 3; i++) {
        currentMatrix = math.multiply(currentMatrix, notch);
        result[i] = coordinates(currentMatrix);
    }
    return result;
}

// Returns angles to rotate in [x, y, z] for given notch kinematics
function rotations(tDispl, tubeRot, tubeAdv) {
    let result = [];
    result[0] = [0, 0, tubeRot];
    result[1] = [0, 0, 0];
    let notchAngle = math.acos(notchKinematics(tDispl).subset(math.index(0, 0)));
    for (let i = 2; i < nCutouts + 2; i++) {
        result[i] = [0, notchAngle, 0];
    }
    return result;
}

// Returns the transformation matrix for rotation about the z-axis.
// angle = angle in radians of rotation
function zRotation(angle) {
    return math.matrix([[math.cos(angle),     -math.sin(angle),   0, 0],
                        [math.sin(angle),     math.cos(angle),    0, 0],
                        [0,                   0,                  1, 0],
                        [0,                   0,                  0, 1]]);
}

// Returns the transformation matrix for z translation.
// length = length in mm to advance in Z-direction
// Returns:
// 1     0     0     0
// 0     1     0     0
// 0     0     1     length
// 0     0     0     1
function zTranslation(length) {
    let result = math.identity(4);
    return math.subset(result, math.index(2, 3), length);
}

// Returns the transformation matrix for a single notch (both cut and uncut sections)
// tDispl = the distance in mm of tendon displacement
function notchKinematics(tDispl) {
    let RI = ID / 2;
    let RO = OD / 2;

    let phiO = 2 * math.acos((cutoutWidth - RO) / RO);
    let phiI = 2 * math.acos((cutoutWidth - RO) / RI);

    let aO = math.pow(RO, 2) * (phiO - math.sin(phiO)) / 2;
    let aI = math.pow(RI, 2) * (phiI - math.sin(phiI)) / 2;

    let yBarO = 4 * RO * math.pow((math.sin(0.5 * phiO)), 3) / (3 * (phiO - math.sin(phiO)));
    let yBarI = 4 * RI * math.pow((math.sin(0.5 * phiI)), 3) / (3 * (phiI - math.sin(phiI)));

    let yBar = (yBarO * aO - yBarI * aI) / (aO - aI);

    let kappa = tDispl / (cutoutHeight * (RI + yBar) - tDispl * yBar);

    let s = cutoutHeight / (1 + yBar * kappa);

    // cut portion of notch
    let tCut = math.matrix([[math.cos(kappa * s),   0, math.sin(kappa * s), (1 - math.cos(kappa * s)) / kappa],
                            [0,                     1, 0,                   0],
                            [-math.sin(kappa * s),  0, math.cos(kappa * s), math.sin(kappa * s) / kappa],
                            [0,                     0, 0,                   1]]);
    
    // uncut portion of notch
    let tUncut = zTranslation(uncutLength);

    return math.multiply(tCut, tUncut);
}


// Returns the x, y, z components of the given transformation matrix.
// matrix = 4x4 transformation matrix.
// Returns array [x, y, z]
function coordinates(matrix) {
    return math.transpose(matrix.subset(math.index([0, 1, 2], 3))).valueOf()[0];
}

// Returns the distance between two points.
// pointOne = point [x, y, z]
// pointTwo = point [x, y, z]
// Returns distance as number 
function distance(pointOne, pointTwo) {
    return math.sqrt(math.pow(pointOne[0] - pointTwo[0], 2) +
    math.pow(pointOne[1] - pointTwo[1], 2) +
    math.pow(pointOne[2] - pointTwo[2], 2));
}
