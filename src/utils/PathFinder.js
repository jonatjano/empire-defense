import Position from "../models/Position.js";
import {MovementType} from "../models/MovementCapability.js";
import AbstractBuilding from "../models/entities/AbstractBuilding.js";
import {TileOption} from "../models/GameMap.js";

/**
 * @typedef {{target: Position, value: number}} cellData
 */
/**
 * key is tile y * map.width + tile x
 * @typedef {Map<number, cellData>} pathFinderCache
 */

/**
 * class used for helping with pathfinding
 */
export default class PathFinder {
    /** @type {GameMap} */
    #map
    /**
     * store the next destination for each tile for each movement type
     * @type {Object<MovementType, pathFinderCache>}
     */
    #cache = {}
    /**
     * the previous values of the cache, used for a quick rollback
     * @type {Object<MovementType, pathFinderCache>}
     */
    #previousCache = {}

    constructor(map) {
        this.#map = map
    }

    /**
     * recalculates paths for all movement types
     * @return {boolean}
     */
    recalculateAll() {
        return Object.values(MovementType).reduce((acc, type) => acc && this.recalculate(type), true)
    }

    /**
     * recalculates paths for a specific movement type
     * @param {MovementType} movementType
     * @returns {boolean}
     */
    recalculate(movementType) {
        return this.#precalculate(movementType)
    }

    /**
     * revert all movement types to their previous cache
     */
    revertAll() {
        return Object.values(MovementType).forEach(type => this.revert(type))
    }

    /**
     * revert a specific movement type to its previous cache
     * @param {MovementType} movementType
     */
    revert(movementType) {
        this.#cache[movementType] = this.#previousCache[movementType]
    }

    /**
     * calculate the best path from spawntarget to spawn
     * @param {MovementType} movementType
     * TODO big optimisation as setValue is called thousands of times
     */
    #precalculate(movementType) {
        this.#previousCache[movementType] = this.#cache[movementType]

        /** @type {pathFinderCache} */
        const paths = new Map()
        const spawns = this.#map.spawns
        const positionToKey = position => position.y * this.#map.width + position.x
        const positionsToProcess = new Map(this.#map.targets.map(position => (
            [positionToKey(position), {value: 0, from: position, position: position}]
        )))
        const spawnFounds = new Set()

        // while there are positions to process
        while (positionsToProcess.size !== 0) {
            const [key, doing] = [...positionsToProcess.entries()][0]
            positionsToProcess.delete(key)

            // if the position was not processed yet or the new value is better than the previous one
            if (!paths.has(key) || paths.get(key).value > doing.value) {
                if (! this.#map.positionIsInBoundaries(doing.position)) { continue }

                // skip position not valid for the current movement type
                if (movementType === MovementType.Walking && ! TileOption.is(this.#map.getTileOption(doing.position.x, doing.position.y), TileOption.walkable)) { continue }
                if (movementType === MovementType.Flying && ! TileOption.is(this.#map.getTileOption(doing.position.x, doing.position.y), TileOption.flyable)) { continue }

                // buildings block walking pathfinding
                if (movementType === MovementType.Walking && globalThis.game.getEntities(AbstractBuilding).find(entity =>
                    entity instanceof AbstractBuilding && entity.position.equals(doing.position.x + 0.5, doing.position.y + 0.5)
                ) !== undefined) { continue }

                // set the value
                paths.set(key, {target: doing.from, value: doing.value})

                // if we found a spawn, there is no way to get a better path
                const spawnAtThatPosition = spawns.find(spawnPos => spawnPos.x === doing.position.x && spawnPos.y === doing.position.y)
                if (spawnAtThatPosition !== undefined) {
                    spawnFounds.add(spawnAtThatPosition)
                    continue
                }

                // add neighboring positions to the queue
                const top = new Position(doing.position.x, doing.position.y - 1)
                positionsToProcess.set(
                    positionToKey(top),
                    {value: doing.value + 1, from: doing.position, position: top}
                )
                const bottom = new Position(doing.position.x, doing.position.y + 1)
                positionsToProcess.set(
                    positionToKey(bottom),
                    {value: doing.value + 1, from: doing.position, position: bottom}
                )
                const left = new Position(doing.position.x - 1, doing.position.y)
                positionsToProcess.set(
                    positionToKey(left),
                    {value: doing.value + 1, from: doing.position, position: left}
                )
                const right = new Position(doing.position.x + 1, doing.position.y)
                positionsToProcess.set(
                    positionToKey(right),
                    {value: doing.value + 1, from: doing.position, position: right}
                )
            }
        }

        this.#cache[movementType] = paths

        // ensure that each spawn have a path
        return spawnFounds.size === this.#map.spawns.length
    }

    /**
     * get the target for the given position and movement type
     * @param {Position} currentPosition
     * @param {MovementType} movementType
     * @return {cellData | null}
     */
    getNextTarget(currentPosition, movementType) {
        let cache = this.#cache[movementType]
        if (cache === undefined) {
            this.recalculateAll()
            cache = this.#cache[movementType]
        }
        const key = Math.round(currentPosition.y - 0.5) * this.#map.width + Math.round(currentPosition.x - 0.5)
        // console.log(currentPosition.x, currentPosition.y, key, cache.get(key))
        return cache.get(key) ?? this.#cache[MovementType.Unobstructed].get(key)
    }

    /**
     * @param {MovementType} movementType
     * @return {pathFinderCache}
     */
    getCache(movementType) { return this.#cache[movementType] }
}
