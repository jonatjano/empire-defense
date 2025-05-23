import Position from "../Position.js";
import {default as MovementCapability, MovementType} from "../MovementCapability.js";

/**
 * @callback EntityDeathCallback
 * @param {AbstractEntity} entity
 */

export class EntityFactory {
    /** @type {string} */
    name
    /** @type {number} */
    baseHp
    /** @type {number} */
    selectionRange
    /** @type {MovementCapability} */
    movements
    /** @type {Position} */
    position
    /** @type {EntityDeathCallback}*/
    deathCallback

    constructor() {
        this.name = ""
        this.baseHp = 1
        this.selectionRange = 0
        this.movements = new MovementCapability(0, 0, 0, MovementType.Walking)
        this.position = new Position(0, 0, 0)
        this.deathCallback = () => {}
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
    setBaseHp(value) { this.baseHp = value; return this }

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

    /**
     * @param {(AbstractEntity) => void} value
     * @return {this}
     */
    setDeathCallback(value) { this.deathCallback = value; return this }
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
    /** @type {EntityDeathCallback} */
    #deathCallback
    /** @type {number} */
    #animationIndex = 0
    /** @type {number} */
    #animationStartTime = 0
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
        this.#maxHp = factory.baseHp
        this.#selectionRange = factory.selectionRange
        this.#deathCallback = factory.deathCallback

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
        if (this.#hp <= 0) {
            globalThis.game.deleteEntity(this)
            this.#deathCallback(this)
        }
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
    /**
     * @param {string | number} value must be a valid name found in the `animations` property
     * @param {number} startingFrame frame when the animation starts
     */
    setAnimation(value, startingFrame) {
        return this.texture.then(texture => {
            let found = false;
            if (typeof value === "number") {
                if (value < texture.animations.length) {
                    this.#animationIndex = value
                    found = true
                }
            } else {
                for (let i = 0; i < texture.animations.length; i++) {
                    if (texture.animations[i].name === value) {
                        this.#animationIndex = i
                        found = true
                        break
                    }
                }
            }
            if (found) {
                this.#animationStartTime = texture.animations[this.#animationIndex].fixedStart ? startingFrame : 0
            }
        })
    }

    get currentAnimation() { return this.texture.then(texture => texture.animations[this.#animationIndex]) }

    /**
     * @param {number} frameTiming
     * @returns {Promise<{sx, sy, sw: number, sh: number}>}
     */
    getAnimationFramePosition(frameTiming) {
        return this.texture.then(texture => texture.getAnimationFramePosition(this.#animationIndex, this.#animationStartTime, frameTiming) )
    }
}
