
import AbstractEntity, {AnimationKeys} from "./entities/AbstractEntity.js"
import FloatingText from "./entities/FloatingText.js"
import Position from "./Position.js";
import AbstractBuilding from "./entities/AbstractBuilding.js";
import {TileOption} from "./GameMap.js";
import entities from "./entities/entities.js"
import AbstractUnit from "./entities/AbstractUnit.js";
import TexturePack from "../utils/TexturePack.js";
import Vfx from "./entities/Vfx.js";

let realLastFrameTiming
let frameTimingWithSpeedFactor
let firstFrameTiming = undefined
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
    #life
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
        this.life = 20
        this.money = 20
        this.crystal = 0
        this.waveNumber = 0
        this.playableTowers = [...(globalThis.options.anyDebug ? [entities.Debug] : []), entities.Archery, entities.Cannon, entities.Ice, entities.Ballista, entities.Booster]
    }

    /**
     * add an entity to the game
     * @param {AbstractEntity} entity
     */
    addEntity(entity) {
        this.#entities.push(entity)
    }

    /**
     * remove an entity from the game
     * @param {AbstractEntity} entity
     * @param {boolean} [skipPathFinder=false] - whether to skip recalculating pathfinding after entity removal
     */
    deleteEntity(entity, skipPathFinder = false) {
        this.#entities = this.#entities.filter(ent => ent !== entity)
        if (entity instanceof AbstractBuilding && !skipPathFinder) {
            this.pathFinder.recalculateAll()
        }
    }

    /**
     * @param {typeof AbstractEntity} [type=AbstractEntity]
     * @return {AbstractEntity[]}
     */
    getEntities(type = AbstractEntity) { return type === AbstractEntity ? this.#entities : this.#entities.filter(entity => entity instanceof type) }

    /**
     * @param {(AbstractEntity) => boolean} condition
     * @param {typeof AbstractEntity} [type=AbstractEntity]
     * @return {AbstractEntity[]}
     */
    getEntitiesWithCondition(condition, type = AbstractEntity) { return this.#entities.filter(entity => entity instanceof type && condition(entity)) }
    getEntitiesCloseTo(position, range, type = AbstractEntity) { return this.#entities.filter(entity => entity instanceof type && entity.position.distanceFrom(position) < range) }

    /**
     * set the list of playable towers, rebuild the DOM accordingly
     * @param {AbstractBuilding[]} playableTowers
     */
    set playableTowers(playableTowers) {
        const towersContainer = document.querySelector("#towers")
        towersContainer.innerHTML = ""
        towersContainer.append(
            ...playableTowers.map(towerType => {
                const element = document.createElement("button")
                element.innerHTML = `<img data-framed="true" data-texture="entities/buildings/${towerType.name}" src="" alt="${towerType.name}">`
                element.dataset.cost = towerType.cost
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
        setTimeout(() => {
            globalThis.options.updateIconsEvents()
        })
    }

    get selectedTowerType() { return this.#selectedTowerType }

    get selectedEntity() {
        return this.#selectedEntity
    }
    /**
     * set the currently selected entity
     * @param {{tower: AbstractBuilding, isGhost: boolean, isValid: boolean} | null} value
     */
    set selectedEntity(value) {
        this.#selectedEntity = value
        const upgradeButton = document.querySelector("#upgradeTower")
        const sellButton = document.querySelector("#sellTower")

        // toggle the menu as needed
        this.toggleTowerMenuVisibility(value)

        // update the tower menu to the selected tower
	    if (value?.tower.upgradesTo) {
            upgradeButton.firstElementChild.dataset.texture = `entities/buildings/${value?.tower.upgradesTo.name}`
            upgradeButton.dataset.cost = value.tower.upgradesTo.cost;
	    }

        sellButton.dataset.cost = value?.tower.sellPrice ?? "0"
        sellButton.onclick = value ? this.#sellTower.bind(this, value.tower) : undefined
        if (value?.tower.upgradesTo) {
            upgradeButton.onclick = value ? this.#upgradeTower.bind(this, value.tower) : undefined
        }
    }

    /**
     * set the visibility of the tower menu based on the selected entity
     * @param {{tower: AbstractBuilding, isGhost: boolean, isValid: boolean} | null} value
     */
    toggleTowerMenuVisibility(value) {
        if (value) {
            document.querySelector("#towerMenu").classList.toggle("hidden", value.isGhost)
            document.querySelector("#sellTower").classList.toggle("hidden", value.tower.buildPercent < 100 || value.isGhost)
            document.querySelector("#upgradeTower").classList.toggle("hidden", value.tower.buildPercent < 100 || value.isGhost || !value.tower.upgradesTo)
        } else {
            document.querySelector("#towerMenu").classList.add("hidden")
        }
    }

    /**
     * sell the given tower
     * @param {AbstractBuilding} tower
     */
    #sellTower(tower) {
        // TODO selling crystal loss
        tower.setAnimation(AnimationKeys.SELL, frameTimingWithSpeedFactor).then(success => {
            // if we couldn't set the animation, we need to delete the tower ourselves as it won't delete itself
            if (! success) { this.deleteEntity(tower) }
        })
        this.money = this.money + tower.sellPrice
        if (this.#selectedEntity.tower === tower) {
            this.selectedEntity = null
        }
    }

    /**
     * upgrade the given tower
     * @param {AbstractBuilding} tower
     */
    #upgradeTower(tower) {
        console.log("upgrading", tower, this.money, tower.upgradesTo.cost)
        if (this.money >= tower.upgradesTo.cost) {
            const newTower = new tower.upgradesTo(tower.position)
            newTower.setAnimation(AnimationKeys.UPGRADE, frameTimingWithSpeedFactor)
            this.deleteEntity(tower, true)
            this.addEntity(newTower)
            this.money = this.money - newTower.cost
            this.selectedEntity = {tower: newTower, isValid: true, isGhost: false}
        }
    }

    /**
     * @return {GameMap}
     */
    get map() { return this.#map }

    /** @return {PathFinder} */
    get pathFinder() { return this.#pathFinder }

    /**
     * pause the game
     */
    pause() {
        this.#isPaused = true
        realLastFrameTiming = undefined
    }

	get currentFrameTiming() { return frameTimingWithSpeedFactor }

    /**
     * step the game forward by one frame
     * @param frameTiming
     */
    step(frameTiming) {
        if (realLastFrameTiming === undefined) {
            realLastFrameTiming = frameTiming
            frameTimingWithSpeedFactor = realLastFrameTiming
            firstFrameTiming = frameTiming
            frameCounterSinceLastPause = 0
            return
        }
        const frameDuration = frameTiming - realLastFrameTiming
        realLastFrameTiming = frameTiming
        frameCounterSinceLastPause++

        this.toggleTowerMenuVisibility(this.selectedEntity)

        document.getElementById("debugTime").textContent = frameTiming
        document.getElementById("frameCount").textContent = (++totalFrameCounter).toFixed(0)
        document.getElementById("debugFps").textContent = (1000 / frameDuration).toFixed(3)
        document.getElementById("debugFpsAvg").textContent = (frameCounterSinceLastPause / (frameTiming - firstFrameTiming) * 1000).toFixed(3)
        document.getElementById("entityCount").textContent = this.#entities.length.toString()

        const durationToSend = frameDuration * globalThis.options.speed
        frameTimingWithSpeedFactor += durationToSend
        this.#spawnNextUnits(durationToSend, frameTimingWithSpeedFactor)
        this.#entities.forEach((entity) => {
            entity.act(durationToSend, frameTimingWithSpeedFactor)
        })

        this.#eventListener(frameTimingWithSpeedFactor)
    }

    /**
     * play the game
     * @param {number} frameTiming
     */
    play(frameTiming) {
        this.step(frameTiming)
        if (! this.#isPaused) {
            requestAnimationFrame(this.play.bind(this))
        }
    }

    /**
     * play one frame
     */
    playOnce() {
        if (! this.#isPaused) { return}
        const again = () => {
            requestAnimationFrame(this.play.bind(this))
        }
        realLastFrameTiming = undefined
        requestAnimationFrame(this.play.bind(this))
        requestAnimationFrame(again.bind(this))
    }

    /**
     * resume the game after a pause
     */
    resume() {
        if (! this.#isPaused) { return }
        realLastFrameTiming = undefined
        this.#isPaused = false
        requestAnimationFrame(this.play.bind(this))
    }

    get isPaused() { return this.#isPaused }

    get life() { return this.#life }
    /**
     * set the life and apply the changes to the UI and the game over condition
     * @param {number} value
     */
    set life(value) {
        this.#life = value
        if (! globalThis.options.unlimitedLife) {
            document.querySelector("#lifeLabel").textContent = value.toString()
            if (this.life <= 0) {
                this.pause()
                alert("game over")
            }
        }
    }

    get money() { return globalThis.options.unlimitedMoney ? Infinity : this.#money }
    /**
     * set the money and update the UI
     * @param {number} value
     */
    set money(value) {
        this.#money = value
        if (! globalThis.options.unlimitedMoney) {
            document.querySelector("#moneyLabel").textContent = value.toString()
        }
    }

    get crystal() { return this.#crystal }
    /**
     * set the crystal count and update the UI
     * @param {number} value
     */
    set crystal(value) {
        this.#crystal = value
        document.querySelector("#crystalLabel").textContent = value.toString()
    }

    get waveNumber() { return this.#waveNumber }
    /**
     * set the wave number and update the UI
     * @param {number} value
     */
    set waveNumber(value) {
        this.#waveNumber = value
        document.querySelector("#waveLabel").textContent = value.toString()
    }


    /**
     * event listener for mouse over event,
     * show a ghost tower if applicable
     * @param {number} x
     * @param {number} y
     */
    moveOver(x, y) {
        if (this.#isPaused) { return }

        const towerType = this.#selectedTowerType
        // no tower type selected, there is nothing more to do
        if (towerType === null) {
            return
        }

        const cellPosition = new Position(Math.floor(x), Math.floor(y), 0)
        const towerPosition = new Position(cellPosition.x + 0.5, cellPosition.y + 0.5, TexturePack.framedRotation)

        // if position is not valid, or already taken, remove the ghost
        if (! this.#map.positionIsInBoundaries(cellPosition) || ! TileOption.is(this.#map.getTileOption(cellPosition.x, cellPosition.y), TileOption.buildable)) {
            this.selectedEntity = null
            return
        }
        if (this.getEntities(AbstractBuilding).some(building => building.position.equals(towerPosition))) {
            this.selectedEntity = null
            return
        }

        // if the ghost is in the same cell as the last time the event fired
        if (this.selectedEntity?.tower.position.equals(towerPosition)) {
            return
        }

        // build the tower ghost at the position
        const tower = new towerType(cellPosition)
        this.addEntity(tower)
        // check the validity of the position
        const isValid = this.#pathFinder.recalculateAll()
        this.deleteEntity(tower, true)
        this.#pathFinder.revertAll()
        this.selectedEntity = { tower, isValid, isGhost: true }
    }

    /**
     * listener for mouse click event,
     * place or select a tower if applicable
     * @param {number} x
     * @param {number} y
     * @param {{ctrl: boolean, shift: boolean}} metaKeys
     */
    click(x, y, metaKeys) {
        if (this.#isPaused) { return }

        const towerType = this.#selectedTowerType
        // the player is not trying to build a tower
        // select the tower at that position if there is one
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

        // the player is trying to build a tower
        const cellPosition = new Position(Math.floor(x), Math.floor(y), 0)
        const towerPosition = new Position(cellPosition.x + 0.5, cellPosition.y + 0.5, 0)

        // check the validity of the position
        if (! this.#map.positionIsInBoundaries(cellPosition) || ! TileOption.is(this.#map.getTileOption(cellPosition.x, cellPosition.y), TileOption.buildable)) {
            console.error("Tile is not buildable")
            return
        }
        if (this.getEntities(AbstractBuilding).some(building => building.position.equals(towerPosition))) {
            console.error("Position is already taken", this.getEntities(AbstractBuilding))
            return
        }
        // check that the player has enough money
        if (this.#money <= towerType.cost && ! globalThis.options.unlimitedMoney) {
            console.error(`Not enough money for this tower, got ${this.#money}, required ${towerType.cost}`)
            return
        }

        // create the tower
        const tower = new towerType(towerPosition)
        this.addEntity(tower)
        // update the pathfinding, and delete the tower if it fails
        if (! this.#pathFinder.recalculateAll()) {
            this.deleteEntity(tower, true)
            this.#pathFinder.revertAll()
            return
        }
        // update the game state
        this.money = this.money - towerType.cost;
        this.crystal = this.crystal + tower.crystalOnBuild
        // launch the first wave if not done yet
        if (this.waveNumber === 0) {
            this.#launchNextWave()
        }
        // if the shift key is pressed, keep the selected tower type
        if (! metaKeys.shift) {
            this.#selectedTowerType = null
            this.selectedEntity = null
        }
    }

    /**
     * launch the next wave
     */
    #launchNextWave() {
        console.log("new wave")
        this.waveNumber = this.waveNumber + 1

        // play the spawn and target vfx
        this.#map.spawns.forEach(pos => {
            this.addEntity(new Vfx(pos, frameTimingWithSpeedFactor, 5000, AnimationKeys.SPAWN_ARROW))
        })
        const [firstTarget, ...otherTargets] = this.#map.targets
        otherTargets.forEach(pos => {
            this.addEntity(new Vfx(pos, frameTimingWithSpeedFactor, 5000, AnimationKeys.TARGET_ARROW))
        })
        // separate the first target so we can use the Vfx inner timing to launch the wave
        this.addEntity(new Vfx(firstTarget, frameTimingWithSpeedFactor, 5000, AnimationKeys.TARGET_ARROW, () => {
            this.#unitsToSpawn = this.map.waves[this.waveNumber - 1].map(spawnLists => spawnLists.map(spawn => spawn))
        }))

        console.log(this.waveNumber)
        console.log(this.map.waves)
    }

    /**
     * spawn the units for the current frame
     * @param {number} frameDuration
     * @param {number} frameTiming
     */
    #spawnNextUnits(frameDuration, frameTiming) {
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
                        const unit = new unitType(spawnPosition, callback, this.waveNumber)
                        this.addEntity(unit)
                        unit.setAnimation(AnimationKeys.WALK, frameTiming)
                    }
                }
            }
        } else {
            if (this.#spawnCooldown < 0) {
                this.#spawnCooldown = 0
            }
        }
    }

    /**
     * callback when a unit dies
     * @param {AbstractUnit} unit
     * @param {boolean} giveReward true if the player killed the unit
     */
    #waveDeathCallback(unit, giveReward) {
        console.log("death", unit, giveReward)
        if (giveReward) {
            this.money += unit.killReward
            this.crystal += unit.killCrystalReward
            this.addEntity(new FloatingText(
                unit.killReward.toString(10),
                "gold",
                new Position(unit.position.x + Math.random() * 0.3, unit.position.y - 0.5 + Math.random() * 0.3)
            ))
        }

        // if there are no more units to spawn and all units are dead, launch the next wave or show the victory screen
	    if (this.#unitsToSpawn.every(spawnList => spawnList.length === 0) &&
            this.getEntities(AbstractUnit)
                .filter(unit => unit.animationDetails.name === AnimationKeys.WALK)
                .length === 0
        ) {
            if (this.map.waves.length === this.waveNumber) {
                alert("victory")
            } else {
                this.#launchNextWave()
            }
        }
    }
}
