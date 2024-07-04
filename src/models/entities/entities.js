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
        constructor(position) {super(entities.Footman.factory.setName("footman").setMaxHp(100).setPosition(position).setMovements(entities.Footman.movements))}
    },
    // Knight: class extends AbstractUnit {
    //     static movements = new MovementCapability(5, 3600, 360, MovementType.Walking)
    //     constructor(position) {super(Knight.factory.setName("knight").setMaxHp(100).setPosition(position).setMovements(Knight.movements))}
    // },


    /*********************
     *    PROJECTILES    *
     *********************/
    Arrow: class extends AbstractProjectile {
        static movements = new MovementCapability(5, 3600, 360, MovementType.Walking)
        constructor(position) { super(entities.Arrow.factory.setName("arrow").setPosition(position).setMovements(entities.Arrow.movements)) }
    },


    /*********************
     *      TOWERS       *
     *********************/
    Archer: class extends AbstractBuilding {
        constructor(position) {super(entities.Archer.factory.setName("archer").setPosition(position).setProjectile(entities.Arrow).setAttackDelay(2000).setAttackRange(10))}
    }
})

export default entities
