import MovementCapability, {MovementType} from "../MovementCapability.js"
import AbstractEntity, {AnimationKeys} from "./AbstractEntity.js"
import Position from "../Position.js";
import AbstractUnit from "./AbstractUnit.js";

/**
 * create a projectile class with the given parameters
 * @param {string} name
 * @param {number} speed
 * @param {number} damage
 * @param {number} range
 * @param {number} cooldown
 * @param {(target?: AbstractEntity) => void} onHitCb
 * @return {class extends AbstractProjectile}
 */
export function projectileFactory(name, speed, damage, range, cooldown, onHitCb) {
    const movement = new MovementCapability(10, 3600, 360, MovementType.Unobstructed)
    return class extends AbstractProjectile {
        static #movements = movement
        static get movements() { return this.#movements }
        static get name() { return name }
        static get damage() { return damage }
        static get range() { return range + 0.5 }
        static get cooldown() { return cooldown }
		/** @return {(target?: AbstractEntity) => void} */
		static get onHitCb() { return onHitCb }

        constructor(position, target = null) {
            super(position, target)
        }
    }
}

export default class AbstractProjectile extends AbstractEntity {
    static get damage() { return 1 }
    static get range() { return 1 }
    static get cooldown() { return 1000 }
    get damage() { return this.__proto__.constructor.damage }
    get range() { return this.__proto__.constructor.range }
    get cooldown() { return this.__proto__.constructor.cooldown }
	get onHitCb() { return this.__proto__.constructor.onHitCb }

    /** @type {Position | AbstractEntity} */
    #target

    constructor(position, target = null) {
        super(position);
        this.#target = target;
    }

    get target() { return this.#target }
    set target(value) { this.#target = value }

	/**
	 * Executes the actions for the current frame
	 * @param {number} frameDuration time since last frame
	 * @param {number} currentTime
	 */
    act(frameDuration, currentTime) {
	    switch (this.animationDetails.name) {
		    case AnimationKeys.IDLE: {
			    const ATTACK_RANGE = this.range
			    const ATTACK_DAMAGE = this.damage

			    const targetIsEntity = this.target instanceof AbstractEntity
			    const targetPosition = targetIsEntity ? this.target.position : this.position

			    const moveResult = Position.move(this.position, targetPosition, this.movements, frameDuration)
			    this.position.teleport(moveResult.position)

			    if (this.position.equals(targetPosition)) {
				    if (targetIsEntity) {
					    if (this.target.hp > 0) {
						    this.target.hit(ATTACK_DAMAGE)
							this.onHitCb(this.target)
					    }
				    } else {
					    globalThis.game.getEntitiesCloseTo(this.position, ATTACK_RANGE, AbstractUnit)
						    .forEach(entity => {
								entity.hit(ATTACK_DAMAGE)
								this.onHitCb(entity)
							})
				    }
					this.setAnimation(AnimationKeys.HIT, globalThis.game.currentFrameTiming)
						.then(success => {
							if (! success) {
								globalThis.game.deleteEntity(this)
							}
						})
			    }
			    break
		    }
		    case AnimationKeys.HIT: {
			    if (currentTime > this.animationDetails.end) {
				    globalThis.game.deleteEntity(this)
			    }
			    break
		    }
	    }
    }

    get texture() { return globalThis.options.texturePack.getTexture(`entities/projectiles/${this.name.toLowerCase()}`) }
}
