document.body.style.margin = 0
const width = document.body.clientWidth
const height = document.body.clientHeight

let particlesCount = 100;
let particles = [];

let bg = [0,0,0]

random = p5.prototype.random

let colors = {
    red: [255, 0, 0],
    green: [0, 255, 0],
    blue: [0, 0, 255],
    yellow: [255, 255, 0]
}

let presets = [{ color: 'red', pref: { red: random(-1, 1), blue: random(-1, 1), yellow: random(-1, 1), green: random(-1, 1) } },
{ color: 'blue', pref: { red: random(-1, 1), blue: random(-1, 1), yellow: random(-1, 1), green: random(-1, 1) } },
{ color: 'yellow', pref: { red: random(-1, 1), blue: random(-1, 1), yellow: random(-1, 1), green: random(-1, 1) } },
{ color: 'green', pref: { red: random(-1, 1), blue: random(-1, 1), yellow: random(-1, 1), green: random(-1, 1) } }]


// basic testing preset where every color likes itself and hates the other color
let funPreset 


function preload() {
  let coronaIcon = loadImage('images/corona.webp');
  let bloodCellsIcon = loadImage('images/blood.png');
  funPreset = [{ img: coronaIcon, color: 'red', pref: { red: 0.2, blue: 1,  } },
                  { img: bloodCellsIcon ,color: 'blue', pref: { red: -1, blue: 0.2,  } }]
}

function setup() {
  createCanvas(width, height);

  for (let i = 0; i < particlesCount; i++) {
    let pres = presets[Math.floor(Math.random() * presets.length)]
    particles[i] = new Particle(random(width), random(height), pres.color,pres.pref, pres.img);
  }

}

function draw() {
  background(bg[0],bg[1],bg[2]);

  for (let i = 0; i < particles.length; i++) {
    particles[i].live(particles);
  }
  noStroke(255)
  fill(255);
  text(`${particles.length} particles, fps: ${frameRate().toFixed()}`, 20, 20)
}



class Particle {
  constructor(x, y, color, pref, img) {
    this.acceleration = createVector(0, 0);
    this.velocity = p5.Vector.random2D();
    this.position = createVector(x, y);
    this.r = 3.0;
    this.maxspeed = 3;
    this.maxforce = 0.05;
    this.color = color
    this.pref = pref
    this.image = img
  }

  live(prtcls) {
    this.regroup(prtcls);
    this.update();
    this.borders();
    this.render();
  }
  

  applyForce(force) {
    this.acceleration.add(force);
  }
  
  regroup(prtcls) {
    let sep = this.separate(prtcls);
    let ali = this.align(prtcls);
    let coh = this.cohesion(prtcls);

    sep.mult(2.5);
    ali.mult(1.3);
    coh.mult(1.0);

    this.applyForce(sep);
    this.applyForce(ali);
    this.applyForce(coh);
  }
  

  update() {

    this.velocity.add(this.acceleration);

    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);

    this.acceleration.mult(0);
  }
  

  seek(target) {
    let desired = p5.Vector.sub(target, this.position);

    desired.normalize();
    desired.mult(this.maxspeed);
    
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce); 
    return steer;
  }
  
  render() {
    if (this.image) image(this.image,this.position.x, this.position.y, 16, 16);
    else {
      fill(colors[this.color][0],colors[this.color][1],colors[this.color][2], 100);
      stroke(this.color);
      ellipse(this.position.x, this.position.y, 16, 16);
    }
  }
  
  borders() {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
  }
  
  separate(prtcls) {
    let desiredseparation = 25.0;
    let steer = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < prtcls.length; i++) {
      let d = p5.Vector.dist(this.position, prtcls[i].position);
      if ((d > 0) && (d < desiredseparation)) {
        let diff = p5.Vector.sub(this.position, prtcls[i].position);
        diff.normalize();
        diff.div(d);
        steer.add(diff);
        count++;
      }
    }

    if (count > 0) {
      steer.div(count);
    }
  
    if (steer.mag() > 0) {
      steer.normalize();
      steer.mult(this.maxspeed);
      steer.sub(this.velocity);
      steer.limit(this.maxforce);
    }
    return steer;
  }
  
  align(prtcls) {
    let neighbordist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < prtcls.length; i++) {
      let d = p5.Vector.dist(this.position, prtcls[i].position);
      if ((d > 0) && (d < neighbordist)) {
        // important part
        sum.add(createVector(prtcls[i].velocity.x*this.pref[prtcls[i].color],prtcls[i].velocity.y*this.pref[prtcls[i].color]))
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      sum.normalize();
      sum.mult(this.maxspeed);
      let steer = p5.Vector.sub(sum, this.velocity);
      steer.limit(this.maxforce);
      return steer;
    } else {
      return createVector(0, 0);
    }
  }
  
  cohesion(prtcls) {
    let neighbordist = 50;
    let sum = createVector(0, 0);
    let count = 0;
    for (let i = 0; i < prtcls.length; i++) {
      let d = p5.Vector.dist(this.position, prtcls[i].position);
      if ((d > 0) && (d < neighbordist)) {
        sum.add(prtcls[i].position);
        count++;
      }
    }
    if (count > 0) {
      sum.div(count);
      return this.seek(sum);
    } else {
      return createVector(0, 0);
    }
  }  
}

function toggleBasicMode() {
    if (presets == funPreset) location.reload()
    presets = funPreset
    bg = [59, 6, 6]
    setup()
}