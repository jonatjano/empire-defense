import Entity from "./Entity.js";
import Position from "../Position.js";
import MovementCapability from "../MovementCapability.js";

export default class TeleportingTarget extends Entity {
    #counter = 0

    constructor() {
        super({
            name: "Teleporting target",
            movements: new MovementCapability(0, 0, 0),
            position: new Position(0, 0),
            selectionRange: 0,
            canFly: true,
            baseHp: 1
        });
    }
    act(frameDuration) {
        this.#counter += frameDuration;
        if (this.#counter > 2000) {
            this.position.teleport(new Position(Math.random() * 15 + 1, Math.random() * 8 + 1))
            this.#counter -= 2000;
        }
    }
}