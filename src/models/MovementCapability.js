import * as AngleUtils from "../utils/AngleUtils.js"

export const DISTANCE_EPSILON = 0.01

export const MovementType = Object.freeze({
    Unobstructed: 0,
    Walking: 1,
    Flying: 2
})

export default class MovementCapability {
    /** @type {MovementType} */
    #movementType
    /** @type {number} pixel per millisecond */
    #movementSpeed
    /** @type {number} rad per millisecond */
    #rotationSpeed
    /** @type {number} in rad */
    #maxAngleToMove

    /**
     * @param {number} movementSpeed tile per second
     * @param {number} rotationSpeed degree per second
     * @param {number} maxAngleToMove degree
     * @param {typeof MovementType} movementType
     */
    constructor(movementSpeed, rotationSpeed, maxAngleToMove, movementType = MovementType.Walking) {
        this.#movementSpeed = movementSpeed / 1000
        this.#rotationSpeed = AngleUtils.deg2rad(rotationSpeed) / 1000
        this.#maxAngleToMove = AngleUtils.deg2rad(maxAngleToMove)
        this.#movementType = movementType
    }

    /** @return {typeof MovementType} */
    get movementType() { return this.#movementType }
    /** @return {number} pixel per millisecond */
    get movementSpeed() { return this.#movementSpeed }
    /** @return {number} rad per millisecond */
    get rotationSpeed() { return this.#rotationSpeed }
    /** @return {number} in rad */
    get maxAngleToMove() { return this.#maxAngleToMove }
}