import MovementCapability, {MovementType} from "../MovementCapability.js"
import Position from "../Position.js"
import AbstractEntity from "./AbstractEntity.js"

export default class FloatingText extends AbstractEntity {
	static LIFETIME = 1000
	static #movements = new MovementCapability(0.3, 360, 360, MovementType.Unobstructed)

	/** @return {MovementCapability} */
	static get movements() { return this.#movements }
	static get name() { return "FloatingText"; }

	/** @type {Position} */
	#target
	/** @type {number} */
	#lifetime
	/** @type {string} */
	#color
	/** @type {string} */
	#text


	constructor(text, color, position) {
		super(position, AbstractEntity.defaultDeathCallback, 1)
		this.#text = text
		this.#color = color
		this.#target = new Position(this.position.x, this.position.y - 100)
		this.#lifetime = FloatingText.LIFETIME
	}

	get color() { return this.#color }
	get text() { return this.#text; }

	act(frameDuration) {
		if (this.#lifetime > 0) {
			this.position.teleport(Position.move(this.position, this.#target, this.movements, frameDuration).position)
			this.#lifetime -= frameDuration
		} else {
			this.hit(Infinity)
		}
	}
}
