import Entity from "./entities/Entity.js";
import Position from "./Position.js";
import Building from "./entities/Building.js";
import MovementCapability, {MovementType} from "./MovementCapability.js"

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
     * @param {GameMap} map
     * @param {((number) => void)} eventListener
     * @param {PathFinder} pathFinder
     */
    constructor(map, eventListener, pathFinder) {
        this.#map = map
        this.#eventListener = eventListener
        this.#pathFinder = pathFinder
        map.spawns.forEach(spawn => {
            this.addEntity(new Entity(
                Entity.factory
                    .setName("enemy")
                    .setPosition(new Position(spawn))
                    .setMovements(new MovementCapability(3, 3600, 360, MovementType.Walking))
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

    get map() { return this.#map }
    get entities() { return this.#entities }
    get buildings() { return this.entities.filter(entity => entity instanceof Building) }
    /** @return {PathFinder} */
    get pathFinder() { return this.#pathFinder }

    deleteEntity(entity) {
        this.#entities = this.#entities.filter(ent => ent !== entity)
    }

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
        console.log(`clicked on cell ${x}, ${y}`)

        const towerPosition = new Position(Math.floor(x), Math.floor(y), 0)
        console.log(towerPosition)

        if (this.buildings.some(building => building.position.equals(towerPosition))) {
            console.log("Position is already taken", this.buildings)
            return
        }
        if (! this.#map.positionIsValid(towerPosition) || ! this.#map.getTile(towerPosition.x, towerPosition.y).canBuild) {
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
    }
}