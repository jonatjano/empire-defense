import Position from "../Position.js";
import {default as MovementCapability, MovementType} from "../MovementCapability.js";

/**
 * @callback EntityDeathCallback
 * @param {AbstractEntity} entity
 */

export default class AbstractEntity {
    /** @type {number} */
    #maxHp
    /** @type {number} */
    #hp
    /** @type {EntityDeathCallback} */
    #deathCallback
    /** @type {Position} */
    #position

    /** @type {number} */
    #id = AbstractEntity.#idGenerator++
    /** @type {number} */
    static #idGenerator = 0

    static defaultDeathCallback = () => {}
    static #movements = new MovementCapability(0, 0, 0, MovementType.Walking)

    /**
     * @param {Position} position
     * @param {EntityDeathCallback} deathCallback
     * @param {number} [maxHp]
     */
    constructor(position, deathCallback = AbstractEntity.defaultDeathCallback, maxHp = Infinity) {
        this.#position = Position.getTileCenterPosition(position)
        this.#deathCallback = deathCallback

        this.#maxHp = maxHp
        this.#hp = maxHp
    }


    /**
     * move toward target
     * @param {number} frameDuration
     * @return {void}
     */
    act(frameDuration) {
        throw new Error("AbstractEntity initialised")
    }

    hit(damage) {
        this.#hp -= damage
        if (this.#hp <= 0) {
            globalThis.game.deleteEntity(this)
            this.#deathCallback(this)
        }
        else if (this.#hp > this.#maxHp) { this.#hp = this.#maxHp }
    }

    get hp() { return this.#hp }
    get maxHp() { return this.#maxHp }

    /** @return {Position} */
    get position() { return this.#position }

    /** @return {Promise<Texture>} */
    get texture() { throw new Error("AbstractEntity initialised") }

    get name() { return this.__proto__.constructor.name }
    get movements() { return this.__proto__.constructor.movements }
    static get name() { return "AbstractEntity" }
    /** @return {MovementCapability} */
    static get movements() { return this.#movements }
}
