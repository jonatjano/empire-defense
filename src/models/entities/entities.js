import {buildingFactory} from "./AbstractBuilding.js"
import MovementCapability, {MovementType} from "../MovementCapability.js";
import AbstractUnit, {unitFactory} from "./AbstractUnit.js"

/**
 * @param {(AbstractUnit) => boolean} customFilter
 * @this AbstractBuilding
 */
function targetClosestUnit(customFilter = () => true) {
    return function() {
        return globalThis.game.getEntitiesCloseTo(this.position, this.projectile.range, AbstractUnit)
            .filter(customFilter)
            .sort((a, b) =>
                a.position.distanceFrom(this.position) - b.position.distanceFrom(this.position)
            )
            .slice(0, 1)
            ?? []
    }
}

const entities = {
    /*********************
     *      ENEMIES      *
     *********************/
    Squire: unitFactory(
        "squire", 
        new MovementCapability(1, 3600, 360, MovementType.Walking), 
        1, 1, 
            wave => 180 + wave - wave
    ),
    Footman: unitFactory(
        "footman",
        new MovementCapability(1, 3600, 360, MovementType.Walking),
        1, 1,
        wave => 1000 + wave - wave
    ),
    Cannoneer: unitFactory(
        "cannoneer",
        new MovementCapability(0.75, 3600, 360, MovementType.Walking),
        2, 2,
        wave => 1000 + wave - wave
    ),
    Knight: unitFactory(
        "knight",
        new MovementCapability(2, 3600, 360, MovementType.Walking),
        2, 2,
        wave => 1000 + wave - wave
    ),
    Ram: unitFactory(
        "ram",
        new MovementCapability(0.25, 3600, 60, MovementType.Walking),
        6, 5,
        wave => 1000 + wave - wave
    ),
    Champion: unitFactory(
        "champion",
        new MovementCapability(2, 3600, 360, MovementType.Walking),
        3, 2,
        wave => 1000 + wave - wave
    ),
    Harpy: unitFactory(
        "harpy",
        new MovementCapability(2, 3600, 360, MovementType.Flying),
        5, 5,
        wave => 1000 + wave - wave
    ),
    Elephant: unitFactory(
        "elephant",
        new MovementCapability(0.25, 3600, 60, MovementType.Walking),
        6, 5,
        wave => 1000 + wave - wave
    ),

    /*********************
     *      TOWERS       *
     *********************/

    Debug: buildingFactory("debug", "debugP", function () { return globalThis.game.getEntitiesCloseTo(this.position, this.projectile.range, AbstractUnit) }, [
        {cost: 1, buildDuration: 1500, sellPrice: 2, crystal: 10, projectile: {speed: 10, damage: 1000, range: 10, cooldown: 1000}},
    ]),

    Archery: buildingFactory("archery", "arrow", targetClosestUnit(), [
        {cost: 5, buildDuration: 3000, sellPrice: 2, crystal: 1, projectile: {speed: 10, damage: 100, range: 10, cooldown: 1000}},
        {cost: 4, buildDuration: 3000, sellPrice: 2, crystal: 1, projectile: {speed: 10, damage: 100, range: 10, cooldown: 1000}},
        // {cost: 4, buildDuration: 3000, sellPrice: 2, crystal: 1, projectile: {speed: 10, damage: 100, range: 1, cooldown: 500}},
    ]),

    Cannon: buildingFactory("cannon", "cannonball", targetClosestUnit(unit => unit.movements.movementType === MovementType.Walking), [
        {cost: 20, buildDuration: 3000, sellPrice: 10, crystal: 2, projectile: {speed: 10, damage: 1, range: 2, cooldown: 1000}},
        // {cost: 20, buildDuration: 3000, sellPrice: 10, crystal: 2, projectile: {speed: 10, damage: 1, range: 2, cooldown: 1000}},
        // {cost: 20, buildDuration: 3000, sellPrice: 10, crystal: 2, projectile: {speed: 10, damage: 1, range: 2, cooldown: 1000}},
    ]),

    // Ice: buildingFactory("ice", "icebolt", targetClosestUnit(unit => unit.movements.movementType === MovementType.Walking), [
    //     {cost: 10, buildDuration: 3000, sellPrice: 5, crystal: 2, projectile: {speed: 10, damage: 0, range: 1, cooldown: 1000}},
    //     {cost: 8, buildDuration: 3000, sellPrice: 5, crystal: 2, projectile: {speed: 10, damage: 0, range: 1, cooldown: 1000}},
    //     {cost: 8, buildDuration: 3000, sellPrice: 5, crystal: 2, projectile: {speed: 10, damage: 0, range: 1, cooldown: 1000}},
    // ]),

    // Arbalet: buildingFactory("arbalet", "bolt", targetClosestUnit(unit => unit.movements.movementType === MovementType.Flying), [
    //     {cost: 25, buildDuration: 3000, sellPrice: 10, crystal: 2, projectile: {speed: 10, damage: 0, range: 1, cooldown: 1000}},
    //     {cost: 20, buildDuration: 3000, sellPrice: 10, crystal: 2, projectile: {speed: 10, damage: 0, range: 1, cooldown: 1000}},
    //     {cost: 20, buildDuration: 3000, sellPrice: 10, crystal: 2, projectile: {speed: 10, damage: 0, range: 2, cooldown: 1000}},
    // ]),

    // Booster: buildingFactory("booster", "boostAura", targetTowersInRange, [
    //     {cost: 50, buildDuration: 3000, sellPrice: 10, crystal: 2, projectile: {speed: 10, damage: 0, range: 1, cooldown: 1000}},
    //     {cost: 50, buildDuration: 3000, sellPrice: 10, crystal: 2, projectile: {speed: 10, damage: 0, range: 1, cooldown: 1000}},
    // ]),
}

export default entities
globalThis.entities = entities