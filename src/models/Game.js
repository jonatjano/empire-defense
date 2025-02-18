import AbstractEntity from "./entities/AbstractEntity.js";
import Position from "./Position.js";
import AbstractBuilding from "./entities/AbstractBuilding.js";
import {TileOption} from "./GameMap.js";
import entities from "./entities/entities.js";
import AbstractUnit from "./entities/AbstractUnit.js";

let lastFrameTiming
let frameCounter = 0

export default class Game {
    static get SPAWN_INTERVAL() { return 1 / entities.Squire.movements.movementSpeed }
    static get INTER_WAVE_DURATION() { return 10000 }


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

    /** @type {number} */
    #money
    /** @type {number} */
    #crystal
    /** @type {number} */
    #waveNumber
    /** @type {boolean} */
    #lastEnemySpawned = false

    /**
     * @param {GameMap} map
     * @param {((number) => void)} eventListener
     * @param {PathFinder} pathFinder
     */
    constructor(map, eventListener, pathFinder) {
        this.#map = map
        this.#eventListener = eventListener
        this.#pathFinder = pathFinder
        this.money = 20
        this.crystal = 0
        this.waveNumber = 0
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

        document.getElementById("debugTime").textContent = frameTiming
        document.getElementById("frameCount").textContent = (++frameCounter).toFixed(0)
        document.getElementById("debugFps").textContent = (1000 / frameDuration).toFixed(3)
        document.getElementById("debugFpsAvg").textContent = (frameCounter / frameTiming * 1000).toFixed(3)
        document.getElementById("entityCount").textContent = this.#entities.length.toString()

        const durationToSend = frameDuration * globalThis.options.speed
        this.#entities.forEach((entity) => {
            entity.act(durationToSend)
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
        requestAnimationFrame(this.play.bind(this))
    }

    get isPaused() { return this.#isPaused }

    get money() { return this.#money }
    set money(value) {
        this.#money = value
        document.querySelector("#moneyLabel").textContent = value.toString()
    }

    get crystal() { return this.#crystal }
    set crystal(value) {
        this.#crystal = value
        document.querySelector("#crystalLabel").textContent = value.toString()
    }

    get waveNumber() { return this.#waveNumber }
    set waveNumber(value) {
        this.#waveNumber = value
        document.querySelector("#waveLabel").textContent = value.toString()
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    click(x, y) {
        console.group("click")
        console.log(`clicked on cell ${x}, ${y}`)

        const towerType = entities.Archery1

        const cellPosition = new Position(Math.floor(x), Math.floor(y), 0)
        const towerPosition = new Position(cellPosition.x + 0.5, cellPosition.y + 0.5, 0)
        console.log(cellPosition)

        if (! this.#map.positionIsInBoundaries(cellPosition) || ! TileOption.is(this.#map.getTileOption(cellPosition.x, cellPosition.y), TileOption.buildable)) {
            console.log("Tile is not buildable")
            console.groupEnd()
            return
        }
        if (this.getEntities(AbstractBuilding).some(building => building.position.equals(towerPosition))) {
            console.log("Position is already taken", this.getEntities(AbstractBuilding))
            console.groupEnd()
            return
        }
        // if (this.#money < towerType.cost) {
        //     console.log(`Not enough money for this tower, got ${this.#money}, required ${towerType.cost}`)
        //     console.groupEnd()
        //     return
        // }

        console.log("building tower")
        const tower = new towerType(cellPosition)
        console.log(tower)
        this.addEntity(tower)
        if (! this.#pathFinder.recalculateAll()) {
            console.log("failed to recalculate pathfinding")
            this.deleteEntity(tower)
            this.#pathFinder.recalculateAll()
            return
        }
        this.money = this.money - tower.cost;
        this.crystal = this.crystal + tower.crystalOnBuild
        if (this.waveNumber === 0) {
            this.#launchNextWave()
        }

        console.log("end")
        console.groupEnd()
    }

    #launchNextWave() {
        console.log("new wave")
        this.waveNumber = this.waveNumber + 1
        this.#lastEnemySpawned = false
        console.log(this.waveNumber)
        const callback = this.#waveDeathCallback.bind(this)
        const spawnData = this.map.waves[this.waveNumber - 1]
        console.log(spawnData)
        let unitIndex = 0
        const interval = setInterval(() => {
            let spawnCount = 0
            for (const spawnIndex in spawnData) {
                const spawnPosition = this.map.spawns[spawnIndex]
                const unitList = spawnData[spawnIndex]
                if (unitIndex < unitList.length) {
                    const unitType = unitList[unitIndex]
                    console.log("spawning", unitType, spawnPosition)
                    this.addEntity(new unitType(spawnPosition, callback))
                    spawnCount++
                }
            }
            console.log(`spawned ${spawnCount} units`)
            if (spawnCount === 0) {
                clearInterval(interval)
                this.#lastEnemySpawned = true
            }
            unitIndex++
        }, Game.SPAWN_INTERVAL)
    }

    #waveDeathCallback(unit) {
        this.money += unit.killReward
        this.crystal += unit.killCrystalReward

        if (this.#lastEnemySpawned && this.getEntities(AbstractUnit).length === 0) {
            if (this.map.waves.length === this.waveNumber) {
                alert("victory")
            } else {
                this.#launchNextWave()
            }
        }
    }
}
