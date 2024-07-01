import Entity from "./Entity.js";
import Missile from "./Missile.js";
import {default as MovementCapability, MovementType} from "../MovementCapability.js";
import Unit from "./Unit.js";
import Position from "../Position.js";

export default class Building extends Entity {
    #attackCooldown = 0

    constructor(factory) {
        super(factory);
    }

    act(frameDuration) {
        const ATTACK_DELAY = 2000
        const ATTACK_RANGE = 10

        this.#attackCooldown = this.#attackCooldown - frameDuration

        if (this.#attackCooldown <= 0) {

            const targets = globalThis.game.getEntitiesCloseTo(this.position, ATTACK_RANGE, Unit)
            if (targets.length !== 0) {
                console.log("attak")
                this.#attackCooldown = ATTACK_DELAY

                targets.forEach(entity => {
                    const missile = new Missile(
                        Entity.factory
                            .setName("missile")
                            .setPosition(new Position(this.position.x, this.position.y - 1))
                            .setMovements(new MovementCapability(2, 360000, 5, MovementType.Unobstructed))
                    );
                    missile.target = entity
                    globalThis.game.addEntity(missile)
                })
            }
        }
    }
}