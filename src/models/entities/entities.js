import AbstractUnit from "./AbstractUnit.js";
import AbstractBuilding from "./AbstractBuilding.js";
import MovementCapability, {MovementType} from "../MovementCapability.js";
import AbstractProjectile from "./AbstractProjectile.js";

const entities = Object.freeze({
    /*********************
     *      ENEMIES      *
     *********************/
    Footman: class extends AbstractUnit {
        static movements = new MovementCapability(2, 3600, 360, MovementType.Walking)
        constructor(position, deathCallback = () => {}) {
            super(
                entities.Footman.factory.setPosition(position).setMovements(entities.Footman.movements).setDeathCallback(deathCallback)
                    .setName("footman")
                    .setBaseHp(100)
                    .setKillReward(1)
            )
        }
    },
    Knight: class extends AbstractUnit {
        static movements = new MovementCapability(4, 3600, 360, MovementType.Walking)
        constructor(position, deathCallback = () => {}) {
            super(
                entities.Knight.factory.setPosition(position).setMovements(entities.Knight.movements).setDeathCallback(deathCallback)
                    .setName("knight")
                    .setBaseHp(100)
                    .setKillReward(1)
            )
        }
    },


    /*********************
     *    PROJECTILES    *
     *********************/
    Arrow: class extends AbstractProjectile {
        static movements = new MovementCapability(6, 3600, 360, MovementType.Walking)
        constructor(position) { super(entities.Arrow.factory.setName("arrow").setPosition(position).setMovements(entities.Arrow.movements)) }
    },


    /*********************
     *      TOWERS       *
     *********************/
    Archer: class extends AbstractBuilding {
        static cost = 5
        constructor(position) {super(entities.Archer.factory.setName("archer").setPosition(position).setProjectile(entities.Arrow).setAttackDelay(2000).setAttackRange(10))}
    }
})

export default entities
