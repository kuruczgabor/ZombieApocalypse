import MovingObject from "./moving_object";
import Util from "./util";
import AStar from "./astar";
import Bullet from "./bullet";

const ZOMBIE_ATTACK_SPEED = 1;
const NORMAL_FRAME_TIME_DELTA = 1000 / 60;

class Zombie extends MovingObject {

    constructor(game, pos) {
        super(game)
        this.pos = pos;
        this.height = 40;
        this.width = 40;
        this.angle = 0;
        this.vel = [0, 0];

        this.deadly = true;

        this.zombieSpeed = 1;

        this.moveUp = false;
        this.moveDown = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.nextPos = []

        this.image = new Image();
        this.image.src = "./assets/zombie/walk/Walk_000.png";

        this.zombieAnim = 'walk';
        this.frameCounter = 0;

        this.walkFrameChanger = 8;
        this.dieFrameChanger = 8;
    }

    zombieAnimate() {

        if (this.zombieAnim === "walk") {
            this.zombieWalkAnim()
        } else if (this.zombieAnim === "die") {
            this.zombieDieAnim()
        }

        this.frameCounter++
        if (this.frameCounter > 10) this.frameCounter = 0

    }

    zombieWalkAnim() {
        this.height = 40
        this.width = 40

        if (this.frameCounter === this.walkFrameChanger) {
            let curFrameSrc = this.image.src;
            let curFrameNum = parseInt(curFrameSrc.slice(-7, -4))
            curFrameNum += 1
            if (curFrameNum === 9) curFrameNum = 0
            this.image.src = './assets/zombie/walk/Walk_00' + curFrameNum.toString() + '.png'
            this.frameCounter = 0;
        }
    }

    zombieDieAnim() {
        this.height = 50
        this.width = 50

        if (this.frameCounter === this.dieFrameChanger) {
            if (this.image.src.split('/')[this.image.src.split('/').length - 2] !== 'death') {
                this.image.src = './assets/zombie/death/Death_000.png'
            }
            let curFrameSrc = this.image.src;
            let curFrameNum = parseInt(curFrameSrc.slice(-7, -4))
            curFrameNum += 1
            if (curFrameNum < 6) {
                this.image.src = './assets/zombie/death/Death_00' + curFrameNum.toString() + '.png'
            } else {
                // console.log('zombie died')
            }
        }
    }

    draw(ctx) {

        if (this.zombieAnim !== 'die') {
            this.angle = -Math.atan2(this.game.heroes[0].pos[0] - this.pos[0], 
                this.game.heroes[0].pos[1] - this.pos[1]) * 180 / Math.PI;
        }

        ctx.clearRect(0, 0, ctx.width, ctx.height);
        ctx.save();
        ctx.translate(this.pos[0] + this.width / 2, this.pos[1] + this.height / 2);
        ctx.rotate((Math.PI / 180) * this.angle)
        ctx.drawImage(this.image, -(this.width / 2), -(this.height / 2), this.width, this.height);
        ctx.restore();

    }

    zombieDie(otherObject) {

        const zombieDieSound = document.createElement("audio")
        zombieDieSound.src = './assets/sounds/Zombie Gets Attacked-SoundBible.com-20348330.mp3'
        zombieDieSound.play()

        this.game.eliminatedZombies ++

        this.zombieAnim = 'die';
        this.zombieSpeed = 0;
        this.deadly = false;
        otherObject.remove();
    }

    collideWith(otherObject) {
        if (otherObject instanceof Bullet && this.deadly) {
            this.zombieDie(otherObject);
            return true
        }
    }

    changeZombieVel() {
        const attackDir = [this.nextPos[0] - this.pos[0], this.nextPos[1] - this.pos[1]];
        const attackVel = Util.scale(Util.dir(attackDir), ZOMBIE_ATTACK_SPEED);
        if (this.zombieAnim !== 'die') {
            this.vel = attackVel
        }
        console.log('hello')
    }

    move(timeDelta) {

        const curPos = this.pos
        const curSqr = [Math.floor(this.pos[1] / 25), Math.floor(this.pos[0] / 25)]

        let nextSqr;

        if (this.deadly && this.game.heroes[0].alive) {
            nextSqr = this.getAStarMovement()
        } else {
            nextSqr = curSqr
        }

        if (nextSqr === undefined) {
            const velocityScale = timeDelta / NORMAL_FRAME_TIME_DELTA,
                offsetX = this.vel[0] * velocityScale,
                offsetY = this.vel[1] * velocityScale;

            this.pos = [this.pos[0] + offsetX, this.pos[1] + offsetY];
        }

        let nextPos;

        if (nextSqr !== undefined) {
            nextPos = [Math.floor(nextSqr['x'] * 25), Math.floor(nextSqr['y'] * 25)]
        } else {
            nextPos = [600, 300]
        }

        if (curPos[0] > nextPos[0]) this.moveLeft = true
        if (curPos[0] < nextPos[0]) this.moveRight = true
        if (curPos[1] < nextPos[1]) this.moveDown = true
        if (curPos[1] > nextPos[1]) this.moveUp = true

        if (this.moveLeft && this.pos[0] - this.zombieSpeed > 0) {
            this.pos = [this.pos[0] - this.zombieSpeed, this.pos[1]]
        }
        if (this.moveRight && this.pos[0] + this.zombieSpeed < 1200) {
            this.pos = [this.pos[0] + this.zombieSpeed, this.pos[1]]
        }
        if (this.moveUp && this.pos[1] - this.zombieSpeed > 0) {
            this.pos = [this.pos[0], this.pos[1] - this.zombieSpeed]
        }
        if (this.moveDown && this.pos[1] + this.zombieSpeed < 600) {
            this.pos = [this.pos[0], this.pos[1] + this.zombieSpeed]
        }
        
        this.moveUp = false
        this.moveDown = false
        this.moveLeft = false
        this.moveRight = false
    }

    getAStarMovement() {
        let grid = this.getWalkableMap()

        let start, end;
        let curZombierSqr = [Math.floor(this.pos[1] / 25), Math.floor(this.pos[0] / 25)]
        let curHeroSqr = [Math.floor(this.game.heroes[0].pos[1] / 25), 
                          Math.floor(this.game.heroes[0].pos[0] / 25)]

        if (curZombierSqr[1] >= curHeroSqr[1]) {
            start = curZombierSqr;
            end = curHeroSqr;
        } else {
            start = curHeroSqr;
            end = curZombierSqr;
        }

        if (curZombierSqr[0] < 0 || curZombierSqr[1] < 0) curZombierSqr = [0, 0]
        if (curZombierSqr[0] > 23 || curZombierSqr[1] < 47) curZombierSqr = [23, 47]
        if (curHeroSqr[0] < 0 || curHeroSqr[1] < 0) curHeroSqr = [0, 0]
        if (curHeroSqr[0] > 23 || curHeroSqr[1] < 47) curHeroSqr = [23, 47]

        let aStarInstance = new AStar(start, end, grid)
        aStarInstance.startAlgorithm()
        let optimalPath = aStarInstance.optimalPath

        if (optimalPath && optimalPath.length > 1) {
            if (curZombierSqr[1] >= curHeroSqr[1]) {
                return {
                    x: optimalPath[optimalPath.length - 2].col,
                    y: optimalPath[optimalPath.length - 2].row
                };
            } else {
                return {
                    x: optimalPath[1].col,
                    y: optimalPath[1].row
                };
            }
        };
    }

    getWalkableMap() {
        let basicMap = this.game.map.mapPlan;
        const walkableTiles = [10, 11, 12, 13, 14, 15, 16, 17, 18, 40, 20, 21, 22, 23, 24, 25, 26, 27, 28]
        const walkableMap = [];

        for (var row = 0; row < basicMap.length; row++) {
            const walkableRow = [];
            for (var col = 0; col < basicMap[0].length; col++) {
                if (walkableTiles.includes(basicMap[row][col])) {
                    walkableRow.push({wall: false, difficulty: 1});
                } else {
                    walkableRow.push({ wall: true, difficulty: 1});
                }
            }
            walkableMap.push(walkableRow);
        }
        return walkableMap;
    }

}

export default Zombie;