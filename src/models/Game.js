import AbstractEntity from "./entities/AbstractEntity.js";
import Position from "./Position.js";
import AbstractBuilding from "./entities/AbstractBuilding.js";
import {TileOption} from "./GameMap.js";
import Entities from "./entities/entities.js";

let lastFrameTiming
let debugTime = document.getElementById("debugTime")
let frameCount = document.getElementById("frameCount")
let debugFps = document.getElementById("debugFps")
let debugFpsAvg = document.getElementById('debugFpsAvg')
let entityCount = document.getElementById('entityCount')
let frameCounter = 0

export default class Game {
    /** @type {GameMap} */
    #map
    /** @type {((number) => void)} */
    #eventListener
    /** @type {boolean} */
    #isPaused = true
    /** @type {AbstractEntity[]} */
    #entities = []
    /** @type {PathFinder} */
    #pathFinder

    /**
     * @param {{map: GameMap, waves: any[]}} map
     * @param {((number) => void)} eventListener
     * @param {PathFinder} pathFinder
     */
    constructor(map, eventListener, pathFinder) {
        this.#map = map.map
        this.#eventListener = eventListener
        this.#pathFinder = pathFinder
        this.#map.spawns.forEach(spawn => {
            this.addEntity(new Entities.Footman(spawn))

            // this.addEntity(new Entities.Bird(spawn))
        })
    }

    addEntity(entity) {
        this.#entities.push(entity)
    }

    deleteEntity(entity) {
        this.#entities = this.#entities.filter(ent => ent !== entity)
    }

    /**
     * @param {typeof AbstractEntity} [type=Entity]
     * @return {AbstractEntity[]}
     */
    getEntities(type = AbstractEntity) { return type === AbstractEntity ? this.#entities : this.#entities.filter(entity => entity instanceof type) }

    /**
     * @param {(AbstractEntity) => boolean} condition
     * @param {typeof AbstractEntity} [type=Entity]
     * @return {AbstractEntity[]}
     */
    getEntitiesWithCondition(condition, type = AbstractEntity) { return this.#entities.filter(entity => entity instanceof type && condition(entity)) }
    getEntitiesCloseTo(position, range, type = AbstractEntity) { return this.#entities.filter(entity => entity instanceof type && entity.position.distanceFrom(position) < range) }

    /**
     * @return {GameMap}
     */
    get map() { return this.#map }

    /** @return {PathFinder} */
    get pathFinder() { return this.#pathFinder }

    pause() {
        this.#isPaused = true
        lastFrameTiming = undefined
    }

    step(frameTiming) {
        if (this.#isPaused) { return }
        // this.pause()
        if (lastFrameTiming === undefined) {
            lastFrameTiming = frameTiming
            return
        }
        const frameDuration = frameTiming - lastFrameTiming
        lastFrameTiming = frameTiming

        debugTime.textContent = frameTiming
        frameCount.textContent = (++frameCounter).toFixed(0)
        debugFps.textContent = (1000 / frameDuration).toFixed(3)
        debugFpsAvg.textContent = (frameCounter / frameTiming * 1000).toFixed(3)
        entityCount.textContent = this.#entities.length.toString()

        this.#entities.forEach((entity) => {
            entity.act(frameDuration)
        })

        this.#eventListener(frameTiming)
    }

    play(frameTiming) {
        this.step(frameTiming)
        requestAnimationFrame(this.play.bind(this))
    }

    resume() {
        if (! this.#isPaused) { return }
        this.#isPaused = false
        debugTime = document.getElementById("debugTime");
        frameCount = document.getElementById("frameCount")
        debugFps = document.getElementById("debugFps");
        debugFpsAvg = document.getElementById('debugFpsAvg');
        entityCount = document.getElementById('entityCount');
        requestAnimationFrame(this.play.bind(this))
    }

    get isPaused() { return this.#isPaused }

    /**
     * @param {number} x
     * @param {number} y
     */
    click(x, y) {
        console.groupCollapsed("click")
        console.log(`clicked on cell ${x}, ${y}`)

        const towerPosition = new Position(Math.floor(x), Math.floor(y), 0)
        const cellPosition = new Position(towerPosition.x + 0.5, towerPosition.y + 0.5, 0)
        console.log(towerPosition)

        if (! this.#map.positionIsValid(towerPosition) || ! TileOption.is(this.#map.getTileOption(towerPosition.x, towerPosition.y), TileOption.buildable)) {
            console.log("Tile is not buildable")
            console.groupEnd()
            return
        }
        console.log(
            this.getEntities(AbstractBuilding),
            this.getEntities(AbstractBuilding).some(building => building.position.equals(cellPosition))
        )
        if (this.getEntities(AbstractBuilding).some(building => building.position.equals(cellPosition))) {
            console.log("Position is already taken", this.getEntities(AbstractBuilding))
            console.groupEnd()
            return
        }

        console.log("building tower")
        const tower = new Entities.Archer(towerPosition)
        console.log(tower)
        this.addEntity(tower)
        if (! this.#pathFinder.recalculateAll()) {
            console.log("failed to recalculate pathfinding")
            this.deleteEntity(tower)
            this.#pathFinder.recalculateAll()
        }
        console.log("end")
        console.groupEnd()
    }
}
