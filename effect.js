const debug = require("./logs.js")

//status effects like buffs/debuffs

class Effect {
    constructor(target, duration) {
        this.duration = duration
        this.target = target
        this.name = ""
    }

    triggerEffect() {
        //trigger the effect
    }

    untriggerEffect() {
        //undo the effect
    }

    reduceCountdown() {
        this.duration --;
    }
    isOver() {
        return this.duration <= 0
    }

    onTurnStart() {
        //run this on the start of a turn
    }
    onTurnEnd() {
        //run this on the end of a turn
    }
}

/* DAN HENG BUFFS/DEBUFFS */
class DanHengTalent extends Effect {
    constructor(target, duration, ratio) { //% of speed removed
        super(target, duration)
        this.name = "Dan Heng Talent"
        this.ratio = ratio;
    }
    triggerEffect() {
        this.target.resPen += this.ratio
    }
    untriggerEffect() {
        this.target.resPen -= this.ratio
    }
    
}

class DanHengCooldown extends Effect {
    constructor(target, duration) { //% of speed removed
        super(target, duration)
        this.name = "Talent cooldown"
    }
    triggerEffect() {
        
    }
    untriggerEffect() {
        
    }
    onTurnStart() {
        //run this on the start of a turn
        this.reduceCountdown()
    }
}

class speedDown extends Effect {
    constructor(target, duration, ratio) { //% of speed removed
        super(target, duration)
        this.ratio = ratio;
        this.name = "Slow"
    }
    triggerEffect() {
        this.target.bonusSpd -= this.ratio * this.target.spd;
    }
    untriggerEffect() {
        this.target.bonusSpd += this.ratio * this.target.spd;
    }
    onTurnStart() {
        //run this on the start of a turn
        this.reduceCountdown()
    }
}

/* PELA DEBUFFS */
class IceResDown extends Effect {   
    constructor(target, duration, ratio) { //% of ice to be shredded
        super(target, duration)
        this.ratio = ratio;
        this.name = "Ice res down"
    }
    triggerEffect() {
        //TODO
        this.target.resistances["ice"] -= this.ratio;
    }
    untriggerEffect() {
        this.target.resistances["ice"] -= this.ratio;
    }
    onTurnStart() {
        //run this on the start of a turn
        this.reduceCountdown()
    }
}

class DefenseDown extends Effect {
    constructor(target, duration, ratio) { //% of defense to be shredded
        super(target, duration)
        this.ratio = ratio;
        this.name = "Defense down"
    }
    triggerEffect() {
        this.target.bonusDef -= this.ratio * this.target.def;
    }
    untriggerEffect() {
        this.target.bonusDef += this.ratio * this.target.def;
    }
    onTurnStart() {
        //run this on the start of a turn
        this.reduceCountdown()
    }
}

/* SPARKLE BUFFS */
class SparkleBonusAtk extends Effect {
    constructor(target, ratio) {
        /*
        Buff expires at the start of next turn (2 turns)
        */
        super(target, 1)
        this.ratio = ratio;
        this.name = "Atk up"
    }
    triggerEffect() {
        this.target.bonusAtk += this.target.atk * this.ratio;
    }
    untriggerEffect() {
        this.target.bonusAtk -= this.target.atk * this.ratio;
    }

    onTurnStart() {
        //infinite buff
    }
}

class SparkleSkillBuff extends Effect {
    constructor(target, duration, bonus) {
        /*
        Buff expires at the start of next turn (2 turns)
        */
        super(target, duration)
        this.bonus = bonus;
        this.name = "Critdmg up"
    }
    triggerEffect() {
        this.target.critDmg += this.bonus;
    }
    untriggerEffect() {
        this.target.critDmg -= this.bonus;
    }

    onTurnStart() {
        //run this on the end of a turn
        this.reduceCountdown()
    }
}

class SparkleTalentBuff extends Effect {
    constructor(target, ratio, boostedRatio) {
        /*
        This reapplies to ALL allies after any skill is used
        Buff expires at the end of a turn

        ratio: normal damage buff
        boostedRatio: bonus damage buff from sparkle ult
        */
        super(target, 2)
        this.ratio = ratio;
        this.boostedRatio = boostedRatio;
        this.stacks = 1;
        this.name = "Sparkle Talent"
    }
    triggerEffect() {
        this.target.dmgBonus += (this.boostedRatio + this.ratio );
    }
    untriggerEffect() {
        this.target.dmgBonus -= (this.boostedRatio + this.ratio ) * this.stacks;
    }

    onTurnEnd() {
        //run this on the end of a turn
        this.reduceCountdown()
    }

    //special methods
    gainStack() {
        this.stacks ++;
        this.duration = 2
        this.target.dmgBonus += this.ratio + this.boostedRatio
    }
    boostRatio(ratio) {
        this.boostedRatio = ratio
        this.target.dmgBonus += this.boostedRatio * this.stacks
    }
    unboostRatio() {
        this.target.dmgBonus -= this.boostedRatio * this.stacks
        this.boostedRatio = 0
        
    }
}

class SparkleUltimateAura extends Effect {
    constructor(target, ratio, allies) {
        /*
        This aura only counts down on Sparkle's turn, but affects all allies
        */
        super(target, 2)
        this.ratio = ratio;
        this.name = "Sparkle Ultimate Aura"
        this.allies = allies //TODO: DEEP COPY ALLIES FOR SPARKLE ULT
    }
    triggerEffect() {
        this.allies.forEach(a => {
            let st = a.getEffect("Sparkle Talent")
            if (st) {
                st.boostRatio(this.ratio)
                //debug("boosted", a.dmgBonus)
            }
        })
    }
    untriggerEffect() {
        this.allies.forEach(a => {
            let st = a.getEffect("Sparkle Talent")
            if (st) {
                st.unboostRatio()
            }
        })
    }

    onTurnEnd() {
        //run this on the end of a turn
        this.reduceCountdown()
    }
}

/* DOTS/BREAKS */
class Freeze extends Effect {
    constructor(target, duration) { //% of defense to be shredded
        super(target, duration)
        this.name = "Frozen"
    }
    triggerEffect() {
        //FREEEEZE TODO
        this.target.disabled = true;
    }
    untriggerEffect() {
        this.target.disabled = false;
    }
    onTurnStart() {
        //run this on the start of a turn
        this.reduceCountdown()
    }
}

module.exports = {speedDown, DanHengTalent, DanHengCooldown,
    DefenseDown, IceResDown, 
    SparkleBonusAtk, SparkleSkillBuff, SparkleTalentBuff, SparkleUltimateAura,
    Freeze}