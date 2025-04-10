import AbstractEntity, {EntityFactory} from "./AbstractEntity.js";
import AbstractProjectile from "./AbstractProjectile.js";
import {default as MovementCapability, MovementType} from "../MovementCapability.js";
import AbstractUnit from "./AbstractUnit.js";
import Position from "../Position.js";

export class BuildingFactory extends EntityFactory {
    static #movements = new MovementCapability(0, 3600, 360, MovementType.Unobstructed)
    /** @type {typeof AbstractProjectile} */
    projectile
    /** @type {typeof AbstractBuilding | null} */
    upgradesTo
    /** @type {number} */
    attackDelay
    /** @type {number} */
    attackRange
    /** @type {number} */
    cost
    /** @type {number} */
    crystalOnBuild

    constructor() {
        super()
        this.projectile = AbstractProjectile
        this.upgradesTo = null
        this.attackDelay = 0
        this.attackRange = 0
        this.cost = 0
        this.crystalOnBuild = 0
        this.setMovements(BuildingFactory.#movements)
    }

    /**
     * @param {Object} value
     * @return {this}
     */
    setProjectile(value) { this.projectile = value; return this }
    /**
     * @param {Object} value
     * @return {this}
     */
    setUpgradesTo(value) { this.upgradesTo = value; return this }
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
    /**
     * @param {number} value
     * @return {this}
     */
    setCost(value) { this.cost = value; return this }
    /**
     * @param {number} value
     * @return {this}
     */
    setCrystalOnBuild(value) { this.crystalOnBuild = value; return this }
}

export default class AbstractBuilding extends AbstractEntity {
    #attackCooldown = 0
    #projectile
    #upgradesTo
    #attackDelay
    #attackRange
    #cost
    #crystalOnBuild

    /**
     * @param {BuildingFactory} factory
     */
    constructor(factory) {
        super(factory);

        if (! ((new factory.projectile(new Position(0, 0))) instanceof AbstractProjectile)) {
            console.error(factory.projectile)
            throw "Object is not a valid projectile"
        }
        if (factory.upgradesTo !== null && ! ((new factory.upgradesTo()) instanceof AbstractBuilding)) {
            console.error(factory.upgradesTo)
            throw "Object is not a valid building"
        }
        this.#projectile = factory.projectile
        this.#upgradesTo = factory.upgradesTo
        this.#attackDelay = factory.attackDelay
        this.#attackRange = factory.attackRange
        this.#cost = factory.cost
        this.#crystalOnBuild = factory.crystalOnBuild
    }

    /**
     * @return {BuildingFactory}
     */
    static get factory() {
        return new BuildingFactory()
    }

    get cost() { return this.#cost }
    get crystalOnBuild() { return this.#crystalOnBuild }
    /** @return {typeof AbstractBuilding | null} */
    get upgradesTo() { return this.#upgradesTo }

    get attackRange() { return this.#attackRange }

    act(frameDuration) {
        this.#attackCooldown = this.#attackCooldown - frameDuration

        const targets = globalThis.game.getEntitiesCloseTo(this.position, this.#attackRange, AbstractUnit)
        if (targets.length !== 0) {
            this.position.rotation = targets[0].position.angleTo(this.position)

            if (this.#attackCooldown <= 0) {
                this.#attackCooldown += this.#attackDelay

                targets.forEach(entity => {
                    const missile = new this.#projectile(new Position(this.position.x, this.position.y - 1));
                    missile.target = entity
                    globalThis.game.addEntity(missile)
                })
            }
        } else {
            if (this.#attackCooldown < 0) {
                this.#attackCooldown = 0
            }
        }

    }

    get texture() { return globalThis.options.texturePack.getTexture(`entities/buildings/${this.__proto__.constructor.name.toLowerCase()}`) }
}
