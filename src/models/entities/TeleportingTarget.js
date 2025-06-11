import AbstractEntity from "./AbstractEntity.js";
import Position from "../Position.js";
import MovementCapability, {MovementType} from "../MovementCapability.js";

export default class TeleportingTarget extends AbstractEntity {
    #counter = 0

    constructor() {
        super(
            TeleportingTarget.factory
                .setName("Teleporting target")
                .setMovements(new MovementCapability(0, 0, 0, MovementType.Unobstructed))
                .setPosition(new Position(0, 0))
                .setMaxHp(1)
        )
    }

    act(frameDuration, currentTime) {
        this.#counter += frameDuration;
        if (this.#counter > 2000) {
            this.position.teleport(new Position(Math.random() * globalThis.game.map.width, Math.random() * globalThis.game.map.height))
            this.#counter -= 2000;
        }
    }
}
