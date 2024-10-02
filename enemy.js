const debug = require("./logs.js")

const Entity = require("./entity.js")
const abilities = require("./ability.js")
const effects = require("./effect.js")

class Enemy extends Entity {
    constructor(game, name, stats) {
        super(game, name, stats)
        this.maxToughness = stats.maxToughness || 30
        this.toughness = this.maxToughness
        this.weakness = stats.weakness //an array of weaknesses
        this.resistances = stats.resistances || {
            physical: 0.2, fire: 0.2, ice: 0.2, lightning: 0.2, wind: 0.2, quantum: 0.2, imaginary: 0.2
        }
        this.weakness.forEach(w => {
            this.resistances[w] = 0 //enemies have no resistance to elements they are weak to.
        })
            //{ice:0.2, fire: 0.2, etc...}
        this.type = "enemy"
    }

    movesAllowed(curMover) {
        let moves = []
        //only can cast during this turn
        if (curMover == this) {
            //TODO: basic and skill on all possible targets
            if (this.disabled) {
                moves.push(this.moveSet.disabled)
            }
            else {
                moves.push(this.moveSet.basicAtk)
            }
            
        }
        return moves;
    }

    calcBreakDamage(caster, baseDmg) {
        let targetDef = (this.def + this.bonusDef)
        let defMultiplier = 1 - (targetDef/(targetDef + 200 + 10*caster.level))
        //debug("def multiplier", defMultiplier)
        
        let dmgMultiplier = 1 //do not take into account the damage bonus from caster

        let casterEl = caster.element
        let targetRes = this.resistances[casterEl]
        let resPen = caster.resPen 
        let resMultiplier = 1 - (targetRes - resPen)
    
        let brokenMultiplier = 0.9 //break damage comes before broken multiplier
        let finalDmg = baseDmg * dmgMultiplier * defMultiplier * resMultiplier * brokenMultiplier
        debug("Break damage dealt: ", finalDmg)
        return finalDmg
    }

    reduceToughness(caster, amount) {
        let element = caster.element
        let BE = caster.breakEffect
        if (this.weakness.indexOf(element) != -1) {
            this.toughness -= amount;
            if (this.toughness <= 0) {
                debug("weakness broken!")
                //deal break damage and apply debuff
                let toughnessMultiplier = 0.5 + (this.maxToughness/120)
                let levelMultiplier = 2659; //hardcode level 70 for now
                let level = 70

                this.moveAction(-2500) //delay action by a set amount

                switch (element) {
                    case "physical":
                        this.hp -= this.calcBreakDamage(caster, 2 * levelMultiplier * toughnessMultiplier)
                        //in a full simulation, we would apply a DOT debuff here, but no time to implement :(
                        break
                    case "fire":
                        this.hp -= this.calcBreakDamage(caster, 2 * levelMultiplier * toughnessMultiplier)
                        break
                    case "ice":
                        this.hp -= this.calcBreakDamage(caster, 1 * levelMultiplier * toughnessMultiplier)

                        //apply freeze
                        this.applyEffect(new effects.Freeze(this, 1))
                        break
                    case "lightning":
                        this.hp -= this.calcBreakDamage(caster, 1 * levelMultiplier * toughnessMultiplier)
                        break
                    case "wind":
                        this.hp -= this.calcBreakDamage(caster, 1.5 * levelMultiplier * toughnessMultiplier)
                        break
                    case "quantum":
                        this.hp -= this.calcBreakDamage(caster, 0.5 * levelMultiplier * toughnessMultiplier)
                        this.moveAction(-2000 * (1 + BE))
                        break
                    case "imaginary":
                        this.hp -= this.calcBreakDamage(caster, 0.5 * levelMultiplier * toughnessMultiplier)
                        this.moveAction(-3000 * (1 + BE))
                        break
                    
                }
            }
        }
        
    }

    //turns
    onTurnStart() {

        //decrease countdown on all effects
        super.onTurnStart()

    }
}

/* FLAMESPAWN */
class FlameSpawn extends Enemy {
    constructor(game, stats) {
        super(game, "Flame Spawn", stats)
        const atk1 = new abilities.Distract(this.game, this)
        const disabled = new abilities.Skip(this.game, this)

        let moveSet = {
            basicAtk: atk1,
            disabled: disabled
        }
        this.setMoveset(moveSet)
    }
}

class BlazeSpace extends Enemy {
    constructor(game, stats) {
        super(game, "Blaze out of Space", stats)//TODO: actually give this guy attacks
        const atk1 = new abilities.Distract(this.game, this)
        const disabled = new abilities.Skip(this.game, this)

        let moveSet = {
            basicAtk: atk1,
            disabled: disabled
        }
        this.setMoveset(moveSet)
    }
}

module.exports = {FlameSpawn, BlazeSpace}