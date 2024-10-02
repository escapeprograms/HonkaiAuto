const debug = require("./logs.js")

const { SparkleBonusAtk, SparkleTalentBuff } = require("./effect.js");
const NoAction = require("./ability.js").NoAction

let maxSP = 7; //max skillpoints

class Game {
    constructor(){
        this.uid = Math.random()

        this.enemies = []
        this.characters = []

        this.cycle = 30
        this.cycleAV = 150

        this.skillPoints = 3
        this.curTurn = null;
        this.actionHistory = [] //record all moves taken
        this.inTurn = true //determines whether we do follow up or normal turn

        //waves
        this.wave = 0
        this.waves = []
    }

    startWave(n) {
        if (!this.waves[n]) return; 

        debug(`>>New wave!! Wave ${n} started!`)
        debug("cycle: ", this.cycle)

        let newEnemies = this.waves[n]
        this.enemies = newEnemies.map(e => {
            let newEnemy = Object.assign(Object.create(Object.getPrototypeOf(e)), e)
            newEnemy.game = this
            let r = newEnemy.resistances
            newEnemy.resistances = Object.assign(Object.create(Object.getPrototypeOf(r)), r)
            return newEnemy
        })
        
        this.cycleAV = 150

        //reset all actions
        this.characters.forEach(e => {
            e.resetAction()
            //console.log(e.getAV(), e.name)
        })
        this.enemies.forEach(e => {
            e.resetAction()
        })
        this.nextTurn()
        
        //provide a notice
        this.actionHistory.push({
            notice: `>>New wave!! Wave ${n} started!`
        })
        
    }

    //clone the game for simulation purposes
    clone() {
        //if this.curTurn is gone, the enemy just died
        let g = new Game()
        let curTurn = null;
        //clone entities
        let chars = this.characters.map(c => {
            let newChar = Object.assign(Object.create(Object.getPrototypeOf(c)), c)
            newChar.game = g
            if (this.curTurn && c.uid == this.curTurn.uid) curTurn = newChar
            return newChar
        })
        let enemies = this.enemies.map(e => {
            let newEnemy = Object.assign(Object.create(Object.getPrototypeOf(e)), e)
            newEnemy.game = g
            let r = newEnemy.resistances
            newEnemy.resistances = Object.assign(Object.create(Object.getPrototypeOf(r)), r)
            if (this.curTurn && e.uid == this.curTurn.uid) curTurn = newEnemy
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
            g.addEnemy(e, -1)
        })

        //clone action history
        let actionHistory = this.actionHistory.map(h => {
            return Object.assign(Object.create(Object.getPrototypeOf(h)), h)
        })
        
        g.cycle = this.cycle
        g.cycleAV = this.cycleAV
        g.skillPoints = this.skillPoints
        g.curTurn = curTurn
        g.inTurn = this.inTurn
        g.actionHistory = actionHistory
        g.characters = chars
        g.enemies = enemies
        g.waves = this.waves //WARNING: WAVES ARE NOT CLONED
        g.wave = this.wave
        return g;
    }

    addEnemy(enemy, wave) {
        //spawn enemy normally
        if (wave == -1) {
            this.enemies.push(enemy)
            return
        }

        //add enemy to wave
        if (!this.waves[wave]) {
            this.waves[wave] = []
        }
        this.waves[wave].push(enemy)
    }

    addCharacter(char) {
        this.characters.push(char)
    }

    //initial battle effects etc
    beginBattle() {
        //spawn in enemies
        this.startWave(0)
        //sparkle buff
        let sparkle = this.getChar("Sparkle")
        if (sparkle) {
            this.characters.forEach(e => {
                e.applyEffect(new SparkleBonusAtk(e, 0.15))
            })
        }
        //start playing!
        //this.nextTurn()
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
            this.actionHistory.push({
                notice: `>> ${this.cycle} cycles left!`
            })
        }

        this.curTurn = nextMover //new person is taking a turn
        this.curTurn.onTurnStart() //trigger start turn effects
        this.inTurn = true

        // this.actionHistory.push({
        //     notice: nextMover.name + " is starting turn",
        //     movesAvail: this.getAllMoves().map(e => e.name)
        // })
    }

    //get all valid moves for a normal turn
    getAllMoves() {
        let moveSet = [];
        
        //during the enemy's turn, allow the "do nothing" action
        // if (this.curTurn.type == "enemy") {
        //     moveSet.push({
        //                 name: "No Action",
        //                 move: new NoAction()
        //             })
        // }
        if (this.curTurn.type == "character") {
            //move our characters during our turn
            this.characters.forEach(c => {
                moveSet.push(...c.movesAllowed(this.curTurn))
            })
        }
        return moveSet
    }
    //get valid follow up moves (ults)
    getFollowUpMoves() {
        let moveSet = [];
        
        //move our characters during our turn
        this.characters.forEach(c => {
            moveSet.push(...c.movesAllowed(this.curTurn).filter(m => m.type == "ultimate")) //TODO filter out to get only ultimates
        })
        moveSet.push(new NoAction())
        
        return moveSet
    }

    //move enemy during its turn
    moveEnemy() {
        for (let i = 0; i < this.enemies.length; i++) {
            let e = this.enemies[i]
            if (e.uid === this.curTurn.uid) {
                let moves = e.movesAllowed(this.curTurn) 
                let action = moves[0] //TODO: dont hardcode, make sure it follows the enemy's pattern
                let targets = action.getTargetSelections()[0] //dont hardcode target for AOE atks

                action.cast(targets)

                // if (targets)
                //     debug(action.caster.name + " attacked target " + targets[0].name)
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
        if (this.skillPoints < 0) debug("Used a skillpoint we dont have")
        
        //Sparkle boost on skillpoint usage
        let sparkle = this.getChar("Sparkle")
        if (sparkle) {
            let sparkleAura = 0;
            let f = sparkle.getEffect("Sparkle Ultimate Aura")
            if (f) {
                sparkleAura = f.ratio
                //debug(sparkleAura, "sparkle aura!!")
            }
    
            this.characters.forEach(e => {
                let f = e.getEffect("Sparkle Talent")
                if (f) {
                    if (f.stacks < 3) {
                        f.gainStack() //stack up to 3
                        
                        //debug("stacked sparkle's buff", e.dmgBonus, e.name)
                    }
                }
                else {
                    e.applyEffect(new SparkleTalentBuff(e, 0.056, sparkleAura))
                    //debug("applied sparkle's buff", e.dmgBonus, e.name)
                }
            })
        }
        
    }

    //check for dead entities
    removeDead() {
        for (let i = 0; i < this.characters.length; i++) {
            if (this.characters[i].isDead()) {
                debug(`${this.characters[i].name} is dead.`)
                this.characters.splice(i, 1)
                i --;
            }
        }
        for (let i = 0; i < this.enemies.length; i++) {
            if (this.enemies[i].isDead()) {
                debug(`${this.enemies[i].name} is dead.`)
                //next turn if the current mover is killed
                // if (this.curTurn == this.enemies[i]) {
                //     //this.nextTurn()
                // }
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

        debug("\n" + this.curTurn.name + " is about to take their turn.")
        
        //your turn
        if (this.curTurn.type == "character") {
            debug(action.caster.name + " casted " + action.type + " on target " + targets.map(e => e.name))
            this.actionHistory.push({
                ability: action.name,
                targets: targets.map(e => e.getState()),
                AVs: this.characters.map(e => e.name+ ", " + e.getAV()),
                curTurn: this.curTurn.name
            })

            action.cast(targets)

            
        } 
        else { //enemy turn
            this.moveEnemy()
            this.inTurn = false //opportunity to followup
            
        }

        //check dead
        this.removeDead()
        
        //next wave
        if (this.enemies.length == 0) {
            this.wave ++
            this.startWave(this.wave)
        }
    }

    followUp(action, targets) { //cast an ultimate ability out of turn
        if (action.type != "noaction") { //noaction means don't ult during this gap
            debug(action.caster.name + " casted " + action.type + " on target " + targets.map(e => e.name))
            this.actionHistory.push({
                ability: action.name,
                targets: targets.map(e => e.getState()),
                afterTurn: this.curTurn ? this.curTurn.name : "Dead Enemy"
            })

            action.cast(targets)
            

            //check dead
            this.removeDead()

            //next wave
            if (this.enemies.length == 0) {
                this.wave ++
                this.startWave(this.wave)
            }
        } else {
            let old = this.curTurn ? this.curTurn.name : "Dead Enemy"
            this.nextTurn() //go back to normal turns
            this.actionHistory.push({
                notice:"forfeit followup",
                oldCurTurn: old,
                newCurTurn: this.curTurn.name
            })
        }
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