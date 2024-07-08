import AbstractEntity from "./AbstractEntity.js";
import Position from "../Position.js";
import AbstractUnit from "./AbstractUnit.js";

export default class AbstractProjectile extends AbstractEntity {

    constructor(factory) {
        super(factory);
    }

    act(frameDuration) {
        const ATTACK_RANGE = 2
        const ATTACK_DAMAGE = 1

        const targetIsEntity = this.target instanceof AbstractEntity
        const targetPosition = targetIsEntity ? this.target.position : this.position

        if (targetIsEntity && this.target.hp <= 0) {
            globalThis.game.deleteEntity(this)
            return
        }

        const moveResult = Position.move(this.position, targetPosition, this.movements, frameDuration)
        this.position.teleport(moveResult.position)

        if (this.position.equals(targetPosition)) {
            if (targetIsEntity) {
                this.target.hit(ATTACK_DAMAGE)
            } else {
                globalThis.game.getEntitiesCloseTo(this.position, ATTACK_RANGE, AbstractUnit)
                    .forEach(entity => {entity.hit(ATTACK_DAMAGE)})
            }
            globalThis.game.deleteEntity(this)
        }
    }

    get texture() { return globalThis.options.texturePack.getTexture(`entities/projectiles/${this.name}`) }
}
