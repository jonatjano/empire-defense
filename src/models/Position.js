import * as AngleUtils from "../utils/AngleUtils.js";
import {DISTANCE_EPSILON} from "./MovementCapability.js";

export default class Position {
    #x
    #y
    /**
     * @type {number}
     * always between 0 and 2*PI
     */
    #rotation

    /**
     * @param {Position} x
     *//**
     * @param {number} x
     * @param {number} y
     * @param {number} rotation
     *//**
     * don't use this overload, it is here to please the type system
     * @param {number | Position} x
     * @param {number} [y]
     * @param {number} [rotation]
     */
    constructor(x, y, rotation = 0) {
        this.teleport(x, y, rotation)
    }

    /**
     * set the rotation to value % 2PI
     * @param {number} value
     */
    set rotation(value) {
        this.#rotation = AngleUtils.clampAngleRad(value)
    }
    get x() { return this.#x }
    get y() { return this.#y }
    get rotation() { return this.#rotation }

    teleport(x, y, rotation) {
        if (x instanceof Position) {
            this.#x = x.#x
            this.#y = x.#y
            this.rotation = x.#rotation
        } else {
            this.#x = x
            this.#y = y
            this.rotation = rotation
        }
    }

    /**
     * @param {Position} other
     * @return {number}
     *//**
     * @param {number} other
     * @param {number} y
     * @return {number}
     *//**
     * @param {Position | number} other
     * @param {number} [y]
     * @return {number}
     */
    distanceFrom(other, y) {
        if (other instanceof Position) {
            const dx = other.x - this.x
            const dy = other.y - this.y
            return Math.sqrt(dx * dx + dy * dy)
        } else {
            const dx = other - this.x
            const dy = y - this.y
            return Math.sqrt(dx * dx + dy * dy)
        }
    }

    /**
     * @param {Position} other
     * @return {boolean}
     *//**
     * @param {number} other
     * @param {number} y
     * @return {boolean}
     *//**
     * @param {Position | number} other
     * @param {number} [y]
     * @return {boolean}
     */
    equals(other, y) {
        return this.distanceFrom(other, y) <= DISTANCE_EPSILON
    }

    /**
     * @param {Position} from
     * @param {Position} to
     * @param {MovementCapability} movements
     * @param {number} duration duration available for the movement in millisecond
     * @return {{position: Position, remainingTime: number}} the new position
     */
    static move(from, to, movements, duration) {
        const result = new Position(from)

        // calculate movement angle
        const movementAngle = AngleUtils.clampAngleRad(Math.atan2(to.y - from.y, to.x - from.x))

        // get a rotation delta in [-pi; pi] to avoid doing a full turn
        let rotationDelta = movementAngle - from.#rotation
        if (rotationDelta < - Math.PI) { rotationDelta += 2*Math.PI }
        if (rotationDelta > Math.PI) { rotationDelta -= 2*Math.PI }

        // if the rotation delta is too high to move, rotate first
        if (Math.abs(rotationDelta) >= movements.maxAngleToMove) {
            const neededTime = (Math.abs(rotationDelta) - movements.maxAngleToMove) / movements.rotationSpeed
            if (neededTime > duration) {
                result.rotation += rotationDelta * duration / neededTime
                console.log("could only rotate")
                return {position: result, remainingTime: 0}
            }
            result.rotation += rotationDelta
            duration -= neededTime
        }

        // FIXME currently have a kind of ease out at the end of the rotation, doesn't affect movement speed

        // get the new rotation delta in [-pi; pi] to avoid doing a full turn
        rotationDelta = result.#rotation - movementAngle
        if (rotationDelta < - Math.PI) { rotationDelta += 2*Math.PI }
        if (rotationDelta > Math.PI) { rotationDelta -= 2*Math.PI }
        const rotationDirection = Math.sign(rotationDelta)

        // calculate the times needed to end the movement, Infinity indicate that we're good
        const neededTimes = {
            x: Math.cos(movementAngle) === 0 ? Infinity : ((to.#x - result.#x) / (Math.cos(movementAngle) * movements.movementSpeed)),
            y: Math.sin(movementAngle) === 0 ? Infinity : ((to.#y - result.#y) / (Math.sin(movementAngle) * movements.movementSpeed)),
            t: Math.abs(rotationDelta) / movements.rotationSpeed,
        }
        Object.entries(neededTimes).forEach(([key, value]) => neededTimes[key] = Math.abs(value) < 0.001 ? Infinity : value)

        // while we have some time and a need to move, move according to the movement requiring the less time
        while (duration > 0 && (neededTimes.x !== Infinity || neededTimes.y !== Infinity || neededTimes.t !== Infinity)) {
            let time = Math.min(duration, neededTimes.x, neededTimes.y, neededTimes.t)
            result.#x += Math.cos(movementAngle) * movements.movementSpeed * (neededTimes.x !== Infinity ? time : 0)
            result.#y += Math.sin(movementAngle) * movements.movementSpeed * (neededTimes.y !== Infinity ? time : 0)
            result.rotation -= movements.rotationSpeed * rotationDirection * (neededTimes.t !== Infinity ? time : 0)
            duration -= time
            // set neededTimes to Infinity if we don't need them anymore
            Object.entries(neededTimes).forEach(([key, value]) => neededTimes[key] = value === time ? Infinity : value - time)
        }

        // this is an error I had during dev, but should not happen anymore
        if (Number.isNaN(result.#x) || Number.isNaN(result.#y) || Number.isNaN(result.#rotation)) {
            console.error("movement resulted in NaNs", from, to, result)
            return {position: from, remainingTime: 0}
        }
        return {position: result, remainingTime: duration}
    }

    static getTileCenterPosition(position) {
        return new Position(Math.floor(position.x) + 0.5, Math.floor(position.y) + 0.5, position.rotation)
    }
}