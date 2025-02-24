import AbstractUnit from "./AbstractUnit.js";
import AbstractBuilding from "./AbstractBuilding.js";
import MovementCapability, {MovementType} from "../MovementCapability.js";
import AbstractProjectile from "./AbstractProjectile.js";

const entities = {
    /*********************
     *      ENEMIES      *
     *********************/
    Squire: class extends AbstractUnit {
        static movements = new MovementCapability(1, 3600, 360, MovementType.Walking)
        constructor(position, deathCallback = () => {}) {
            super(
                entities.Squire.factory.setPosition(position).setMovements(entities.Squire.movements).setDeathCallback(deathCallback)
                    .setName("squire")
                    .setBaseHp(100)
                    .setKillReward(1)
                    .setKillCrystalReward(1)
            )
        }
    },
    Knight: class extends AbstractUnit {
        static movements = new MovementCapability(2, 3600, 360, MovementType.Walking)
        constructor(position, deathCallback = () => {}) {
            super(
                entities.Knight.factory.setPosition(position).setMovements(entities.Knight.movements).setDeathCallback(deathCallback)
                    .setName("knight")
                    .setBaseHp(100)
                    .setKillReward(2)
                    .setKillCrystalReward(2)
            )
        }
    },


    /*********************
     *    PROJECTILES    *
     *********************/
    Arrow1: class extends AbstractProjectile {
        static movements = new MovementCapability(6, 3600, 360, MovementType.Walking)
        constructor(position) {
            super(
                entities.Arrow1.factory
                    .setName("archery1")
                    .setPosition(position)
                    .setMovements(entities.Arrow1.movements)
            )
        }
    },


    /*********************
     *      TOWERS       *
     *********************/
    Archery1: class extends AbstractBuilding {
        constructor(position) {
            super(
                entities.Archery1.factory
                    .setName("archery1")
                    .setPosition(position)
                    .setCost(5)
                    .setCrystalOnBuild(1)
                    .setProjectile(entities.Arrow1)
                    .setAttackDelay(2000)
                    .setAttackRange(10)
            )
        }
    }
}

export default entities
