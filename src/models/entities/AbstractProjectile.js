import AbstractEntity from "./AbstractEntity.js";
import Position from "../Position.js";
import AbstractUnit from "./AbstractUnit.js";

export default class AbstractProjectile extends AbstractEntity {

    constructor(factory) {
        super(factory);
    }

    act(frameDuration, currentTime) {
        const ATTACK_RANGE = 2
        const ATTACK_DAMAGE = 10

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
            globalThis.game.deleteEntity(this)
        }
    }

    get texture() { return globalThis.options.texturePack.getTexture(`entities/projectiles/${this.__proto__.constructor.name.toLowerCase()}`) }
}
