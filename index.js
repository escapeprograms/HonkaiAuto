/*
Simulate Honkai Star Rail Combat!
The characters implemented are Dan Heng, Pela, and Sparkle
The enemies implemented are Flame Spawn, (Blaze out of Space but not yet)
*/


//to demo simulation
const prompt = require("prompt-sync")({ sigint: true });

const Game = require("./game.js")
const Entity = require("./entity.js")
const characters = require("./character.js")
const enemies = require("./enemy.js")


//NOTE: put all %s in decimal form
const danHengStats = {
    level: 70,
    baseHp: 1501,
    bonusHp: 900,
    atk:752,
    bonusAtk:789,
    def: 575,
    bonusDef: 90,
    spd: 110,
    bonusSpd: 29,
    critRate: 1,//0.798,
    critDmg: 1.297,
    breakEffect: 0.29,
    //outgoing healing bonus dont exist here lol
    maxEnergy: 100,
    eRegen: 1,
    effHr: 0.146,
    effRes: 0.069,
    dmgBonus: 0.032,

    element: "wind"
}

const pelaStats = {
    level: 70,
    baseHp: 920,
    bonusHp: 745,
    atk: 509,
    bonusAtk: 99,
    def: 431,
    bonusDef: 37,
    spd: 105,
    bonusSpd: 2,
    critRate: 0.0,//0.1
    critDmg: 0.77,
    breakEffect: 0,
    //outgoing healing bonus dont exist here lol
    maxEnergy: 110,
    eRegen: 1,
    effHr: 0.58,
    effRes: 0,
    dmgBonus: 0.064,
    element: "ice"
}

const sparkleStats = {
    level: 70,
    baseHp: 1302,
    bonusHp: 1151,
    atk: 488,
    bonusAtk: 0,
    def: 452,
    bonusDef: 63,
    spd: 101,
    bonusSpd: 7,
    critRate: 0.0,
    critDmg: 1.345,
    breakEffect: 0.051,
    //outgoing healing bonus dont exist here lol
    maxEnergy: 110,
    eRegen: 1,
    effHr: 0,
    effRes: 0,
    dmgBonus: 0,
    element: "quantum"
}

// Forgotten Hall 11
//2,089	286	750	83	4%	2%
const flameSpawnStats = {
    baseHp: 2089,
    bonusHp: 0,
    atk: 286,
    bonusAtk: 0,
    def: 750,
    bonusDef: 0,
    spd: 83,
    bonusSpd: 0,
    effHr: 0.04,
    effRes: 0.02,

    maxToughness: 30,
    weakness: ["ice", "physical"]
}

/*
Attack pattern:
Bellowing Inferno + Blazing Absorption
Rain of Flames + Molten Fusion (continuously repeated)

*/
const blazeSpaceStats = {
    baseHp: 34812,
    bonusHp: 0,
    atk: 286,
    bonusAtk: 0,
    def: 750,
    bonusDef: 0,
    spd: 120,
    bonusSpd: 0,
    effHr: 0.04,
    effRes: 0.22,

    maxToughness: 300,
    weakness: ["ice", "physical", "quantum"]
}

const g = new Game()
console.log("ok")





const dan = new characters.DanHeng(g, danHengStats)
const pela = new characters.Pela(g, pelaStats)
const sparkle = new characters.Sparkle(g, sparkleStats)


g.addCharacter(dan)
g.addCharacter(pela)
g.addCharacter(sparkle)

//wave 0
for (let i = 0; i < 5; i++) {
    let flameSpawn = new enemies.FlameSpawn(g, flameSpawnStats)
    g.addEnemy(flameSpawn, 0)
}

//wave 1
for (let i = 0; i < 2; i++) {
    let flameSpawn = new enemies.FlameSpawn(g, flameSpawnStats)
    g.addEnemy(flameSpawn, 1)
}

let blazeSpace = new enemies.BlazeSpace(g, blazeSpaceStats)
g.addEnemy(blazeSpace, 1)



g.beginBattle()


while (g.cycle > 0) {
    //get moves
    let options = g.getAllMoves() 
    console.log("\nmoves", options.map(o => o.name))

    //enemy's turn
    if (options.length == 0) {
        g.takeTurn(null, null)
    }
    else {
        //our turn
        let moveIndex = prompt("Which move are you going to choose? (index): ") || 0;
        let move = options[moveIndex]

        let targets = move.getTargetSelections()

        console.log("targets for " + move.type + ": ", targets.map(t => t.map(e => e.name + ` (hp = ${e.hp})`)))
        
        let target = prompt("Which target are you going to choose? (index): ") || 0
        g.takeTurn(move, targets[target])
    }

    //check dead enemies
    if (g.enemies.length == 0) {
        console.log("enemies are all gone")
        break
    }
    
    //follow up (ults) between turns taken
    while (!g.inTurn) {
        let ultOptions = g.getFollowUpMoves() 
        console.log("\nult moves", ultOptions.map(o => o.name))
        
        let moveIndex = prompt("Which ULT move are you going to choose? (index): ") || 0;
        let move = ultOptions[moveIndex]
        
        let targets = move.getTargetSelections()
        console.log("targets for " + move.type + ": ", targets.map(t => t.map(e => e.name + ` (hp = ${e.hp})`)))
        
        let target = move.type != "noaction" ? prompt("Which target are you going to choose? (index): ") || 0 : 0
        if (move.type == "noaction") {
            console.log("noaction chosen, continuing game")
        }
        g.followUp(move, targets[target])
    }
    
    //check dead enemies
    if (g.enemies.length == 0) {
        console.log("enemies are all gone")
        break
    }
}

console.log("Sim done!")

console.log(g.getGameState())

/*
Characters to use:f\
Dan Heng
Tingyun
Pela
*/