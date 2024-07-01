import Entity from "./Entity.js";
import Position from "../Position.js";
import Unit from "./Unit.js";

export default class Projectile extends Entity {

    constructor(factory) {
        super(factory);
    }

    act(frameDuration) {
        const ATTACK_RANGE = 2
        const ATTACK_DAMAGE = 1

        const targetIsEntity = this.target instanceof Entity
        const targetPosition = targetIsEntity ? this.target.position : this.position

        const moveResult = Position.move(this.position, targetPosition, this.movements, frameDuration)
        this.position.teleport(moveResult.position)

        if (this.position.equals(targetPosition)) {
            if (targetIsEntity) {
                this.target.hit(ATTACK_DAMAGE)
            } else {
                globalThis.game.getEntitiesCloseTo(this.position, ATTACK_RANGE, Unit)
                    .forEach(entity => {entity.hit(ATTACK_DAMAGE)})
            }
            globalThis.game.deleteEntity(this)
        }
    }

    get texture() { return globalThis.options.texturePack.getTexture(`entities/projectiles/${this.name}`) }
}