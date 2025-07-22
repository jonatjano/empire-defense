import MovementCapability, {MovementType} from "../MovementCapability.js"
import AbstractEntity, {AnimationKeys} from "./AbstractEntity.js"
import Position from "../Position.js";
import AbstractUnit from "./AbstractUnit.js";

export function projectileFactory(name, speed, damage, range, cooldown) {
    const movement = new MovementCapability(10, 3600, 360, MovementType.Unobstructed)
    return class extends AbstractProjectile {
        static #movements = movement
        static get movements() { return this.#movements }
        static get name() { return name }
        static get damage() { return damage }
        static get range() { return range }
        static get cooldown() { return cooldown }

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

    /** @type {Position | AbstractEntity} */
    #target

    constructor(position, target = null) {
        super(position);
        this.#target = target;
    }

    get target() { return this.#target }
    set target(value) { this.#target = value }

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
					    }
				    } else {
					    globalThis.game.getEntitiesCloseTo(this.position, ATTACK_RANGE, AbstractUnit)
						    .forEach(entity => {entity.hit(ATTACK_DAMAGE)})
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
