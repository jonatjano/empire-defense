import AbstractEntity, {EntityFactory} from "./AbstractEntity.js";
import Position from "../Position.js";

export class UnitFactory extends EntityFactory {
    /** @type {number} */
    killReward

    constructor() {
        super()
        this.killReward = 0
    }

    /**
     * @param {number} value
     * @return {this}
     */
    setKillReward(value) { this.killReward = value; return this }
}

export default class AbstractUnit extends AbstractEntity {
    /** @type {number} */
    #killReward

    constructor(factory) {
        super(factory)
        this.#killReward = factory.killReward
    }

    /**
     * @return {UnitFactory}
     */
    static get factory() {
        return new UnitFactory()
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
                    // TODO
                    // this.hit(Infinity)
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

    get killReward() { return this.#killReward }

    get texture() { return globalThis.options.texturePack.getTexture(`entities/units/${this.name}`) }
}
