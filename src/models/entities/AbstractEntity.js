import {default as MovementCapability, MovementType} from "../MovementCapability.js"
import Position from "../Position.js"

export const AnimationKeys = Object.freeze({
    /* common (except unit) */
    IDLE: "idle",

    /* icons and buildings */
    HOVER: "hover",
    CLICK: "click",

    /* units */
    WALK: "walk",
    DEAD: "dead",

    /* buildings */
    SHOOT: "shoot",
    UPGRADE: "upgrade",
    SELL: "sell",

    /* projectiles */
    HIT: "hit",

    /* VFX */
    SPAWN_ARROW: "spawnArrow",
    TARGET_ARROW: "targetArrow"
})

/**
 * @callback EntityDeathCallback
 * @param {AbstractEntity} entity
 * @param {boolean} giveReward
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
    /** @type {string} */
    #animationName = AnimationKeys.IDLE
    /** @type {number} */
    #animationStartTime = 0
    /** @type {number} */
    #animationEndTime = 0
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
     * @param {number} currentTime
     * @return {void}
     */
    act(frameDuration, currentTime) {
        throw new Error("AbstractEntity initialised")
    }

	callDeathCallback(giveReward) {
		this.#deathCallback(this, giveReward)
		this.#deathCallback = AbstractEntity.defaultDeathCallback
	}

	hit(damage) {
		this.abstractHit(damage, true)
		if (this.#hp <= 0) {
			this.callDeathCallback(true)
		}
	}

    abstractHit(damage, deleteEntity = true) {
        this.#hp -= damage
        if (this.#hp <= 0) {
			if (deleteEntity) {
				globalThis.game.deleteEntity(this)
			}
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

    /**
     * @param {string} name must be a valid name found in the `animations` property
     * @param {number} startingFrame frame when the animation starts
     * @return {Promise<boolean>} indicated if the animation was successfully set
     */
    setAnimation(name, startingFrame) {
        return this.texture.then(texture => {
            if (texture.animations[name]) {
                this.#animationName = name
            }
            this.#animationStartTime =
                texture.animations[this.#animationName]?.fixedStart ?
                    startingFrame :
                    0
            this.#animationEndTime =
                texture.animations[this.#animationName]?.fixedStart ?
                    texture.animations[this.#animationName].timings.reduce((acc, frame) => acc + frame, this.#animationStartTime) :
                    Infinity
            return this.#animationName === name
        })
    }

    get animationDetails() { return {name: this.#animationName, start: this.#animationStartTime, end: this.#animationEndTime} }
    get currentAnimation() { return this.texture.then(texture => texture.animations[this.#animationName]) }

    /**
     * @param {number} frameTiming
     * @returns {Promise<{sx, sy, sw: number, sh: number}>}
     */
    getAnimationFramePosition(frameTiming) {
        return this.texture.then(texture => texture.getAnimationFramePosition(this.#animationName, this.#animationStartTime, frameTiming) )
    }
}
