import AbstractEntity, {AnimationKeys} from "./AbstractEntity.js"
import Position from "../Position.js";

/**
 * create a unit class with the given parameters
 * @param {string} name
 * @param {MovementCapability} movement
 * @param {number} killReward
 * @param {number} killCrystalReward
 * @param {(wave: number) => number} hpFunction
 * @return {class extends AbstractUnit}
 */
export function unitFactory(name, movement, killReward, killCrystalReward, hpFunction) {
    return class extends AbstractUnit {
        static #movements = movement
        static get movements() { return this.#movements }
        static get name() { return name; }
        static get killReward() { return killReward }
        static get killCrystalReward() { return killCrystalReward }

        constructor(position, deathCallback, wave) {
            super(position, deathCallback, hpFunction(wave));
        }
    }
}

/**
 * an enemy
 */
export default class AbstractUnit extends AbstractEntity {
    static get killReward() { return 0 }
    get killReward() { return this.__proto__.constructor.killReward }
    static get killCrystalReward() { return 0 }
    get killCrystalReward() { return this.__proto__.constructor.killCrystalReward }

    constructor(position, deathCallback, maxHp) {
        super(position, deathCallback, maxHp);
    }

	/**
	 * called when the unit is hit by an attack
	 * @param {number} damage
	 */
	hit(damage) {
		this.abstractHit(damage, false)
		if (this.hp <= 0) {
			this.setAnimation(AnimationKeys.DEAD, globalThis.game.currentFrameTiming)
				.catch(() => { this.hit(Infinity) })
				.finally(() => {
					this.callDeathCallback(true)
				})
		}
	}

	/**
	 * Executes the actions for the current frame
	 * @param {number} frameDuration time since last frame
	 * @param {number} currentTime
	 */
    act(frameDuration, currentTime) {
	    switch (this.animationDetails.name) {
		    case AnimationKeys.WALK: {
				// if there are no targets, find one
			    if (this.target === undefined) {
				    const pathFinding = globalThis.game.pathFinder.getNextTarget(this.position, this.movements.movementType)
					// if there are still no targets, skip the frame
				    if (pathFinding === null) {
					    return
				    }
					// correct the target to the center of the tile
				    this.target = Position.getTileCenterPosition(pathFinding.target)
			    }

				// while the unit can still act
			    while (frameDuration > 0) {
					// if we are slowed, reduce the speed by half
					const speedFactor = this.slowDuration > 0 ? 0.5 : 1;
					const actionTime = this.slowDuration > 0 ? Math.min(this.slowDuration, frameDuration) : frameDuration;
				    const moveResult = Position.move(this.position, this.target, this.movements, actionTime * speedFactor)
					// move the unit to the position
				    this.position.teleport(moveResult.position)
					// reduce the remaining time by the time we used
				    frameDuration = moveResult.remainingTime
					this.slowDuration -= actionTime - moveResult.remainingTime

					// if we reached the target, find a new one
				    if (this.target.equals(this.position)) {
						// if the target is the end of the map, kill the unit and remove a life from the player
					    if (globalThis.game.map.targets.find(target => this.position.equals(Position.getTileCenterPosition(target)))) {
							globalThis.game.life--
							globalThis.game.deleteEntity(this, true)
							this.callDeathCallback(false)
							return
					    }
						// else find a new target
					    const pathFinding = globalThis.game.pathFinder.getNextTarget(this.position, this.movements.movementType)
					    if (pathFinding === null) {
						    return
					    }
					    this.target = Position.getTileCenterPosition(pathFinding.target)
				    }
			    }
			    break
		    }
		    case AnimationKeys.DEAD: {
			    if (currentTime > this.animationDetails.end) {
				    this.abstractHit(Infinity)
			    }
			    break
		    }
	    }
    }

    get texture() { return globalThis.options.texturePack.getTexture(`entities/units/${this.__proto__.constructor.name.toLowerCase()}`) }
}
