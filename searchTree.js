const debug = require("./logs.js")

class SearchTree {
    constructor(game) {
        //game should already be initialized with the battle started
        this.savedStates = {} //save all states using the string encoding
        this.queue = [game]
        this.nextDepth = [] //put games in here that will be processed in the next batch, will put these nodes in queue
        this.cycleThreshold = game.cycle
        this.wave = 0
        debug("initial threshold: ",this.cycleThreshold)
        this.winner = null //record the tree path that "wins"
    }
    processNextState() {
        let game = this.queue[0] 
        this.queue.shift() //remove from queue


        //debug("Current cycles: ", game.cycle)
        //check if cycles are all used
        if (game.cycle < this.cycleThreshold) {
            this.nextDepth.push(game) //add to the next "batch"
            debug("this is too deep; increase the depth to search this", game.cycle)
            return;
        }

        

        //check if the game is "over"
        if (game.enemies.length == 0) {
            this.winner = game
            return;
        }

        //check if wave has changed
        if (game.wave > this.wave) {
            console.log("new wave!")
            this.wave = game.wave;
            this.queue = [game]
            this.nextDepth = []
            return;
        }

        //check memo
        let gameState = game.getGameState()
        if (this.savedStates[gameState] == 1) { // we have calculated this state in the past
            debug("we have previously calculated this")
            return;
        }
        this.savedStates[gameState] = 1

        //now expand the tree for each move and each target

        //its a normal turn
        if (game.inTurn == true) {
            debug("In normal turn...", game.curTurn.name)
            let options = game.getAllMoves()

            //if its enemy's turn
            if (game.curTurn.type == "enemy") {
                let g = game.clone()
                g.takeTurn(null, null)
                this.queue.push(g)
            }
            else {
                //if its our turn
                for (let i = 0; i < options.length; i++) {
                    //note: these variables are attached to the original game, not the cloned one
                    let move = options[i];
                    let numTargets = move.getTargetSelections().length

                    for (let j = 0; j < numTargets; j++) {
                        let g = game.clone()
                        let newOptions = g.getAllMoves()
                        //debug(options.map(o => o.name))
                        let newMove = newOptions[i] //new move for this clone
                        let target = newMove.getTargetSelections()[j] //new target selection for this new move
                        g.takeTurn(newMove, target)
                        this.queue.push(g)
                    }

                }
            }
            
        }
        //we can ult as a follow up
        else {
            let options = game.getFollowUpMoves()
            for (let i = 0; i < options.length; i++) {
                //note: these variables are attached to the original game, not the cloned one
                let move = options[i];

                //if we are skipping this follow up
                if (move.type == "noaction") {
                    let g = game.clone()
                    let newMove = g.getFollowUpMoves()[i] //new move for this clone
                    g.followUp(newMove, undefined)
                    this.queue.push(g)
                }
                else {
                    //we cast something during this follow up
                    let numTargets = move.getTargetSelections().length

                    for (let j = 0; j < numTargets; j++) {
                        let g = game.clone()
                        let newOptions = g.getFollowUpMoves()
                        //debug(options.map(o => o.name))
                        let newMove = newOptions[i] //new move for this clone
                        let target = newMove.getTargetSelections()[j] //new target selection for this new move
                        g.followUp(newMove, target)
                        this.queue.push(g)
                    }
                }
                

            }
        }
        /*let options = game.getAllMoves() 
        debug("\nmoves", options.map(o => o.name))


        for (let i = 0; i < options.length; i++) {
            let move = options[i]; //temporary, we will recalculate this later after we clone the game

            if (move.type == "noaction") {
                let g = game.clone()
                let newMove = g.getAllMoves()[i] //new move for this clone
                g.takeTurn(newMove, undefined)
                this.queue.push(g)
            }
            else {
                let numTargets = move.getTargetSelections().length
                for (let j = 0; j < numTargets; j++) {
                    let g = game.clone()
                    let newOptions = g.getAllMoves()
                    debug(options.map(o => o.name))
                    let newMove = newOptions[i] //new move for this clone
                    let target = newMove.getTargetSelections()[j] //new target selection for this new move
                    g.takeTurn(newMove, target)
                    this.queue.push(g)
                }
            }
        }*/

    }

    findOptimal() {
        let calls = 0
        while (this.queue.length > 0) {
            calls ++

            if (calls%500 == 0) console.log("-----------------------------------\n# searched nodes", calls)
            
            
            
            this.processNextState();
            if (this.winner) {
                console.log("Winner found!")
                console.log("# searched nodes", calls)
                return this.winner
            }
            //this.printQueue()

            //empty queue -> search next cycle threshold
            if (this.queue.length == 0 && this.nextDepth.length > 0) {
                this.queue = this.nextDepth;
                this.nextDepth = []
                this.cycleThreshold --;
                debug("searching the next cycle threshold", this.cycleThreshold)
            }
            if (this.cycleThreshold < 0) break
        }
        debug("no winning path found in the tree")
        return null
    }

    //for testing purposes
    printQueue() {
        debug("CURRENT QUEUE:")
        debug(this.queue.map(q => {
            return q.actionHistory
        }))
    }
}

module.exports = SearchTree