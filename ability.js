const debug = require("./logs.js")

let effects = require("./effect.js")


/* DAMAGE */

function calcDamage(caster, target, scaling, printDamage) {
    let level = caster.level; 
    let casterAtk = (caster.atk + caster.bonusAtk)
    let baseDmg = casterAtk * scaling

    let targetDef = (target.def + target.bonusDef)
    let defMultiplier = 1 - (targetDef/(targetDef + 200 + 10*level))
    //debug("def multiplier", defMultiplier)
    
    if (caster.type == "character"){
        let dmgMultiplier = 1 + caster.dmgBonus
    
        let casterEl = caster.element
        let targetRes = target.resistances[casterEl]
        let resPen = caster.resPen 
        let resMultiplier = 1 - (targetRes - resPen)
        //debug("resMultiplier", resMultiplier)
    
        let brokenMultiplier = (target.toughness == 0) ? 1 : 0.9
        //debug("brokenMultiplier", brokenMultiplier)
        
        //crit expected value
        let critMultiplier = 1 + caster.critDmg * caster.critRate
        let finalDmg = baseDmg * dmgMultiplier * defMultiplier * resMultiplier * brokenMultiplier * critMultiplier
        if (printDamage) {
            console.log("Res Mult: ", resMultiplier) //<<< PROBLEM
            console.log("Damage dealt: ", finalDmg)
        }
        debug("Damage dealt: ", finalDmg)
        return finalDmg
    }
    else {
        return baseDmg * defMultiplier
    }
}

/* TARGET SELECTION */
function selectSingleEnemy(game) {
    //This is technically WRONG, but do permutations to reduce the exponential runtime
    let enemyStates = {}
    return game.enemies.filter(e => {
        let s = e.getState()
        if (enemyStates[s]) {
            return false
        }
        enemyStates[s] = 1;
        return true

    }).map(e => [e])
}

function selectAOEEnemy(game) {
    return [game.enemies]
}

function selectSingleAlly(game) {
    return game.characters.map(e => [e])
}

function selectAOEAlly(game) {
    return [game.characters]
}

/* ABILITIES */

class Ability {
    constructor(game, caster, castType) {
        this.caster = caster;
        this.type = castType
        this.game = game
        this.name = ""
    }

    cast(target) {
        //target is an array of enemies/allies affected
    }

    getTargetSelections() {
        //returns an array of all possible target selection permuatations
        return []
    }
}

class Skip extends Ability {
    constructor(game, caster) {
        super(game, caster, "skip")
        this.name = "Skip"
    }
    cast(target) {
        //Skip turn due to freeze
        this.game.nextTurn()
        this.caster.moveAction(5000); //action advance by 50%
    }
    onKill() {

    }
}

class NoAction extends Ability {
    constructor() {
        super(null, null, "noaction")
        this.name = "No action"
    }
    cast(target) {

    }
    onKill() {

    }
    getTargetSelections() {
        //returns an array of all possible target selection permuatations
        return []
    }
    
}

/* SUBTYPES */

class BasicAtk extends Ability{
    constructor(game, caster) {
        super(game, caster, "basic")
    }
    cast(target) {
        this.caster.gainEnergy(20)
        this.game.gainSP()
        this.caster.onTurnEnd()
        //this.game.nextTurn()
        this.game.inTurn = false;
    }
    onKill() {
        this.caster.gainEnergy(10)
    }
}

class Skill extends Ability{
    constructor(game, caster) {
        super(game, caster, "skill")
    }
    cast(target) {
        this.caster.gainEnergy(30)
        //this.game.useSP() //we need to move this
        this.caster.onTurnEnd()
        //this.game.nextTurn()
        this.game.inTurn = false;
        
        //Dan Heng Talent
        danHengTalentCheck(target)
    }
    onKill() {
        this.caster.gainEnergy(10)
    }
}

class Ultimate extends Ability{
    constructor(game, caster) {
        super(game, caster, "ultimate")
    }
    cast(target) {
        this.caster.energy = 0
        this.caster.gainEnergy(5)

        //Dan Heng Talent
        danHengTalentCheck(target)
    }
    onKill() {
        this.caster.gainEnergy(10)
    }
}

class EnemyAtk extends Ability{
    constructor(game, caster) {
        super(game, caster, "enemy")
    }
    cast() {
        this.caster.onTurnEnd()
        this.game.nextTurn() //this is WRONG BUT I DONT FUCKING CARE
    }
}

/* CHARACTERS */

/* DAN HENG */

function danHengTalentCheck(target) {
    let danHengInstance = target.filter(e => e.name == "Dan Heng")
    if (danHengInstance.length > 0) {
        let target = danHengInstance[0]
        if (!target.hasEffect("Talent Cooldown") && !target.hasEffect("Dan Heng Talent")) {
            target.applyEffect(new effects.DanHengTalent(target, 1, 0.23))
            //debug("Dan Heng gained Res Pen")
        }
    }
}

function danHengConsumeTalent(caster) {
    if (caster.hasEffect("Dan Heng Talent")){
        caster.removeEffect("Dan Heng Talent")
        caster.applyEffect(new effects.DanHengCooldown(caster, 1))
    }
}

class DanHengBasic extends BasicAtk {
    constructor(game, caster) {
        super(game, caster);
        this.name = "Dan Heng Basic"
    }
    getTargetSelections() {
        return selectSingleEnemy(this.game)
    }
    cast(target) {
        /*
        195% atk to single target
        (guarantee for argument sake) Slow target by 12% for 2 turns
        */
        target = target[0] //set the first (and only) enemy as target

        let casterAtk = (this.caster.atk + this.caster.bonusAtk)
        target.hp -= calcDamage(this.caster, target, 0.7)
        target.reduceToughness(this.caster, 30)
        if (target.isDead()) this.onKill()

        //Dan Heng talent
        danHengConsumeTalent(this.caster)
        super.cast([target])
    }
}

class DanHengSkill extends Skill {
    constructor(game, caster) {
        super(game, caster);
        this.name = "Dan Heng Skill"
    }
    getTargetSelections() {
        return selectSingleEnemy(this.game)
    }
    cast(target) {
        /*
        195% atk to single target
        (guarantee for argument sake) Slow target by 12% for 2 turns
        */


        target = target[0] //set the first (and only) enemy as target

        this.game.useSP()

        let casterAtk = (this.caster.atk + this.caster.bonusAtk)
        target.hp -= calcDamage(this.caster, target, 1.95)
        target.applyEffect(new effects.speedDown(target, 2, 0.12))
        target.reduceToughness(this.caster, 60)
        if (target.isDead()) this.onKill()

        //Dan Heng talent
        danHengConsumeTalent(this.caster)
        super.cast([target])
    }
}
class DanHengUltimate extends Ultimate {
    constructor(game, caster) {
        super(game, caster);
        this.name = "Dan Heng Ultimate"
    }
    getTargetSelections() {
        return selectSingleEnemy(this.game)
    }
    cast(target) {
        /*
        195% atk to single target
        (guarantee for argument sake) Slow target by 12% for 2 turns
        */
        target = target[0] //set the first (and only) enemy as target
        let casterAtk = (this.caster.atk + this.caster.bonusAtk)
        let scaling = 2.88
        if (target.bonusSpd < 0){
            scaling += 0.72
        }
        target.hp -= calcDamage(this.caster, target, scaling)
        target.reduceToughness(this.caster, 90)
        if (target.isDead()) this.onKill()
        
        //Dan Heng talent
        danHengConsumeTalent(this.caster)

        super.cast([target])
    }
}

/* PELA */
class PelaBasic extends BasicAtk {
    constructor(game, caster) {
        super(game, caster);
        this.name = "Pela Basic"
    }
    getTargetSelections() {
        return selectSingleEnemy(this.game)
    }
    cast(target) {
        /*
        195% atk to single target
        (guarantee for argument sake) Slow target by 12% for 2 turns
        */
        target = target[0] //set the first (and only) enemy as target
        
        let casterAtk = (this.caster.atk + this.caster.bonusAtk)

        //deal 20% more damage to debuffed enemies
        let bonusMult = 1
        if (target.effects.length > 0) bonusMult = 1.2
        target.hp -= calcDamage(this.caster, target, 0.7) * bonusMult
        //if (target.effects.length > 0) this.caster.dmgBonus -= 0.2
        target.reduceToughness(this.caster, 30)
        if (target.isDead()) this.onKill()

        super.cast([target])
    }
}

class PelaSkill extends Skill {
    constructor(game, caster) {
        super(game, caster);
        this.name = "Pela Skill"
    }
    getTargetSelections() {
        return selectSingleEnemy(this.game)
    }
    cast(target) {
        /*
        157% atk to single target
        (TODO) Removes a buff from enemy, increases speed, reduce enemy ice res
        */
        this.game.useSP()

        target = target[0] //set the first (and only) enemy as target

        let casterAtk = (this.caster.atk + this.caster.bonusAtk)
        target.applyEffect(new effects.IceResDown(target, 2, 0.12))

        //deal 20% more damage to debuffed enemies
        //console.log(this.caster)
        let bonusMult = 1
        if (target.effects.length > 0) bonusMult = 1.2
        target.hp -= calcDamage(this.caster, target, 1.57) * bonusMult

        target.reduceToughness(this.caster, 60)
        if (target.isDead()) this.onKill()

        super.cast([target])
    }
}
class PelaUltimate extends Ultimate {
    constructor(game, caster) {
        super(game, caster);
        this.name = "Pela Ultimate"
    }
    getTargetSelections() {
        return selectAOEEnemy(this.game)
    }
    cast(target) {
        /*
        195% atk to all targets
        (guarantee for argument sake) Slow target by 12% for 2 turns

        3.3k
        4.3k
        */
        target.forEach(t => {
            let casterAtk = (this.caster.atk + this.caster.bonusAtk)
           
            t.applyEffect(new effects.DefenseDown(t, 2, 0.42))

            //deal 20% more damage to debuffed enemies
            let bonusMult = 1
            if (t.effects.length > 0) bonusMult = 1.2
            t.hp -= calcDamage(this.caster, t, 1.08) * bonusMult

            t.reduceToughness(this.caster, 60)
            if (t.isDead()) this.onKill()
        })

        super.cast(target)
        
    }
}

/* SPARKLE */
class SparkleBasic extends BasicAtk {
    constructor(game, caster) {
        super(game, caster);
        this.name = "Sparkle Basic"
    }
    getTargetSelections() {
        return selectSingleEnemy(this.game)
    }
    cast(target) {
        /*
       kick
        */
        target = target[0] //set the first (and only) ally as target
        
        let casterAtk = (this.caster.atk + this.caster.bonusAtk)
        target.hp -= calcDamage(this.caster, target, 0.5)
        target.reduceToughness(this.caster, 30)
        if (target.isDead()) this.onKill()

        this.caster.gainEnergy(10) //gain 10 additional energy
        super.cast([target])
    }
}

class SparkleSkill extends Skill {
    constructor(game, caster) {
        super(game, caster);
        this.name = "Sparkle Skill"
    }
    getTargetSelections() {
        return selectSingleAlly(this.game)
    }
    cast(target) {
        /*
        Buff crit damage and action forward
        */
        this.game.useSP()

        target = target[0] 
        target.applyEffect(new effects.SparkleSkillBuff(target, 2, this.caster.critDmg * 0.24 + 0.45))

        if (target != this.caster) target.moveAction(5000) //sparkle does not self-advance
        super.cast([target])
    }
}
class SparkleUltimate extends Ultimate {
    constructor(game, caster) {
        super(game, caster);
        this.name = "Sparkle Ultimate"
    }
    getTargetSelections() {
        return selectAOEAlly(this.game)
    }
    cast(target) {
        /*
        Gain 4 skill points, and enhance the talent
        */
        for (let i = 0; i < 4; i++) {
            this.game.gainSP();
        }
        //apply self-buff
        this.caster.applyEffect(new effects.SparkleUltimateAura(this, 0.095, target))

        super.cast(target)
        
    }
}

/* ENEMIES */

class Distract extends EnemyAtk {
    constructor(game, caster) {
        super(game, caster);
        this.name = "Distract"
    }
    getTargetSelections() {
        return selectSingleAlly(this.game)
    }
    cast(target) {
        /*
        250% atk to the target
        */
       target = target[0]
        let casterAtk = (this.caster.atk + this.caster.bonusAtk)

        //target.hp -= calcDamage(this.caster, target, 2.5)
        
        super.cast()
        
    }
}

module.exports = {DanHengBasic, DanHengSkill, DanHengUltimate, 
    PelaBasic, PelaSkill, PelaUltimate,
    SparkleBasic, SparkleSkill, SparkleUltimate,
    Distract, Skip, NoAction
}