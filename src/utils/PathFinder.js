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

export default class PathFinder {
    /** @type {GameMap} */
    #map
    /**
     * @type {Object<MovementType, pathFinderCache>}
     */
    #cache = {}
    /**
     * @type {Object<MovementType, pathFinderCache>}
     */
    #previousCache = {}

    constructor(map) {
        this.#map = map
    }

    recalculateAll() {
        return Object.values(MovementType).reduce((acc, type) => acc && this.recalculate(type), true)
    }

    /**
     * @param {MovementType} movementType
     * @returns {boolean}
     */
    recalculate(movementType) {
        return this.#precalculate(movementType)
    }

    revertAll() {
        return Object.values(MovementType).forEach(type => this.revert(type))
    }

    /**
     * @param {MovementType} movementType
     */
    revert(movementType) {
        this.#cache[movementType] = this.#previousCache[movementType]
    }

    /**
     * @param {MovementType} movementType
     */
    // TODO big optimisation as setValue is called thousands of times
    #precalculate(movementType) {
        this.#previousCache[movementType] = this.#cache[movementType]

        /** @type {pathFinderCache} */
        const paths = new Map()
        const spawns = this.#map.spawns
        const positionToKey = position => position.y * this.#map.width + position.x
        const positionsToDo = new Map(this.#map.targets.map(position => (
            [positionToKey(position), {value: 0, from: position, position: position}]
        )))
        const spawnFounds = new Set()
        // const that = this

        while (positionsToDo.size !== 0) {
            // console.log(positionsToDo)
            const [key, doing] = [...positionsToDo.entries()][0]
            positionsToDo.delete(key)

            if (!paths.has(key) || paths.get(key).value > doing.value) {
                if (! this.#map.positionIsInBoundaries(doing.position)) { continue }

                if (movementType === MovementType.Walking && ! TileOption.is(this.#map.getTileOption(doing.position.x, doing.position.y), TileOption.walkable)) { continue }
                if (movementType === MovementType.Flying && ! TileOption.is(this.#map.getTileOption(doing.position.x, doing.position.y), TileOption.flyable)) { continue }

                if (movementType === MovementType.Walking && globalThis.game.getEntities(AbstractBuilding).find(entity =>
                    entity instanceof AbstractBuilding && entity.position.equals(doing.position.x + 0.5, doing.position.y + 0.5)
                ) !== undefined) { continue }

                paths.set(key, {target: doing.from, value: doing.value})

                const spawnAtThatPosition = spawns.find(spawnPos => spawnPos.x === doing.position.x && spawnPos.y === doing.position.y)
                if (spawnAtThatPosition !== undefined) {
                    spawnFounds.add(spawnAtThatPosition)
                    continue
                }

                const top = new Position(doing.position.x, doing.position.y - 1)
                positionsToDo.set(
                    positionToKey(top),
                    {value: doing.value + 1, from: doing.position, position: top}
                )
                const bottom = new Position(doing.position.x, doing.position.y + 1)
                positionsToDo.set(
                    positionToKey(bottom),
                    {value: doing.value + 1, from: doing.position, position: bottom}
                )
                const left = new Position(doing.position.x - 1, doing.position.y)
                positionsToDo.set(
                    positionToKey(left),
                    {value: doing.value + 1, from: doing.position, position: left}
                )
                const right = new Position(doing.position.x + 1, doing.position.y)
                positionsToDo.set(
                    positionToKey(right),
                    {value: doing.value + 1, from: doing.position, position: right}
                )
            }
        }

        this.#cache[movementType] = paths

        return spawnFounds.size === this.#map.spawns.length
    }

    /**
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
