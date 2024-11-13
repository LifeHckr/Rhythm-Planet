title = "METEO PLANET";

description = `
[Tap] Move
`;

characters = [
  `
llllll
ll l l
ll l l
llllll
 l  l
 l  l
  `,
  `
llllll
ll l l
ll l l
llllll
ll  ll
  `,
  `
 lll
l l l
l lll
ll ll
 lll
`,
];

options = {
  theme: "dark",
  isPlayingBgm: true,
  isReplayEnabled: true,
  seed: 6,
};
//To make it a rhythm-ish game:
//Make meteors hit planet on beat
//As time speeds up, speed and frequency should go up
//Combo: rotate on beat, collect coins, don't let coins hit planet, rotate only right before a meteor would hit you.
//
/** @type {{dist: number, angle: number, speed: number, type: number}[]} */
let fallings;
let nextFallingsTicks;
let nextFallingAngle;
let angle;
let targetAngle;
let animTicks;
/** @type {{dist: number, angle: number}[]} */
let stars;

/** @type {{ str: string; pos: Vector; vy: number; ticks: number, color: string }[]} */
let floaters;

const MAX_RADIUS = 6;
const BEAT_BUFFER = 5;
const TIMING = 8;
let beat;
let combo;
let successCombo = false;
let mistakes;

function update() {
  if (!ticks) {
    fallings = [{ dist: 70, angle: (3 * PI) / 2, speed: .5, type: 0 }]; //always has 1 to start
    nextFallingsTicks = 141;
    angle = 0;
    targetAngle = 0;
    animTicks = 0;
    stars = times(24, (_) => ({ dist: rnd(10, 70), angle: rnd(PI * 2) }));

    floaters = [];
    combo = 0;
    mistakes = 3;
    beat = 0;
  }
  beat--;

  const curDifficulty = sqrt((combo * 0.0001)) + difficulty; //difficulty

  color("light_black"); //background stars
  const starPos = vec();
  stars.forEach((star) => {
    starPos.set(50, 50).addWithAngle(star.angle - angle, star.dist);
    box(starPos, 1);
  });

  color("yellow");
  text(`Cmb ${combo}`, 3, 9); //drawn combo

  color("black"); //Player and input handling
  if (input.isJustPressed) {
    beat = BEAT_BUFFER;
    if (ticks % 30 < 5 || ticks % 30 > 25) {
      play("select");
    }

    targetAngle = angle >= 2*PI ? PI/2 : targetAngle + PI/2;
  }
  char(addWithCharCode(targetAngle !== angle ? "b" : "a", floor(animTicks / 3) % 2), 50, 42);
  angle = targetAngle;
  arc(50, 50, 3, 2, -angle + PI * 0.2, -angle + PI * 2.2);

  if (nextFallingsTicks <= 0) { //will change
    let fallingAngle = (targetAngle / (PI / 2)) % 4;
    const fallingsRadius = rndi(1, MAX_RADIUS); //0 = just meteor, every additional increases the num on each side
    let dist = 70; //just offscreen?
    let angle = fallingAngle * (PI / 2);
    times(MAX_RADIUS, (i) => { //at most there should be
      let type = abs(i + 1 - MAX_RADIUS);
      if (type <= fallingsRadius) {
        fallings.push({
          dist,
          angle,
          speed: .5 * curDifficulty,
          type: type === 0 ? 0 : fallingsRadius - type + 1,
        });
      }
      dist += MAX_RADIUS + 2;
    });
    nextFallingsTicks = 200 / sqrt(curDifficulty);
  }

  remove(floaters, (fl) => {
    color(fl.color);
    text(fl.str, fl.pos);
    fl.pos.y -= fl.vy;
    fl.vy *= .9;
    fl.ticks--;
    return fl.ticks < 0;
  });
  const fp = vec();
  remove(fallings, (f) => {
    f.dist -= f.speed; //at distance 70, with -.5 takes ~130ticks to hit, 100 dist : 190ticks
    fp.set(50, 50).addWithAngle(f.angle - angle, f.dist);
    if (f.type === 0) {
      if(f.dist < 17){
        color("red");
      }
      else if(f.dist < 20){
        color("yellow");
      }
      else if(f.dist < 30){
        color("light_yellow");
      }
      else{
        color("black");
      }
      const c = char("c", fp).isColliding.char;
      if (c.a || c.b) {
        nextFallingsTicks = -1;
        play("explosion");
        end();
        return true;
      }
    } else {
      color("yellow");
      const c = box(fp, f.type).isColliding.char;
      if (c.a || c.b) {
        if (f.type === 1 && abs(beat) < TIMING / f.speed) {
          successCombo = true;
          combo++;
          floaters.push({
            str: "Combo",
            pos: vec(50, 42),
            vy: 2,
            ticks: 30,
            color: "yellow"
          });
        } else if (f.type === 1) {
          addScore(1, vec(50, 42));
          floaters.push({
            str: "Early",
            pos: vec(50, 42),
            vy: 2,
            ticks: 30,
            color: "light_yellow"
          });
        }else if (successCombo) {
          play("powerUp");
          addScore(combo * f.type, vec(50, 42));
        } else {
          play("powerUp", {volume: 1, note: "C5"});
          addScore(1, vec(50, 42));

        }
        return true;
      }
    }

    if (f.dist < 5) {//hitting planet
      if (f.type === 0) {
        nextFallingsTicks = -1;
        if (abs(beat) < TIMING / f.speed) {
          play("hit");
          combo++;
          addScore(combo);
          floaters.push({
            str: "combo",
            pos: vec(50, 42),
            vy: 2,
            ticks: 30,
            color: "yellow"
          });
        } else if (abs(beat) > TIMING) {
          if (abs(f.angle - angle) === PI) {
            floaters.push({
              str: "early",
              pos: vec(fp.x, fp.y),
              vy: 2,
              ticks: 30,
              color: "light_yellow"
            });
          } else {
            floaters.push({
              str: "miss",
              pos: vec(fp.x, fp.y),
              vy: 2,
              ticks: 30,
              color: "red"
            });
          }
          play("explosion");
          combo = 0;
        }
        particle(fp);
        successCombo = false;
      } else {
        floaters.push({
          str: "miss",
          pos: vec(50, 42),
          vy: 2,
          ticks: 30,
          color: "red"
        });
        combo = 0;
        play("laser", {volume: 1});
      }
      return true;
    }
  });
}