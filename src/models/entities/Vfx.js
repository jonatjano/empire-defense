import AbstractEntity from "./AbstractEntity.js";
import MovementCapability, {MovementType} from "../MovementCapability.js";

/**
 * an entity with no interaction used to play an animation of the vfx image
 */
export default class Vfx extends AbstractEntity {
    /**
     * used as a duration parameter to indicate that the vfx should play the full animation once
     * @type {typeof Vfx.UNTIL_ANIMATION_END}
     */
    static UNTIL_ANIMATION_END = Symbol("Vfx.UNTIL_ANIMATION_END");
    static #movements = new MovementCapability(0.3, 360, 360, MovementType.Unobstructed)
    static get movements() { return this.#movements }
    #lifetime = +Infinity

    /**
     * @param {Position} position
     * @param {number} start
     * @param {number | typeof Vfx.UNTIL_ANIMATION_END} duration
     * @param {string} animationName
     * @param {EntityDeathCallback} [deathCallback] a callback to be called when the vfx is done playing
     */
    constructor(position, start, duration, animationName, deathCallback = AbstractEntity.defaultDeathCallback) {
        super(position, deathCallback, 1);
        this.setAnimation(animationName, start)
        globalThis.options.texturePack.getTexture(`vfx`).then(texture => {
            if (! texture.animations[animationName]) {
                this.#lifetime = 0
            } else {
                if (duration === Vfx.UNTIL_ANIMATION_END) {
                    this.#lifetime = texture.animations[animationName].timings.reduce((a, b) => a + b, 0);
                } else {
                    this.#lifetime = duration
                }
            }
        })
    }

    /**
     * once the lifetime is reached, the vfx removes itself from the game
     * @param {number} frameDuration
     * @param {number} currentTime
     */
    act(frameDuration, currentTime) {
        this.#lifetime -= frameDuration
        if (this.#lifetime <= 0) {
            this.hit(Infinity)
        }
    }

    get texture() { return globalThis.options.texturePack.getTexture(`vfx`) }
}
