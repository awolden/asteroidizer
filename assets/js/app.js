let song;
let amplitude;
let fft;
const asteroids = [];
let bgColor;
let canvasHeight;
let canvasWidth;
let ship;
let hslBase = 0;

const HSL_INCREMENT = 2;
const ASTEROID_SCALE = .5;
const ASTEROID_ROTATION_RATE = .05;
const MAX_ACCELERATION = .01;
const SHIP = [
  [.5, 0],
  [1, 1],
  [.5, .7],
  [0, 1],
  [.5, 0]
]
// :: Beat Detect Variables
// how many draw loop frames before the beatCutoff starts to decay
// so that another beat can be triggered.
// frameRate() is usually around 60 frames per second,
// so 20 fps = 3 beats per second, meaning if the song is over 180 BPM,
// we wont respond to every beat.
var beatHoldFrames = 10;

// what amplitude level can trigger a beat?
var beatThreshold = 0.20;

// When we have a beat, beatCutoff will be reset to 1.1*beatThreshold, and then decay
// Level must be greater than beatThreshold and beatCutoff before the next beat can trigger.
var beatCutoff = 0;
var beatDecayRate = 0.98; // how fast does beat cutoff decay?
var framesSinceLastBeat = 0; // once this equals beatHoldFrames, beatCutoff starts to decay.


var smoothing = .7;
var binCount = 128;

var asteroidDrawLimit = 4;
var asteroidDrawCurrent = 0;

function preload() {
    song = loadSound('music/friction.mp3');
}

function setup() {

    bgColor = color(random(0, 255), random(0, 255), random(0, 255), 100);

    amplitude = new p5.Amplitude();
    amplitude.setInput(song);

    fft = new p5.FFT(smoothing, binCount);
    fft.setInput(song);

    asteroids.push(new Asteroid());
    ship = new Ship();

    song.play();
    canvasHeight = windowHeight;
    canvasWidth = windowWidth;
    noStroke();
    c = createCanvas(windowWidth, windowHeight);

}


function draw() {
    noStroke();
    fill(bgColor)
    rect(0, 0, canvasWidth, canvasHeight)
    level = amplitude.getLevel();
    detectBeat(level);

    asteroids.forEach((asteroid) =>{
      asteroid.update(fft.analyze(binCount));
      asteroid.draw();
    });


    ship.update();
    ship.draw();
}

function onBeat() {
    //bgColor = color(random(0, 255), random(0, 255), random(0, 255));
    bgColor = color(`hsl(${(hslBase > 360 ? 0 : hslBase += HSL_INCREMENT)}, 95%, 60%)`)
    if(asteroids.length < 5)
      asteroids.push(new Asteroid());
}

function detectBeat(level) {
    if (level > beatCutoff && level > beatThreshold) {
        onBeat();
        beatCutoff = level * 1.2;
        framesSinceLastBeat = 0;
    } else {
        if (framesSinceLastBeat <= beatHoldFrames) {
            framesSinceLastBeat++;
        } else {
            beatCutoff *= beatDecayRate;
            beatCutoff = Math.max(beatCutoff, beatThreshold);
        }
    }
}

class Asteroid {

    constructor() {
        this.location = createVector(Math.random() * windowWidth, Math.random() * windowHeight);
        this.vectors = [];
        this.spectrum = [];
        this.rotationRate = ASTEROID_ROTATION_RATE
        this.rotation = 0;
        this.clockwise = Boolean(Math.random() > .5);
        this.velocity = p5.Vector.random2D();
        this.acceleration = Math.random * MAX_ACCELERATION;
    }

    update(spectrum) {

        // handle drift
        this.velocity.add(this.acceleration);
        this.location.add(this.velocity);

        if(this.location.y > canvasHeight){
          this.location.set(canvasWidth - this.location.x, 0, 0)
        }
        if(this.location.y < 0){
          this.location.set(canvasWidth - this.location.x, canvasHeight, 0)
        }
        if(this.location.x > canvasWidth){
          this.location.set(0, canvasHeight - this.location.y, 0)
        }
        if(this.location.x < 0){
          this.location.set(canvasWidth, canvasHeight - this.location.y, 0)
        }

        // such lazy
        spectrum.shift();
        spectrum.shift();
        spectrum.shift();

        //handle rotation
        this.rotation += this.rotationRate;
        if(this.rotation > TWO_PI) this.rotation = this.rotation - TWO_PI;

        spectrum = spectrum
            .filter(val => val);
        this.spectrum = spectrum
            .map((val, i) => {
                if (!val) return null;
                const angle = map(i, 0, spectrum.length, 0, TWO_PI);
                const vectorAngle = p5.Vector.fromAngle(angle);
                const vectorAngle2 = p5.Vector.fromAngle(angle);

                vectorAngle.mult(val + 51);
                vectorAngle.mult(ASTEROID_SCALE);

                return vectorAngle;
            });
    }

    draw(){
      push();
      translate(this.location.x, this.location.y);
      rotate((this.clockwise) ? this.rotation : -this.rotation);
      this.spectrum.forEach((vector, i) => {
          stroke(0, 0, 0, 100);
          strokeWeight(15 * ASTEROID_SCALE);
          line(0, 0, vector.x, vector.y);
      });
      pop();
    }
}


class Ship{

  constructor(){
    this.location = createVector(windowWidth / 2, windowHeight / 2);
    this.angle = 0;
    this.size = 20;
  }

  update(){
    this.angle = this.getAngle(mouseX, mouseY, this.location.x, this.location.y) - PI / 2;
    this.location.sub(p5.Vector.fromAngle(this.angle))
    console.log(this.angle - PI /2 )
  }

  draw(){
    push();
    translate(this.location.x, this.location.y);
    rotate(this.angle);
    SHIP.forEach((vector, i) => {
        stroke(0, 0, 0);
        strokeWeight(1);
        let nextPoint;
        if(i+2 > SHIP.length){
          nextPoint = SHIP[0];
        }else{
          nextPoint = SHIP[i+1];
        }
        line(vector[0] * this.size - this.size/2, vector[1] * this.size - this.size/2, nextPoint[0] * this.size - this.size/2, nextPoint[1] * this.size - this.size/2);
    });

    pop();
  }

  getAngle (x1, y1, x2, y2) {
    const dy = y2-y1;
    const dx = x2-x1;
    return Math.atan2(dy, dx);
  }

}

class Bullet {


}
