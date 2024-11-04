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

/** @type {{dist: number, angle: number, type: number}[]} */
let fallings;
let nextFallingsTicks;
let nextFallingAngle;
let angle;
let targetAngle;
let animTicks;
/** @type {{dist: number, angle: number}[]} */
let stars;

const MAX_RADIUS = 6;
let combo;
let mistakes;

function update() {
  if (!ticks) {
    fallings = [{ dist: 53, angle: (rndi(4) * PI) / 2, type: 0 }]; //always has 1 to start
    nextFallingsTicks = 0;
    nextFallingAngle = rndi(1, 4);
    angle = 0;
    targetAngle = 0;
    animTicks = 0;
    stars = times(24, (_) => ({ dist: rnd(10, 70), angle: rnd(PI * 2) }));

    combo = 0;
    mistakes = 3;
  }
  color("yellow");
  text(`Cmb ${combo}`, 3, 9); //drawn combo

  const curDifficulty = sqrt(difficulty); //difficulty

  color("light_black"); //background stars
  const starPos = vec();
  stars.forEach((star) => {
    starPos.set(50, 50).addWithAngle(star.angle - angle, star.dist);
    box(starPos, 1);
  });

  color("black"); //Player and input handling
  if (input.isJustPressed) {
    play("select");
    //play("laser");
    targetAngle += PI / 2;
  }
  char(addWithCharCode(targetAngle !== angle ? "b" : "a", floor(animTicks / 3) % 2), 50, 42);
  angle = targetAngle;
  arc(50, 50, 3, 2, -angle + PI * 0.2, -angle + PI * 2.2);

  nextFallingsTicks--;
  if (nextFallingsTicks < 0) {
    const fallingsRadius = rndi(MAX_RADIUS); //0 = just meteor, every additional increases the num on each side
    let dist = 70; //just offscreen?
    let angle = nextFallingAngle * (PI / 2);
    times(MAX_RADIUS, (i) => { //at most there should be
      let type = abs(i + 1 - MAX_RADIUS);
      if (type <= fallingsRadius) {
        fallings.push({
          dist,
          angle,
          type: type === 0 ? 0 : fallingsRadius - type + 1,
        });
      }
      dist += MAX_RADIUS;
    });
    nextFallingsTicks = rnd(50, 80) / sqrt(curDifficulty);
    nextFallingAngle += rndi(1, 4);
  }

  const fp = vec();
  remove(fallings, (f) => {
    f.dist -= 0.5 * curDifficulty;
    fp.set(50, 50).addWithAngle(f.angle - angle, f.dist);
    if (f.type === 0) {
      color("black");
      const c = char("c", fp).isColliding.char;
      if (c.a || c.b) {
        play("explosion");
        //end();
      }
    } else {
      color("yellow");
      const c = box(fp, f.type).isColliding.char;
      if (c.a || c.b) {
        play("powerUp");
        addScore(f.type);
        return true;
      }
    }
    if (f.dist < 5) {
      if (f.type === 0) {
        play("hit");
        particle(fp);
      }
      return true;
    }
  });
}
