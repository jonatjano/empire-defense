/**
 * @typedef {{
 *     name: string,
 *     baseHp: number,
 *     selectionRange: number,
 *     movements: MovementCapability,
 *     position: Position
 * }} EntityConfiguration
 */
import Position from "../Position.js";
import {default as MovementCapability, DISTANCE_EPSILON, MovementType} from "../MovementCapability.js";
import * as AngleUtils from "../../utils/AngleUtils.js";

export class EntityFactory {
    /** @type {string} */
    name
    /** @type {number} */
    maxHp
    /** @type {number} */
    selectionRange
    /** @type {MovementCapability} */
    movements
    /** @type {Position} */
    position
    constructor() {
        this.name = ""
        this.maxHp = 1
        this.selectionRange = 0.6
        this.movements = new MovementCapability(0, 0, 0, MovementType.Walking)
        this.position = new Position(0, 0, 0)
    }

    /**
     * @param {string} value
     * @return {EntityFactory}
     */
    setName(value) { this.name = value; return this }

    /**
     * @param {number} value
     * @return {EntityFactory}
     */
    setMaxHp(value) { this.maxHp = value; return this }

    /**
     * @param {number} value
     * @return {EntityFactory}
     */
    setSelectionRange(value) { this.selectionRange = value; return this }

    /**
     * @param {MovementCapability} value
     * @return {EntityFactory}
     */
    setMovements(value) { this.movements = value; return this }

    /**
     * @param {Position} value
     * @return {EntityFactory}
     */
    setPosition(value) { this.position = value; return this }
}

export default class Entity {
    #name
    #maxHp
    #selectionRange
    /** @type {MovementCapability} */
    #movements
    /** @type {Position} */
    #position
    /** @type {Position} */
    #target
    /** @type {number} */
    #id
    /** @type {number} */
    static #idGenerator = 0

    static get factory() {
        return new EntityFactory()
    }
    static #getTileCenterPosition(position) {
        return new Position(position.x + 0.5, position.y + 0.5, position.rotation)
    }

    /**
     * @param {EntityFactory} factory
     */
    constructor(factory) {
        this.#id = Entity.#idGenerator++
        this.#name = factory.name
        this.#position = Entity.#getTileCenterPosition(factory.position)
        this.#movements = factory.movements
        this.#maxHp = factory.maxHp
        this.#selectionRange = factory.selectionRange
    }


    /**
     * move toward target
     * @param {number} frameDuration
     */
    act(frameDuration) {
        if (this.#target === undefined) {
            const pathFinding = globalThis.game.pathFinder.getNextTarget(this.#position, this.#movements.movementType)
            if (pathFinding === null) {
                return
            }
            this.#target = Entity.#getTileCenterPosition(pathFinding.target)
        }

        while (frameDuration > 0) {
            const moveResult = Position.move(this.#position, this.#target, this.#movements, frameDuration)
            this.#position = moveResult.position
            frameDuration = moveResult.remainingTime

            if (this.#target.distanceFrom(this.#position) < DISTANCE_EPSILON) {
                if (globalThis.game.map.targets.find(target => this.position.distanceFrom(Entity.#getTileCenterPosition(target)) < DISTANCE_EPSILON)) {
                    // globalThis.game.deleteEntity(this)
                    // return
                    this.#position.teleport(Entity.#getTileCenterPosition(globalThis.game.map.spawns[0]))
                }
                const pathFinding = globalThis.game.pathFinder.getNextTarget(this.#position, this.#movements.movementType)
                if (pathFinding === null) {
                    return
                }
                this.#target = Entity.#getTileCenterPosition(pathFinding.target)
            }
        }
    }

    get name() { return this.#name }
    get target() { return this.#target }
    get position() { return this.#position }
    get movements() { return this.#movements }
}

/**
 * @typedef {{
 *     hasBase: boolean,
 *     width: number,
 *     height: number,
 *     angleBetweenImages: number,
 *     animationSpeed: number
 * }} EntityImageMetaData
 */

/**
 * @param {string} name
 */
function registerEntityImages(name) {
    const imageContainer = document.getElementById("imageSources")

    const camelCaseName = name.replace(/(?:^\w|[A-Z]|\b\w)/g, function(word, index) {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');

    const angles = [0, 90, 180]
    const finalAngles = new Set()

    globalThis.entityImages[name] = {
        hasBase: false
    }
    for (const angle of angles) {
        const image = document.createElement("img")
        image.src = `/assets/images/units/${camelCaseName}/${angle}.png`
        imageContainer.appendChild(image)
        const correctedAngle = AngleUtils.clampAngleDeg(angle - 90)
        finalAngles.add(correctedAngle)
        globalThis.entityImages[name][correctedAngle] = image

        // if angle is 0, add 360 too to avoid having to do math later
        if (correctedAngle === 0) {
            finalAngles.add(360)
            globalThis.entityImages[name][360] = image
        }

        // unless top and bottom or already mirrored, add the mirrored image
        if (angle !== 0 && angle < 180) {
            finalAngles.add(AngleUtils.clampAngleDeg(270 - angle))
            image.onload = () => {
                const canvas = document.getElementById("utilsCanvas")
                canvas.width = image.width
                canvas.height = image.height
                const context = canvas.getContext("2d")
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.scale(-1, 1)
                context.drawImage(image, -canvas.width, 0)

                const rotatedImage = document.createElement("img")
                rotatedImage.src = canvas.toDataURL("image/png")
                imageContainer.appendChild(rotatedImage)
                globalThis.entityImages[name][AngleUtils.clampAngleDeg(270 - angle)] = rotatedImage
            }
        }
    }
    globalThis.entityImages[name].angles = Object.freeze([...finalAngles.values()])

}
registerEntityImages("enemy")
registerEntityImages("tower")
