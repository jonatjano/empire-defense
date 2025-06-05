import AbstractEntity, {EntityFactory} from "./AbstractEntity.js";
import MovementCapability, {MovementType} from "../MovementCapability.js";

export default class Vfx extends AbstractEntity {
    /** @type {typeof Vfx.UNTIL_ANIMATION_END} */
    static UNTIL_ANIMATION_END = Symbol("Vfx.UNTIL_ANIMATION_END");
    static MOVEMENTS = new MovementCapability(0.3, 360, 360, MovementType.Unobstructed)
    #lifetime = +Infinity

    /**
     * @param {Position} position
     * @param {number} start
     * @param {number | typeof Vfx.UNTIL_ANIMATION_END} duration
     * @param {string} animationName
     */
    constructor(position, start, duration, animationName) {
        super(new EntityFactory()
            .setPosition(position)
            .setMovements(Vfx.MOVEMENTS)
        );
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

    act(frameDuration) {
        this.#lifetime -= frameDuration
        if (this.#lifetime <= 0) {
            this.hit(Infinity)
        }
    }

    get texture() { return globalThis.options.texturePack.getTexture(`vfx`) }
}
