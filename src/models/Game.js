import AbstractEntity from "./entities/AbstractEntity.js";
import FloatingText from "./entities/FloatingText.js"
import Position from "./Position.js";
import AbstractBuilding from "./entities/AbstractBuilding.js";
import {TileOption} from "./GameMap.js";
import entities from "./entities/entities.js";
import AbstractUnit from "./entities/AbstractUnit.js";
import TexturePack from "../utils/TexturePack.js";
import Vfx from "./entities/Vfx.js";

let lastFrameTiming
let firstFrameTiming = undefined;
let totalFrameCounter = 0
let frameCounterSinceLastPause = 0

export default class Game {
    static get SPAWN_INTERVAL() { return 1 / entities.Squire.movements.movementSpeed }

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
    /** @type {spawnData[]} */
    #unitsToSpawn = []
    /** @type {number} */
    #spawnCooldown = 0

    /** @type {{tower: AbstractBuilding, isGhost: boolean, isValid: boolean} | null} */
    #selectedEntity = null
    /** @type {typeof AbstractBuilding | null} */
    #selectedTowerType = null

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
        this.playableTowers = [entities.Archery2, entities.Cannon1]
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
     * @param {AbstractBuilding[]} playableTowers
     */
    set playableTowers(playableTowers) {
        const towersContainer = document.querySelector("#towers")
        towersContainer.innerHTML = ""
        towersContainer.append(
            ...playableTowers.map(towerType => {
                const element = document.createElement("button")
                const tower = new towerType(new Position(0, 0, TexturePack.framedRotation))
                element.innerHTML = `<img data-framed="true" data-texture="entities/buildings/${tower.name}" src="" alt="${towerType.name}">`
                element.onclick = () => {
                    if (this.#selectedTowerType === towerType) {
                         this.#selectedTowerType = null
                    } else {
                        this.#selectedTowerType = towerType
                    }
                }
                return element
            })
        )
    }

    get selectedEntity() {
        return this.#selectedEntity
    }
    /** @type {{tower: AbstractBuilding, isGhost: boolean, isValid: boolean} | null} */
    set selectedEntity(value) {
        this.#selectedEntity = value
        document.querySelector("#towerMenu").classList.toggle("hidden", value?.isGhost ?? true)
    }

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
        if (lastFrameTiming === undefined) {
            lastFrameTiming = frameTiming
            firstFrameTiming = frameTiming
            frameCounterSinceLastPause = 0
            return
        }
        const frameDuration = frameTiming - lastFrameTiming
        lastFrameTiming = frameTiming
        frameCounterSinceLastPause++

        document.getElementById("debugTime").textContent = frameTiming
        document.getElementById("frameCount").textContent = (++totalFrameCounter).toFixed(0)
        document.getElementById("debugFps").textContent = (1000 / frameDuration).toFixed(3)
        document.getElementById("debugFpsAvg").textContent = (frameCounterSinceLastPause / (frameTiming - firstFrameTiming) * 1000).toFixed(3)
        document.getElementById("entityCount").textContent = this.#entities.length.toString()

        const durationToSend = frameDuration * globalThis.options.speed
        this.#spawnNextUnits(durationToSend)
        this.#entities.forEach((entity) => {
            entity.act(durationToSend)
        })

        this.#eventListener(frameTiming)
    }

    play(frameTiming) {
        if (! this.#isPaused) {
            this.step(frameTiming)
            requestAnimationFrame(this.play.bind(this))
        }
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
        if (! globalThis.options.unlimitedMoney) {
            document.querySelector("#moneyLabel").textContent = value.toString()
        }
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
    moveOver(x, y) {
        if (this.#isPaused) { return }

        const towerType = this.#selectedTowerType
        if (towerType === null) {
            return
        }

        const cellPosition = new Position(Math.floor(x), Math.floor(y), 0)
        const towerPosition = new Position(cellPosition.x + 0.5, cellPosition.y + 0.5, TexturePack.framedRotation)

        if (! this.#map.positionIsInBoundaries(cellPosition) || ! TileOption.is(this.#map.getTileOption(cellPosition.x, cellPosition.y), TileOption.buildable)) {
            this.selectedEntity = null
            return
        }
        if (this.getEntities(AbstractBuilding).some(building => building.position.equals(towerPosition))) {
            this.selectedEntity = null
            return
        }

        if (this.selectedEntity?.tower.position.equals(towerPosition)) {
            return
        }

        const tower = new towerType(cellPosition)
        this.addEntity(tower)
        const isValid = this.#pathFinder.recalculateAll()
        this.deleteEntity(tower)
        this.#pathFinder.revertAll()
        this.selectedEntity = { tower, isValid, isGhost: true }
    }

    /**
     * @param {number} x
     * @param {number} y
     */
    click(x, y) {
        if (this.#isPaused) { return }

        const towerType = this.#selectedTowerType
        if (towerType === null) {
            const cellPosition = new Position(Math.floor(x), Math.floor(y), 0)
            const towerPosition = new Position(cellPosition.x + 0.5, cellPosition.y + 0.5, 0)

            /** @type {AbstractBuilding | undefined} */
            const tower = this.getEntities(AbstractBuilding).find(building => building.position.equals(towerPosition))

            if (tower !== undefined) {
                this.selectedEntity = {tower, isValid: true, isGhost: false}
            } else {
                this.selectedEntity = null
            }

            return
        }

        const cellPosition = new Position(Math.floor(x), Math.floor(y), 0)
        const towerPosition = new Position(cellPosition.x + 0.5, cellPosition.y + 0.5, 0)

        if (! this.#map.positionIsInBoundaries(cellPosition) || ! TileOption.is(this.#map.getTileOption(cellPosition.x, cellPosition.y), TileOption.buildable)) {
            console.error("Tile is not buildable")
            return
        }
        if (this.getEntities(AbstractBuilding).some(building => building.position.equals(towerPosition))) {
            console.error("Position is already taken", this.getEntities(AbstractBuilding))
            return
        }

        if (this.#money < towerType.cost && ! globalThis.options.unlimitedMoney) {
            console.error(`Not enough money for this tower, got ${this.#money}, required ${towerType.cost}`)
            return
        }


        const tower = new towerType(towerPosition)
        this.addEntity(tower)
        if (! this.#pathFinder.recalculateAll()) {
            this.deleteEntity(tower)
            this.#pathFinder.revertAll()
            return
        }
        this.money = this.money - towerType.cost;
        this.crystal = this.crystal + tower.crystalOnBuild
        if (this.waveNumber === 0) {
            this.#launchNextWave()
        }
        this.#selectedTowerType = null
        this.selectedEntity = null
    }

    #launchNextWave() {
        console.log("new wave")
        this.waveNumber = this.waveNumber + 1

        this.#map.spawns.forEach(pos => {
            this.addEntity(new Vfx(pos, lastFrameTiming, 5000, "spawnArrow"))
        })
        this.#map.targets.forEach(pos => {
            this.addEntity(new Vfx(pos, lastFrameTiming, 5000, "targetArrow"))
        })

        setTimeout(() => {
            this.#unitsToSpawn = this.map.waves[this.waveNumber - 1].map(spawnLists => spawnLists.map(spawn => spawn))
        }, 5000)
        console.log(this.waveNumber)
        console.log(this.map.waves)
    }

    #spawnNextUnits(frameDuration) {
        this.#spawnCooldown = this.#spawnCooldown - frameDuration
        const callback = this.#waveDeathCallback.bind(this)

        if (this.#unitsToSpawn.some(spawnList => spawnList.length !== 0)) {
            if (this.#spawnCooldown <= 0) {
                this.#spawnCooldown += Game.SPAWN_INTERVAL
                for (const spawnIndex in this.#unitsToSpawn) {
                    const spawnPosition = this.map.spawns[spawnIndex]
                    const unitList = this.#unitsToSpawn[spawnIndex]
                    if (unitList.length !== 0) {
                        const unitType = unitList.shift()
                        console.log("spawning", unitType, spawnPosition)
                        const unit = new unitType(spawnPosition, callback)
                        this.addEntity(unit)
                        if (Math.random() < 0.5) {
                            unit.setAnimation("walk", lastFrameTiming)
                        }
                    }
                }
            }
        } else {
            if (this.#spawnCooldown < 0) {
                this.#spawnCooldown = 0
            }
        }
    }

    #waveDeathCallback(unit) {
        this.money += unit.killReward
        this.crystal += unit.killCrystalReward
        this.addEntity(new FloatingText(
            unit.killReward.toString(10),
            "gold",
            new Position(unit.position.x + Math.random() * 0.3, unit.position.y - 0.5 + Math.random() * 0.3)
        ))

        if (this.#unitsToSpawn.every(spawnList => spawnList.length === 0) && this.getEntities(AbstractUnit).length === 0) {
            if (this.map.waves.length === this.waveNumber) {
                alert("victory")
            } else {
                this.#launchNextWave()
            }
        }
    }
}
