
import AbstractEntity, {AnimationKeys} from "./AbstractEntity.js"
import {projectileFactory} from "./AbstractProjectile.js"
import Position from "../Position.js";

const rangeBoostLevels = [1, 1.33, 1.5]

/**
 *
 * @param {string} name the tower name
 * @param {string} projectileName the name of the projectile used by the tower
 * @param {() => AbstractEntity[]} targetingFunction
 * @param {(level?: number) => (target?: AbstractEntity) => void} onHitCb
 * @param {{cost: number, buildDuration: number, sellPrice: number, crystal: number, projectile: {speed: number, damage: number, range: number, cooldown: number}}[]} levels
 */
export function buildingFactory(name, projectileName, targetingFunction, onHitCb, levels) {
    /**
     * @param {string} name the tower name
     * @param {string} projectileName the name of the projectile used by the tower
     * @param {() => AbstractEntity[]} targetingFunction
     * @param {{cost: number, buildDuration: number, sellPrice: number, crystal: number, projectile: {speed: number, damage: number, range: number, cooldown: number}}[]} levels
     * @param {number} currentLevel
     */
    function innerFactory(name, projectileName, targetingFunction, levels, currentLevel) {
        if (! levels[currentLevel]) {
            return null
        }

        const levelName = currentLevel + 1

        const upgradesTo = innerFactory(name, projectileName, targetingFunction, levels, currentLevel + 1)
        const projectile = projectileFactory(projectileName + levelName, levels[currentLevel].projectile.speed, levels[currentLevel].projectile.damage, levels[currentLevel].projectile.range, levels[currentLevel].projectile.cooldown, onHitCb(currentLevel))

        return class extends AbstractBuilding {
            /** @return {MovementCapability} */
            static get movements() { return AbstractEntity.movements }
            static get name() { return name + levelName }
            static get cost() { return levels[currentLevel].cost }
	        static get buildDuration() { return levels[currentLevel].buildDuration }
            static get sellPrice() { return levels[currentLevel].sellPrice }
            static get crystalOnBuild() { return levels[currentLevel].crystal }
            /** @return {typeof AbstractBuilding | null} */
            static get upgradesTo() { return upgradesTo }
            static get projectile() { return projectile }

            constructor(position) {
                super(position, targetingFunction)
            }
        }
    }
    return innerFactory(name, projectileName, targetingFunction, levels, 0);
}

export default class AbstractBuilding extends AbstractEntity {
	static get MAX_SELL_DURATION() { return 3000 }
    #attackCooldown = 0
	#builtTime = 0
    #targetingFunction
    #rangeBoost = {
        level: 0,
        timestamp: 0
    }

    /**
     * @param {Position} position
     * @param {() => AbstractEntity[]} targetingFunction
     */
    constructor(position, targetingFunction) {
        super(position);
		this.#builtTime = globalThis.game.currentFrameTiming
        this.#targetingFunction = targetingFunction
    }

    static get sellPrice() { return 0 }

    get cost() { return this.__proto__.constructor.cost }
	get buildDuration() { return this.__proto__.constructor.buildDuration }
    get sellPrice() { return this.__proto__.constructor.sellPrice }
    get crystalOnBuild() { return this.__proto__.constructor.crystalOnBuild }
    /** @return {typeof AbstractBuilding | null} */
    get upgradesTo() { return this.__proto__.constructor.upgradesTo }
    /** @return {typeof AbstractProjectile} */
    get projectile() { return this.__proto__.constructor.projectile }

	/**
	 * @returns {number} value is not capped to 100
	 */
	get buildPercent() { return (globalThis.game.currentFrameTiming - this.#builtTime) / this.buildDuration * 100 }

    act(frameDuration, currentTime) {
        switch (this.animationDetails.name) {
	        case AnimationKeys.SHOOT: {
		        if (currentTime > this.animationDetails.end || currentTime > this.animationDetails.start + this.projectile.cooldown) {
			        this.setAnimation(AnimationKeys.IDLE, globalThis.game.currentFrameTiming)
		        }
	        }
	        // fallthrough
	        case AnimationKeys.IDLE: {
				if (this.#builtTime + this.buildDuration < globalThis.game.currentFrameTiming) {
					this.#attackCooldown = this.#attackCooldown - frameDuration

					const targets = this.#targetingFunction.call(this)
					if (targets.length !== 0) {
						this.position.rotation = targets[0].position.angleTo(this.position)

						if (this.#attackCooldown <= 0) {
							this.#attackCooldown += this.projectile.cooldown
							this.#shootAtTargets(targets)
							this.setAnimation(AnimationKeys.SHOOT, globalThis.game.currentFrameTiming)
						}
					} else {
						if (this.#attackCooldown < 0) {
							this.#attackCooldown = 0
						}
					}
				}
                break
            }
	        case AnimationKeys.UPGRADE: {
		        if (currentTime > this.animationDetails.end || currentTime > this.animationDetails.start + this.buildDuration) {
			        this.setAnimation(AnimationKeys.IDLE, globalThis.game.currentFrameTiming)
		        }
		        break
	        }
            case AnimationKeys.SELL: {
                if (currentTime > this.animationDetails.end || currentTime > this.animationDetails.start + AbstractBuilding.MAX_SELL_DURATION) {
                    globalThis.game.deleteEntity(this)
                }
                break
            }
        }
    }

	/**
	 * @param {AbstractEntity[]} targets
	 */
	#shootAtTargets(targets) {
		for (const entity of targets) {
			const missile = new this.projectile(new Position(this.position.x, this.position.y - 1));
			missile.target = entity
			globalThis.game.addEntity(missile)
		}
	}

    set rangeBoost(value) { this.#rangeBoost = {
        level: value,
        timestamp: globalThis.game.currentFrameTiming
    } }
    get range() {
        if (this.#rangeBoost.timestamp + 200 < globalThis.game.currentFrameTiming) {
            this.#rangeBoost = {level: 0, timestamp: 0}
        }
        return this.projectile.range * rangeBoostLevels[this.#rangeBoost.level] + 0.5
    }


    get texture() { return globalThis.options.texturePack.getTexture(`entities/buildings/${this.__proto__.constructor.name.toLowerCase()}`) }
}
