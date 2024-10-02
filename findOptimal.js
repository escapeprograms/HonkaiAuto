/*
Run the Optimizer
*/

const SearchTree = require("./searchTree.js")

const Game = require("./game.js")
const Entity = require("./entity.js")
const characters = require("./character.js")
const enemies = require("./enemy.js")
const { NoAction } = require("./ability.js")


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
    critRate: 0,//0.1
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

const sparkleStats = { //TODO add actual stats
    level: 70,
    baseHp: 1302,
    bonusHp: 1151,
    atk: 488,
    bonusAtk: 0,
    def: 452,
    bonusDef: 63,
    spd: 101,
    bonusSpd: 7,
    critRate: 0,
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
    level:55,

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
// for (let i = 0; i < 1; i++) {
//     let flameSpawn = new enemies.FlameSpawn(g, flameSpawnStats)
//     g.addEnemy(flameSpawn, 1)
// }

// let blazeSpace = new enemies.BlazeSpace(g, blazeSpaceStats)
// g.addEnemy(blazeSpace, 1)



g.beginBattle()



let s = new SearchTree(g)

let b = s.findOptimal()

if (b) {
    console.log(b.actionHistory)
    console.log(b.getGameState())
}




// let g2 = g.clone()

// console.log("g ID: ", g.uid)
// console.log("g2 ID", g2.uid)



// //ERROR: the cloned game is affecting the original
// let options = g2.getAllMoves() 


// for (let i = 0; i < 4; i++) {
//     let targets = options[0].getTargetSelections()
//     g2.takeTurn(options[0], targets[0])
//     console.log("b4 followup",g2.curTurn.name)

//     let g3 = g2.clone()
//     let f = new NoAction()
//     g3.followUp(f,null)
//     console.log("post follupwup", g3.curTurn.name)
//     console.log("\n")

//     g2 = g3
// }


