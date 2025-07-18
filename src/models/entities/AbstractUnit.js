import AbstractEntity, {AnimationKeys} from "./AbstractEntity.js"
import Position from "../Position.js";

export function unitFactory(name, movement, killReward, killCrystalReward, hpFunction) {
    return class extends AbstractUnit {
        static #movements = movement
        static get movements() { return this.#movements }
        static get name() { return name; }
        static get killReward() { return killReward }
        static get killCrystalReward() { return killCrystalReward }

        constructor(position, deathCallback, wave) {
            super(position, deathCallback, hpFunction(wave));
        }
    }
}

export default class AbstractUnit extends AbstractEntity {
    static get killReward() { return 0 }
    get killReward() { return this.__proto__.constructor.killReward }
    static get killCrystalReward() { return 0 }
    get killCrystalReward() { return this.__proto__.constructor.killCrystalReward }

    constructor(position, deathCallback, maxHp) {
        super(position, deathCallback, maxHp);
    }

	hit(damage) {
		this.abstractHit(damage, false)
		if (this.hp <= 0) {
			this.setAnimation(AnimationKeys.DEAD, globalThis.game.currentFrameTiming)
				.catch(() => { this.hit(Infinity) })
				.finally(() => {
					this.callDeathCallback()
				})
		}
	}

    act(frameDuration, currentTime) {
	    switch (this.animationDetails.name) {
		    case AnimationKeys.WALK: {
			    if (this.target === undefined) {
				    const pathFinding = globalThis.game.pathFinder.getNextTarget(this.position, this.movements.movementType)
				    if (pathFinding === null) {
					    return
				    }
				    this.target = Position.getTileCenterPosition(pathFinding.target)
			    }

			    while (frameDuration > 0) {
				    const moveResult = Position.move(this.position, this.target, this.movements, frameDuration)
				    this.position.teleport(moveResult.position)
				    frameDuration = moveResult.remainingTime

				    if (this.target.equals(this.position)) {
					    if (globalThis.game.map.targets.find(target => this.position.equals(Position.getTileCenterPosition(target)))) {
						    // TODO
						    // this.hit(Infinity)
						    // return
						    this.position.teleport(Position.getTileCenterPosition(globalThis.game.map.spawns[0]))
					    }
					    const pathFinding = globalThis.game.pathFinder.getNextTarget(this.position, this.movements.movementType)
					    if (pathFinding === null) {
						    return
					    }
					    this.target = Position.getTileCenterPosition(pathFinding.target)
				    }
			    }
			    break
		    }
		    case AnimationKeys.DEAD: {
			    if (currentTime > this.animationDetails.end) {
				    this.abstractHit(Infinity)
			    }
			    break
		    }
	    }
    }

    get texture() { return globalThis.options.texturePack.getTexture(`entities/units/${this.__proto__.constructor.name.toLowerCase()}`) }
}
