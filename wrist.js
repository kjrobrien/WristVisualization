/**
 * wrist.js
 * 
 * wrist.js implements the kinematics of a notched-wrist manipulator.
 * 
 */
/*jshint esversion: 6 */

transpose = a => a[0].map((x, i) => a.map(y => y[i]));
mmultiply = (a, b) => a.map(x => transpose(b).map(y => dotproduct(x, y)));
dotproduct = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);

const ID = 1.6;          //   [mm] tube inner diameter
const OD = 1.8;          //   [mm] tube outer diameter
const baseLength = 4;    //   [mm] length of the robot before notches
const nCutouts = 4;      //   total number of cutouts
const uncutLength = 1;   //   [mm] spacing between cuts
const cutoutHeight = 1;  //   [mm] height of the cutout (length of the cut)
const cutoutWidth = 1.6; //   [mm] width of the cutout (depth of the cut)

function forwardKinematics(tDispl, tubeRot, tubeAdv) {        
    let result = [[1, 0, 0, 0],
                  [0, 1, 0, 0],
                  [0, 0, 1, 0],
                  [0, 0, 0, 1]];

    // Perform the rotation
    result = mmultiply(result, zRotation(tubeRot));

    // Perform the advancement
    result = mmultiply(result, zTranslation(tubeAdv));

    // Account for base length of the tube
    result = mmultiply(result, zTranslation(baseLength));

    let notch = notchKinematics(tDispl);

    // Add each notch
    for (let i = 0; i < nCutouts; i++) {
    result = mmultiply(result, notch);
    }

    return result;
}

function kinematicsPoints(tDispl, tubeRot, tubeAdv) {
    let result = [];
    result[0] = [0,0,0];
    let currentMatrix = zRotation(tubeRot);
    currentMatrix = mmultiply(currentMatrix, zTranslation(tubeAdv));
    result[1] = coordinates(currentMatrix);
    currentMatrix = mmultiply(currentMatrix, zTranslation(baseLength));
    result[2] = coordinates(currentMatrix);

    let notch = notchKinematics(tDispl);
    for (let i = 3; i < nCutouts + 3; i++) {
        currentMatrix = mmultiply(currentMatrix, notch);
        result[i] = coordinates(currentMatrix);
    }
    return result;
}

// Returns angles to rotate in [x, y, z] for given notch kinematics
function rotations(tDispl, tubeRot, tubeAdv) {
    let result = [];
    result[0] = [0, 0, tubeRot];
    result[1] = [0, 0, 0];
    let notchAngle = Math.acos(notchKinematics(tDispl)[0][0]);
    for (let i = 2; i < nCutouts + 2; i++) {
        result[i] = [0, notchAngle, 0];
    }
    return result;
}

// Returns the transformation matrix for rotation about the z-axis.
// angle = angle in radians of rotation
function zRotation(angle) {
    return [[Math.cos(angle),     -Math.sin(angle),   0, 0],
            [Math.sin(angle),     Math.cos(angle),    0, 0],
            [0,                   0,                  1, 0],
            [0,                   0,                  0, 1]];
}

// Returns the transformation matrix for z translation.
// length = length in mm to advance in Z-direction
// Returns:
// 1     0     0     0
// 0     1     0     0
// 0     0     1     length
// 0     0     0     1
function zTranslation(length) {
    return [[1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, length],
            [0, 0, 0, 1]];
}

// Returns the transformation matrix for a single notch (both cut and uncut sections)
// tDispl = the distance in mm of tendon displacement
function notchKinematics(tDispl) {
    let RI = ID / 2;
    let RO = OD / 2;

    let phiO = 2 * Math.acos((cutoutWidth - RO) / RO);
    let phiI = 2 * Math.acos((cutoutWidth - RO) / RI);

    let aO = Math.pow(RO, 2) * (phiO - Math.sin(phiO)) / 2;
    let aI = Math.pow(RI, 2) * (phiI - Math.sin(phiI)) / 2;

    let yBarO = 4 * RO * Math.pow((Math.sin(0.5 * phiO)), 3) / (3 * (phiO - Math.sin(phiO)));
    let yBarI = 4 * RI * Math.pow((Math.sin(0.5 * phiI)), 3) / (3 * (phiI - Math.sin(phiI)));

    let yBar = (yBarO * aO - yBarI * aI) / (aO - aI);

    let kappa = tDispl / (cutoutHeight * (RI + yBar) - tDispl * yBar);

    let s = cutoutHeight / (1 + yBar * kappa);

    // cut portion of notch
    let tCut = [[Math.cos(kappa * s),   0, Math.sin(kappa * s), (1 - Math.cos(kappa * s)) / kappa],
                [0,                     1, 0,                   0],
                [-Math.sin(kappa * s),  0, Math.cos(kappa * s), Math.sin(kappa * s) / kappa],
                [0,                     0, 0,                   1]];
    
    // uncut portion of notch
    let tUncut = zTranslation(uncutLength);

    return mmultiply(tCut, tUncut);
}


// Returns the x, y, z components of the given transformation matrix.
// matrix = 4x4 transformation matrix.
// Returns array [x, y, z]
function coordinates(matrix) {
    let x = matrix[0][3];
    let y = matrix[1][3];
    let z = matrix[2][3];
    return [x, y, z];
}

// Returns the distance between two points.
// pointOne = point [x, y, z]
// pointTwo = point [x, y, z]
// Returns distance as number 
function distance(pointOne, pointTwo) {
    return Math.sqrt(Math.pow(pointOne[0] - pointTwo[0], 2) +
    Math.pow(pointOne[1] - pointTwo[1], 2) +
    Math.pow(pointOne[2] - pointTwo[2], 2));
}
