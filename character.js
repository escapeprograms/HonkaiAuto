const debug = require("./logs.js")

const Entity = require("./entity.js")
const abilities = require("./ability.js")
const effects = require("./effect.js")

class Character extends Entity {
    constructor(game, name, stats) {
        super(game, name, stats)
        this.critDmg = stats.critDmg || 0.5
        this.critRate = stats.critRate || 0.05
        this.dmgBonus = stats.dmgBonus || 0
        this.eRegen = stats.eRegen || 1
        this.breakEffect = stats.breakEffect || 0
        this.energy = stats.maxEnergy/2 //characters start with half of their energy
        this.maxEnergy = stats.maxEnergy
        this.element = stats.element
        this.resPen = 0
        this.type = "character"

        this.noAction = new abilities.NoAction(this.game, this)
    }
    gainEnergy(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount)
    }

    movesAllowed(curMover) {
        let moves = []
        //only can cast during this turn
        if (curMover == this) {
            moves.push(this.moveSet.basicAtk)
            if (this.game.skillPoints > 0) {
                moves.push(this.moveSet.skill)
            }
        }

        //can cast during any turn
        if (this.energy == this.maxEnergy) {
            moves.push(this.moveSet.ultimate)
        }
        return moves;
    }

    //print self
    getState() {
        let ret = super.getState()
        ret += ">energy: "+this.energy + "\n"
        return ret
    }
}

/* DAN HENG */
class DanHeng extends Character {
    constructor(game, stats) {
        super(game, "Dan Heng", stats)
        const basicAtk = new abilities.DanHengBasic(this.game, this);
        const skill = new abilities.DanHengSkill(this.game, this);
        const ultimate = new abilities.DanHengUltimate(this.game, this);

        let moveSet = {
            basicAtk: basicAtk,
            skill: skill,
            ultimate: ultimate,
            noAction: this.noAction
        }
        this.setMoveset(moveSet)
    }


    // applyEffect(effect) {
    //     super.applyEffect(effect)
    //     //todo?, check if the new effect is a buff
    //     if (!this.hasEffect("Talent Cooldown") && !this.hasEffect("Dan Heng Talent")) {
    //         this.applyEffect(new effects.DanHengTalent(this, 1, 0.23))
    //     }
    // }
}

/* PELA */
class Pela extends Character {
    constructor(game, stats) {
        super(game, "Pela", stats,)
        const basicAtk = new abilities.PelaBasic(this.game, this);
        const skill = new abilities.PelaSkill(this.game, this);
        const ultimate = new abilities.PelaUltimate(this.game, this);

        let moveSet = {
            basicAtk: basicAtk,
            skill: skill,
            ultimate: ultimate,
            noAction: this.noAction
        }
        this.setMoveset(moveSet)
    }
}

/* SPARKLE */
class Sparkle extends Character {
    constructor(game, stats) {
        super(game, "Sparkle", stats,)
        const basicAtk = new abilities.SparkleBasic(this.game, this);
        const skill = new abilities.SparkleSkill(this.game, this);
        const ultimate = new abilities.SparkleUltimate(this.game, this);

        let moveSet = {
            basicAtk: basicAtk,
            skill: skill,
            ultimate: ultimate,
            noAction: this.noAction
        }
        this.setMoveset(moveSet)
    }
}


module.exports = {Character, DanHeng, Pela, Sparkle}