import AbstractEntity, {EntityFactory} from "./AbstractEntity.js";
import AbstractProjectile from "./AbstractProjectile.js";
import {default as MovementCapability, MovementType} from "../MovementCapability.js";
import AbstractUnit from "./AbstractUnit.js";
import Position from "../Position.js";

export class BuildingFactory extends EntityFactory {
    static #movements = new MovementCapability(0, 3600, 360, MovementType.Unobstructed)
    /** @type {typeof AbstractProjectile} */
    projectile
    /** @type {number} */
    attackDelay
    /** @type {number} */
    attackRange

    constructor() {
        super()
        this.projectile = AbstractProjectile
        this.attackDelay = 0
        this.attackRange = 0
        this.setMovements(BuildingFactory.#movements)
    }

    /**
     * @param {Object} value
     * @return {this}
     */
    setProjectile(value) { this.projectile = value; return this }
    /**
     * @param {number} value
     * @return {this}
     */
    setAttackDelay(value) { this.attackDelay = value; return this }
    /**
     * @param {number} value
     * @return {this}
     */
    setAttackRange(value) { this.attackRange = value; return this }
}

export default class AbstractBuilding extends AbstractEntity {
    #attackCooldown = 0
    #projectile
    #attackDelay
    #attackRange

    /**
     * @param {BuildingFactory} factory
     */
    constructor(factory) {
        super(factory);

        if (! ((new factory.projectile(new Position(0, 0))) instanceof AbstractProjectile)) {
            console.error(factory.projectile)
            throw "Object is not a valid projectile"
        }
        this.#projectile = factory.projectile
        this.#attackDelay = factory.attackDelay
        this.#attackRange = factory.attackRange
    }

    /**
     * @return {BuildingFactory}
     */
    static get factory() {
        return new BuildingFactory()
    }

    act(frameDuration) {
        this.#attackCooldown = this.#attackCooldown - frameDuration

        const targets = globalThis.game.getEntitiesCloseTo(this.position, this.#attackRange, AbstractUnit)
        if (targets.length !== 0) {
            this.position.rotation = this.position.angleTo(targets[0].position)

            if (this.#attackCooldown <= 0) {
                this.#attackCooldown += this.#attackDelay

                targets.forEach(entity => {
                    const missile = new this.#projectile(new Position(this.position.x, this.position.y - 1));
                    missile.target = entity
                    globalThis.game.addEntity(missile)
                })
            }
        }

    }

    get texture() { return globalThis.options.texturePack.getTexture(`entities/buildings/${this.name}`) }
}
