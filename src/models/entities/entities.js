import {buildingFactory} from "./AbstractBuilding.js"
import MovementCapability, {MovementType} from "../MovementCapability.js";
import {unitFactory} from "./AbstractUnit.js"

const entities = {
    /*********************
     *      ENEMIES      *
     *********************/
    Squire: unitFactory(
        "squire", 
        new MovementCapability(1, 3600, 360, MovementType.Walking), 
        1, 1, 
            wave => 100 + wave - wave
    ),
    Footman: unitFactory(
        "footman",
        new MovementCapability(1, 3600, 360, MovementType.Walking),
        1, 1,
        wave => 100 + wave - wave
    ),
    Cannoneer: unitFactory(
        "cannoneer",
        new MovementCapability(0.75, 3600, 360, MovementType.Walking),
        2, 2,
        wave => 100 + wave - wave
    ),
    Knight: unitFactory(
        "knight",
        new MovementCapability(2, 3600, 360, MovementType.Walking),
        2, 2,
        wave => 100 + wave - wave
    ),
    Ram: unitFactory(
        "ram",
        new MovementCapability(0.25, 3600, 60, MovementType.Walking),
        6, 5,
        wave => 100 + wave - wave
    ),
    Champion: unitFactory(
        "champion",
        new MovementCapability(2, 3600, 360, MovementType.Walking),
        3, 2,
        wave => 100 + wave - wave
    ),
    Harpy: unitFactory(
        "harpy",
        new MovementCapability(2, 3600, 360, MovementType.Flying),
        5, 5,
        wave => 100 + wave - wave
    ),
    Elephant: unitFactory(
        "elephant",
        new MovementCapability(0.25, 3600, 60, MovementType.Walking),
        6, 5,
        wave => 100 + wave - wave
    ),

    /*********************
     *      TOWERS       *
     *********************/

    Archery: buildingFactory("archery", "arrow", [
        {cost: 5, crystal: 1, projectile: {speed: 10, damage: 50, range: 10, cooldown: 1000}},
        // {cost: 4, crystal: 1, projectile: {speed: 10, damage: 1, range: 10, cooldown: 1000}},
        // {cost: 4, crystal: 1, projectile: {speed: 10, damage: 1, range: 10, cooldown: 500}},
    ]),

    Cannon: buildingFactory("cannon", "cannonball", [
        {cost: 5, crystal: 2, projectile: {speed: 10, damage: 1, range: 1, cooldown: 1000}},
        // {cost: 4, crystal: 2, projectile: {speed: 10, damage: 1, range: 1, cooldown: 1000}},
        // {cost: 4, crystal: 2, projectile: {speed: 10, damage: 1, range: 1, cooldown: 500}},
    ]),
}

export default entities
globalThis.entities = entities