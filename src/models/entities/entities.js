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
                    .setBaseHp(1)
                    .setKillReward(1)
                    .setKillCrystalReward(1)
            )
        }
    },
    Footman: class extends AbstractUnit {
        static movements = new MovementCapability(1, 3600, 360, MovementType.Walking)
        constructor(position, deathCallback = () => {}) {
            super(
                entities.Knight.factory.setPosition(position).setMovements(entities.Knight.movements).setDeathCallback(deathCallback)
                    .setName("footman")
                    .setBaseHp(100)
                    .setKillReward(1)
                    .setKillCrystalReward(1)
            )
        }
    },
    Cannoneer: class extends AbstractUnit {
        static movements = new MovementCapability(0.75, 3600, 360, MovementType.Walking)
        constructor(position, deathCallback = () => {}) {
            super(
                entities.Knight.factory.setPosition(position).setMovements(entities.Knight.movements).setDeathCallback(deathCallback)
                    .setName("cannoneer")
                    .setBaseHp(100)
                    .setKillReward(2)
                    .setKillCrystalReward(2)
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
    Ram: class extends AbstractUnit {
        static movements = new MovementCapability(0.25, 3600, 60, MovementType.Walking)
        constructor(position, deathCallback = () => {}) {
            super(
                entities.Knight.factory.setPosition(position).setMovements(entities.Knight.movements).setDeathCallback(deathCallback)
                    .setName("ram")
                    .setBaseHp(100)
                    .setKillReward(6)
                    .setKillCrystalReward(5)
            )
        }
    },
    Champion: class extends AbstractUnit {
        static movements = new MovementCapability(2, 3600, 360, MovementType.Walking)
        constructor(position, deathCallback = () => {}) {
            super(
                entities.Knight.factory.setPosition(position).setMovements(entities.Knight.movements).setDeathCallback(deathCallback)
                    .setName("champion")
                    .setBaseHp(100)
                    .setKillReward(3)
                    .setKillCrystalReward(2)
            )
        }
    },
    Harpy: class extends AbstractUnit {
        static movements = new MovementCapability(2, 3600, 360, MovementType.Flying)
        constructor(position, deathCallback = () => {}) {
            super(
                entities.Knight.factory.setPosition(position).setMovements(entities.Knight.movements).setDeathCallback(deathCallback)
                    .setName("harpy")
                    .setBaseHp(100)
                    .setKillReward(5)
                    .setKillCrystalReward(5)
            )
        }
    },
    Elephant: class extends AbstractUnit {
        static movements = new MovementCapability(0.25, 3600, 60, MovementType.Walking)
        constructor(position, deathCallback = () => {}) {
            super(
                entities.Knight.factory.setPosition(position).setMovements(entities.Knight.movements).setDeathCallback(deathCallback)
                    .setName("elephant")
                    .setBaseHp(100)
                    .setKillReward(6)
                    .setKillCrystalReward(5)
            )
        }
    },


    /*********************
     *    PROJECTILES    *
     *********************/
    Arrow1: class extends AbstractProjectile {
        static movements = new MovementCapability(10, 3600, 360, MovementType.Unobstructed)
        constructor(position) {
            super(
                entities.Arrow1.factory
                    .setName("arrow1")
                    .setPosition(position)
                    .setMovements(entities.Arrow1.movements)
            )
        }
    },

    CannonBall1: class extends AbstractProjectile {
        static movements = new MovementCapability(8, 3600, 360, MovementType.Unobstructed)
        constructor(position) {
            super(
                entities.CannonBall1.factory
                    .setName("cannonball1")
                    .setPosition(position)
                    .setMovements(entities.CannonBall1.movements)
            )
        }
    },


    /*********************
     *      TOWERS       *
     *********************/
    Archery1: class extends AbstractBuilding {
        static get cost() { return 5 }
        constructor(position) {
            super(
                entities.Archery1.factory
                    .setName("archery1")
                    .setPosition(position)
                    .setCrystalOnBuild(1)
                    .setProjectile(entities.Arrow1)
                    .setAttackDelay(2000)
                    .setAttackRange(5)
            )
        }
    },
    Archery2: class extends AbstractBuilding {
        static get cost() { return 4 }
        constructor(position) {
            super(
                entities.Archery2.factory
                    .setName("archery2")
                    .setPosition(position)
                    .setCrystalOnBuild(1)
                    .setProjectile(entities.Arrow1)
                    .setAttackDelay(2000)
                    .setAttackRange(10)
            )
        }
    },


    Cannon1: class extends AbstractBuilding {
        static get cost() { return 20 }
        constructor(position) {
            super(
                entities.Cannon1.factory
                    .setName("cannon1")
                    .setPosition(position)
                    .setCrystalOnBuild(2)
                    .setProjectile(entities.CannonBall1)
                    .setAttackDelay(5000)
                    .setAttackRange(10)
            )
        }
    }
}

export default entities
