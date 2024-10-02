/*
entity stats: {
    hp, baseHp, bonusHp, Def, bonusDef, atk, bonusAtk, spd, bonusSpd, effHr, effRes
}

character stats: {
    dmgBonus, eRegen, energy, maxEnergy
}

enemy stats: {
    resistances: {fire, ice, wind, lightning, quantum, imaginary, physical}
}

*/
const debug = require("./logs.js")

class Entity {
    constructor(game, name, stats) {
        this.uid = Math.random() //just pick a random number for a UID

        this.game = game
        this.name = name;
        this.hp = stats.baseHp + stats.bonusHp
        this.baseHp = stats.baseHp
        this.bonusHp = stats.bonusHp
        this.def = stats.def
        this.bonusDef = stats.bonusDef
        this.atk = stats.atk
        this.bonusAtk = stats.bonusAtk
        this.spd = stats.spd
        this.bonusSpd = stats.bonusSpd
        this.effHr = stats.effHr
        this.effRes = stats.effRes
        this.level = stats.level || 1

        //current effects
        this.effects = [];
        this.disabled = false; //set to true when frozen

        //initial action value
        this.actionGauge = 10000;

        this.moveSet = {}
        // this.passives = []
        this.type = "undefined"
    }

    //abilities
    setMoveset(moveSet) {
        this.moveSet = moveSet
    }

    cloneMoveset() {
        let temp = {}
        Object.keys(this.moveSet).forEach(m => {
            let move = this.moveSet[m]
            let newMove = Object.assign(Object.create(Object.getPrototypeOf(move)), move)
            newMove.game = this.game
            newMove.caster = this
            temp[m] = newMove
        })
        //debug("cloned moveset game uid", Object.values(temp)[0].game.uid)
        this.moveSet = temp;
    }
    
    //speed: https://www.youtube.com/watch?v=eTGhvuLzutQ
    moveAV(av) {
        this.actionGauge -= av * (this.spd + this.bonusSpd);
    }

    moveAction(bar) { //negative means delay, positive means forward
        this.actionGauge -= bar;
        this.actionGauge = Math.max(0, this.actionGauge) //capped at 0
    }

    resetAction() {
        this.actionGauge = 10000;
    }

    getAV() {
        return this.actionGauge/(this.spd + this.bonusSpd);
    }

    //health
    isDead() {
        return this.hp <= 0
    }
    // takeDamage(dmg) {
    //     this.hp -= dmg;
    //     if (this.isDead()) {
    //         debug(`${this.name} is dead`)
    //     }
    // }

    //effects
    applyEffect(effect) {
        this.removeEffect(effect.name)//remove existing effect
        this.effects.push(effect)
        effect.triggerEffect()
    }

    hasEffect(effectName) {
        let hasEff = false
        this.effects.forEach(e => {
            if (e.name == effectName) {
                hasEff = true;
            }
        })
        return hasEff
    }

    getEffect(effectName) {
        let eff = null
        this.effects.forEach(e => {
            if (e.name == effectName) {
                eff = e;
            }
        })
        return eff
    }
    

    removeEffect(effectName) {
        let eff = null
        this.effects.forEach((e, i) => {
            if (e.name == effectName) {
                eff = i;
                //debug("removing "+e.name)
            }
        })
        if (eff != null) {
            this.effects[eff].untriggerEffect()
            this.effects.splice(eff, 1)
        }
    }

    cloneEffects() {
        this.effects = this.effects.map(e => {
            let newEff = Object.assign(Object.create(Object.getPrototypeOf(e)), e)
            newEff.target = this
            if (newEff.allies) {
                newEff.allies = this.game.characters
            }
            return newEff
        })
    }

    //turns
    onTurnStart() {
        //decrease countdown on all effects
        this.effects.forEach(e => {
            e.onTurnStart()
            if (e.duration <= 0) {
                this.removeEffect(e.name)
            }
        })
    }
    onTurnEnd() {
        //decrease countdown on all effects
        this.effects.forEach(e => {
            e.onTurnEnd()
            if (e.duration <= 0) {
                this.removeEffect(e.name)
            }
        })
    }

    //print state
    getState() {
        let ret = ""
        ret += this.name + "\n"
        ret += ">HP: " + this.hp + "\n"
        ret += ">AV: " + this.getAV() + "\n"
        //sort effects alphabetically
        function compare( a, b ) {
            if ( a.last_nom < b.last_nom ){
                return -1;
            }
            if ( a.last_nom > b.last_nom ){
                return 1;
            }
            return 0;
        }
        
        this.effects.sort(compare); //in place sorting
        this.effects.forEach(f => {
            ret += ">"+f.name + " " + f.duration +"\n"
        })
        return ret
    }
}







module.exports = Entity