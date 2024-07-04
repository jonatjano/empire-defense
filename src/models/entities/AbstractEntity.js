/**
 * @typedef {{
 *     name: string,
 *     baseHp: number,
 *     selectionRange: number,
 *     movements: MovementCapability,
 *     position: Position
 * }} EntityConfiguration
 */
import Position from "../Position.js";
import {default as MovementCapability, MovementType} from "../MovementCapability.js";

export class EntityFactory {
    /** @type {string} */
    name
    /** @type {number} */
    maxHp
    /** @type {number} */
    selectionRange
    /** @type {MovementCapability} */
    movements
    /** @type {Position} */
    position
    constructor() {
        this.name = ""
        this.maxHp = 1
        this.selectionRange = 0
        this.movements = new MovementCapability(0, 0, 0, MovementType.Walking)
        this.position = new Position(0, 0, 0)
    }

    /**
     * @param {string} value
     * @return {this}
     */
    setName(value) { this.name = value; return this }

    /**
     * @param {number} value
     * @return {this}
     */
    setMaxHp(value) { this.maxHp = value; return this }

    /**
     * @param {number} value
     * @return {this}
     */
    setSelectionRange(value) { this.selectionRange = value; return this }

    /**
     * @param {MovementCapability} value
     * @return {this}
     */
    setMovements(value) { this.movements = value; return this }

    /**
     * @param {Position} value
     * @return {this}
     */
    setPosition(value) { this.position = value; return this }
}

export default class AbstractEntity {
    #name
    #hp
    #maxHp
    #selectionRange
    /** @type {MovementCapability} */
    #movements
    /** @type {Position} */
    #position
    /** @type {Position | AbstractEntity} */
    #target
    /** @type {number} */
    #id
    /** @type {number} */
    static #idGenerator = 0

    static get factory() {
        return new EntityFactory()
    }

    /**
     * @param {EntityFactory} factory
     */
    constructor(factory) {
        this.#id = AbstractEntity.#idGenerator++
        this.#name = factory.name
        this.#position = Position.getTileCenterPosition(factory.position)
        this.#movements = factory.movements
        this.#maxHp = factory.maxHp
        this.#selectionRange = factory.selectionRange

        this.#hp = this.#maxHp
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
        if (this.#hp <= 0) { globalThis.game.deleteEntity(this) }
        else if (this.#hp > this.#maxHp) { this.#hp = this.#maxHp }
    }

    get name() { return this.#name }
    /** @return {Position | AbstractEntity} */
    get target() { return this.#target }
    set target(value) { this.#target = value }
    /** @return {Position} */
    get position() { return this.#position }
    /** @return {MovementCapability} */
    get movements() { return this.#movements }

    get hp() { return this.#hp }
    get maxHp() { return this.#maxHp }

    /** @return {Promise<Texture>} */
    get texture() { throw new Error("AbstractEntity initialised") }
}
