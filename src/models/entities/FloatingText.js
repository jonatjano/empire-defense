import MovementCapability, {MovementType} from "../MovementCapability.js"
import Position from "../Position.js"
import AbstractEntity, {EntityFactory} from "./AbstractEntity.js"

export default class FloatingText extends AbstractEntity {
	static LIFETIME = 1000
	static MOVEMENTS = new MovementCapability(0.3, 360, 360, MovementType.Unobstructed)
	/** @type {Position} */
	#target
	/** @type {number} */
	#lifetime
	/** @type {string} */
	#color

	constructor(name, color, position) {
		super(
			new EntityFactory()
				.setName(name)
				.setMovements(FloatingText.MOVEMENTS)
				.setPosition(position)
				.setDeathCallback(() => {})
		)
		this.#color = color
		this.#target = new Position(this.position.x, this.position.y - 100)
		this.#lifetime = FloatingText.LIFETIME
	}

	get color() { return this.#color }

	act(frameDuration) {
		if (this.#lifetime > 0) {
			this.position.teleport(Position.move(this.position, this.#target, this.movements, frameDuration).position)
			this.#lifetime -= frameDuration
		} else {
			this.hit(Infinity)
		}
	}
}
