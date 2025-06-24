
import AbstractEntity, {AnimationKeys} from "./AbstractEntity.js"
import {projectileFactory} from "./AbstractProjectile.js"
import AbstractUnit from "./AbstractUnit.js";
import Position from "../Position.js";

/**
 *
 * @param {string} name the tower name
 * @param {string} projectileName the name of the projectile used by the tower
 * @param {{cost: number, sellPrice: number, crystal: number, projectile: {speed: number, damage: number, range: number, cooldown: number}}[]} levels
 */
export function buildingFactory(name, projectileName, levels) {
    /**
     * @param {string} name the tower name
     * @param {string} projectileName the name of the projectile used by the tower
     * @param {{cost: number, sellPrice: number, crystal: number, projectile: {speed: number, damage: number, range: number, cooldown: number}}[]} levels
     * @param {number} currentLevel
     */
    function innerFactory(name, projectileName, levels, currentLevel) {
        if (! levels[currentLevel]) {
            return null
        }

        const levelName = currentLevel + 1

        const upgradesTo = innerFactory(name, projectileName, levels, currentLevel + 1)
        const projectile = projectileFactory(projectileName + levelName, levels[currentLevel].projectile.speed, levels[currentLevel].projectile.damage, levels[currentLevel].projectile.range, levels[currentLevel].projectile.cooldown)

        return class extends AbstractBuilding {
            /** @return {MovementCapability} */
            static get movements() { return AbstractEntity.movements }
            static get name() { return name + levelName }
            static get cost() { return levels[currentLevel].cost }
            static get sellPrice() { return levels[currentLevel].sellPrice }
            static get crystalOnBuild() { return levels[currentLevel].crystal }
            /** @return {typeof AbstractBuilding | null} */
            static get upgradesTo() { return upgradesTo }
            static get projectile() { return projectile }

            constructor(position) {
                super(position)
            }
        }
    }
    return innerFactory(name, projectileName, levels, 0);
}

export default class AbstractBuilding extends AbstractEntity {
    #attackCooldown = 0
    static get MAX_BUILD_DURATION() { return 3000 }

    /**
     * @param {Position} position
     */
    constructor(position) {
        super(position);
    }

    static get sellPrice() { return 0 }

    get cost() { return this.__proto__.constructor.cost }
    get sellPrice() { return this.__proto__.constructor.sellPrice }
    get crystalOnBuild() { return this.__proto__.constructor.crystalOnBuild }
    /** @return {typeof AbstractBuilding | null} */
    get upgradesTo() { return this.__proto__.constructor.upgradesTo }
    /** @return {typeof AbstractProjectile} */
    get projectile() { return this.__proto__.constructor.projectile }


    act(frameDuration, currentTime) {
        switch (this.animationDetails.name) {
            case AnimationKeys.IDLE: {
                this.#attackCooldown = this.#attackCooldown - frameDuration

                const targets = globalThis.game.getEntitiesCloseTo(this.position, this.projectile.range, AbstractUnit)
                if (targets.length !== 0) {
                    this.position.rotation = targets[0].position.angleTo(this.position)

                    if (this.#attackCooldown <= 0) {
                        this.#attackCooldown += this.projectile.cooldown

                        targets.forEach(entity => {
                            const missile = new this.projectile(new Position(this.position.x, this.position.y - 1));
                            missile.target = entity
                            globalThis.game.addEntity(missile)
                        })
                    }
                } else {
                    if (this.#attackCooldown < 0) {
                        this.#attackCooldown = 0
                    }
                }
                break
            }
            case AnimationKeys.SELL: {
                if (currentTime > this.animationDetails.end || currentTime > this.animationDetails.start + AbstractBuilding.MAX_BUILD_DURATION) {
                    globalThis.game.deleteEntity(this)
                }
                break
            }
        }


    }

    get texture() { return globalThis.options.texturePack.getTexture(`entities/buildings/${this.__proto__.constructor.name.toLowerCase()}`) }
}
