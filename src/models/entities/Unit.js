import Entity from "./Entity.js";
import Position from "../Position.js";

export default class Unit extends Entity {

    constructor(factory) {
        super(factory);
    }

    act(frameDuration) {
        if (this.target === undefined) {
            const pathFinding = globalThis.game.pathFinder.getNextTarget(this.position, this.movements.movementType)
            if (pathFinding === null) {
                return
            }
            this.target = Position.getTileCenterPosition(pathFinding.target)
        }

        while (frameDuration > 0) {
            const moveResult = Position.move(this.position, this.target, this.movements, frameDuration)
            this.position.teleport(moveResult.position)
            frameDuration = moveResult.remainingTime

            if (this.target.equals(this.position)) {
                if (globalThis.game.map.targets.find(target => this.position.equals(Position.getTileCenterPosition(target)))) {
                    // globalThis.game.deleteEntity(this)
                    // return
                    this.position.teleport(Position.getTileCenterPosition(globalThis.game.map.spawns[0]))
                }
                const pathFinding = globalThis.game.pathFinder.getNextTarget(this.position, this.movements.movementType)
                if (pathFinding === null) {
                    return
                }
                this.target = Position.getTileCenterPosition(pathFinding.target)
            }
        }
    }
}