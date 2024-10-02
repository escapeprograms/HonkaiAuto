const { SparkleBonusAtk, SparkleTalentBuff } = require("../effect.js");
const NoAction = require("../ability.js").NoAction

let maxSP = 7; //max skillpoints

class Game {
    constructor(){
        this.enemies = []
        this.characters = []

        this.cycle = 3
        this.cycleAV = 150

        this.skillPoints = 3

        this.curTurn = null;

        this.actionHistory = [] //record all moves taken

        this.uid = Math.random()
    }

    //clone the game for simulation purposes
    clone() {
        let g = new Game()
        console.log("new game id: ", g.uid)
        let curTurn = null;
        //clone entities
        let chars = this.characters.map(c => {
            let newChar = Object.assign(Object.create(Object.getPrototypeOf(c)), c)
            newChar.game = g
            if (c.uid == this.curTurn.uid) curTurn = newChar
            return newChar
        })
        let enemies = this.enemies.map(e => {
            let newEnemy = Object.assign(Object.create(Object.getPrototypeOf(e)), e)
            newEnemy.game = g
            if (e.uid == this.curTurn.uid) curTurn = newEnemy
            return newEnemy
        })

        //clone effects
        chars.forEach(c => {
            c.cloneEffects()
            c.cloneMoveset()
            g.addCharacter(c)
        })
        enemies.forEach(e => {
            e.cloneEffects()
            e.cloneMoveset()
            g.addEnemy(e)
        })

        //clone action history
        let actionHistory = this.actionHistory.map(h => {
            return Object.assign(Object.create(Object.getPrototypeOf(h)), h)
        })
        
        g.cycle = this.cycle
        g.cycleAV = this.cycleAV
        g.skillPoints = this.skillPoints
        g.curTurn = curTurn
        g.actionHistory = actionHistory
        g.characters = chars
        g.enemies = enemies
        return g;
    }

    addEnemy(enemy) {
        this.enemies.push(enemy)
    }

    addCharacter(char) {
        this.characters.push(char)
    }

    //initial battle effects etc
    beginBattle() {
        //sparkle buff
        let sparkle = this.getChar("Sparkle")
        if (sparkle) {
            this.characters.forEach(e => {
                e.applyEffect(new SparkleBonusAtk(e, 0.15))
            })
        }
        //start playing!
        this.nextTurn()
    }
    //moves the turn and returns the next person to move
    nextTurn() {
        let minAV = 10000
        let nextMover = null;
        
        this.enemies.forEach(e => {
            if (e.getAV() < minAV) {
                minAV = e.getAV()
                nextMover = e
            }
        })
        this.characters.forEach(e => {
            if (e.getAV() < minAV) {
                minAV = e.getAV()
                nextMover = e
            }
        })
        //update AVs
        this.enemies.forEach(e => {
            e.moveAV(minAV)
        })
        this.characters.forEach(e => {
            e.moveAV(minAV)
        })
        this.cycleAV -= minAV
        nextMover.resetAction()
        
        
        //iterate cycle
        if (this.cycleAV <= 0) {
            this.cycleAV += 100
            this.cycle --;
        }

        this.curTurn = nextMover //new person is taking a turn
        this.curTurn.onTurnStart() //trigger start turn effects
    }

    //get all valid moves
    getAllMoves() {
        let moveSet = [];
        this.characters.forEach(c => {
            moveSet.push(...c.movesAllowed(this.curTurn))
        })
        //during the enemy's turn, allow the "do nothing" action
        if (this.enemies.indexOf(this.curTurn) != -1) {
            moveSet.push({
                        name: "No Action",
                        move: new NoAction()
                    })
        }
        return moveSet
    }

    //move enemy during its turn
    moveEnemy() {
        for (let i = 0; i < this.enemies.length; i++) {
            let e = this.enemies[i]
            if (e.uid === this.curTurn.uid) {
                let moves = e.movesAllowed(this.curTurn) 
                let action = moves[0].move //TODO: dont hardcode, make sure it follows the enemy's pattern
                let targets = action.getTargetSelections()[0] //dont hardcode target for AOE atks

                action.cast(targets)

                if (targets)
                    console.log(action.caster.name + " attacked target " + targets[0].name)
                break
            }
        }
    }
    
    //skillpoints
    gainSP() {
        //max of 5 sp
        this.skillPoints = Math.min(this.skillPoints + 1, maxSP)
    }
    useSP() {
        this.skillPoints --;
        if (this.skillPoints < 0) console.log("Used a skillpoint we dont have")
        
        //Sparkle boost on skillpoint usage
        let sparkle = this.getChar("Sparkle")
        if (sparkle) {
            let sparkleAura = 0;
            let f = sparkle.getEffect("Sparkle Ultimate Aura")
            if (f) {
                sparkleAura = f.ratio
                console.log(sparkleAura, "sparkle aura!!")
            }
    
            this.characters.forEach(e => {
                let f = e.getEffect("Sparkle Talent")
                if (f) {
                    if (f.stacks < 3) {
                        f.gainStack() //stack up to 3
                        
                        console.log("stacked sparkle's buff", e.dmgBonus, e.name)
                    }
                }
                else {
                    e.applyEffect(new SparkleTalentBuff(e, 0.056, sparkleAura))
                    console.log("applied sparkle's buff", e.dmgBonus, e.name)
                }
            })
        }
        
    }

    //check for dead entities
    removeDead() {
        for (let i = 0; i < this.characters.length; i++) {
            if (this.characters[i].isDead()) {
                console.log(`${this.characters[i].name} is dead.`)
                this.characters.splice(i, 1)
                i --;
            }
        }
        for (let i = 0; i < this.enemies.length; i++) {
            if (this.enemies[i].isDead()) {
                console.log(`${this.enemies[i].name} is dead.`)
                //next turn if the current mover is killed
                if (this.curTurn == this.enemies[i]) {
                    this.nextTurn()
                }
                this.enemies.splice(i, 1)
                i --;

                //Pela talent
                let pela = this.getChar("Pela")
                if (pela) {
                    pela.gainEnergy(5)
                }
            }
        }
    }

    //get a character
    getChar(name) {
        let char = null;
        this.characters.forEach(e => {
            if (e.name == name) char = e
        })
        return char
    }

    //run a turn
    takeTurn(action, targets) { //pass in an ability
        console.log("\n" + this.curTurn.name + " is about to take their turn.")
        if (action.type != "noaction") { //noaction means don't ult during enemy turn etc  
            console.log(action.caster.name + " casted " + action.type + " on target " + targets.map(e => e.name))
            action.cast(targets)

            this.actionHistory.push({
                caster: action.caster.name,
                targets: targets.map(e => e.getState()),
                type: action.type
            })
        } 
        else {
            this.moveEnemy()
            this.actionHistory.push({
                caster: "none",
                targets: [],
                type: action.type
            })
        }

        //check dead
        this.removeDead()
    }

    //print update
    getGameState() {
        let ret = ""
        
        ret += "Cycle: "+ this.cycle
        ret += "\nSP: " + this.skillPoints
        ret += "\n\nEnemy info:\n"
        this.enemies.forEach(e => {
            ret += e.getState()
            ret += "\n"
        })
        ret += "\nCharacter info:\n"
        this.characters.forEach(e => {
            ret += e.getState()
            ret += "\n"
        })

        return ret
    }
}

module.exports = Game