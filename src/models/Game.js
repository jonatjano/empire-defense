import Entity from "./entities/Entity.js";
import Position from "./Position.js";
import Building from "./entities/Building.js";
import MovementCapability, {MovementType} from "./MovementCapability.js"
import Unit from "./entities/Unit.js";
import {TileOption} from "./GameMap.js";

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
    /** @type {Entity[]} */
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
            this.addEntity(new Unit(
                Entity.factory
                    .setName("enemy")
                    .setPosition(new Position(spawn))
                    .setMovements(new MovementCapability(2, 3600, 360, MovementType.Walking))
                    .setMaxHp(100)
            ))

            // this.addEntity(new Entity({
            //     name: "enemy",
            //     movements: new MovementCapability(3, 3600, 360, MovementType.Flying),
            //     position: new Position(spawn),
            //     selectionRange: 10,
            //     baseHp: 1
            // }))
        })
    }

    addEntity(entity) {
        this.#entities.push(entity)
    }

    deleteEntity(entity) {
        this.#entities = this.#entities.filter(ent => ent !== entity)
    }

    /**
     * @param {typeof Entity} [type=Entity]
     * @return {Entity[]}
     */
    getEntities(type = Entity) { return type === Entity ? this.#entities : this.#entities.filter(entity => entity instanceof type) }

    /**
     * @param {(Entity) => boolean} condition
     * @param {typeof Entity} [type=Entity]
     * @return {Entity[]}
     */
    getEntitiesWithCondition(condition, type = Entity) { return this.#entities.filter(entity => entity instanceof type && condition(entity)) }
    getEntitiesCloseTo(position, range, type = Entity) { return this.#entities.filter(entity => entity instanceof type && entity.position.distanceFrom(position) < range) }

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
        console.log(towerPosition)

        if (this.getEntities(Building).some(building => building.position.equals(towerPosition))) {
            console.log("Position is already taken", this.getEntities(Building))
            return
        }
        if (! this.#map.positionIsValid(towerPosition) || ! TileOption.is(this.#map.getTileOption(towerPosition.x, towerPosition.y), TileOption.buildable)) {
            console.log("Tile is not buildable")
            return
        }

        console.log("building tower")
        const tower = new Building(
            Building.factory
                .setName("tower")
                .setPosition(towerPosition)
        )
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
