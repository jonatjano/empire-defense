import Position from "./Position.js";
import entities from "./entities/entities.js";

export const TileOption = {
    walkable: 1 << 0,
    flyable: 1 << 1,
    buildable: 1 << 2,

    /**
     * @param {number} option
     * @param {number} value
     * @return {boolean}
     */
    is(option, value) {
        return (value & option) !== 0;
    },

    from(value) {
        return parseInt(value, 32)
    }
}

export default class GameMap {
    /** @type {string} */
    #name
    /** @type {Array<Array<number>>} */
    #mapData
    /** @type {Readonly<Position[]>} */
    #spawns
    /** @type {Readonly<Position[]>} */
    #targets
    // TODO remove
    /** @type {{top: number, right: number, bottom: number, left: number}} */
    #borders
    /** @type {Readonly<waveGroupData>} */
    #waves

    /**
     * @param {string} name
     * @param {Array<Array<number>>} mapData
     * @param {{x: number, y: number}[]} spawns
     * @param {{x: number, y: number}[]} targets
     * @param {{[top]: number, [right]: number, [bottom]: number, [left]: number}} borders
     * @param {waveGroupData} waves
     */
    constructor(name, mapData, spawns, targets, borders, waves) {
        this.#borders = {top: 0, right: 0, bottom: 0, left: 0, ...borders}

        if (spawns.length === 0 || targets.length === 0) {
            console.error("spawns: ", spawns)
            console.error("targets: ", targets)
            throw new Error("Tried to construct a gameMap without spawn or target");
        }

        this.#name = name
        this.#mapData = mapData
        this.#spawns = Object.freeze(spawns.map(({x, y}) => new Position(x, y)))
        this.#targets = Object.freeze(targets.map(({x, y}) => new Position(x, y)))
        this.#waves = Object.freeze(waves)
    }

    get height() {
        return this.#mapData.length
    }
    get effectiveHeight() {
        return this.height - this.borders.top - this.borders.bottom
    }

    get width() {
        return this.#mapData[0].length
    }
    get effectiveWidth() {
        return this.width - this.borders.left - this.borders.right
    }

    get borders() {
        return this.#borders;
    }

    getTileOption(x, y) {
        return this.#mapData[y][x];
    }

    /**
     * @return {Readonly<Position[]>}
     */
    get spawns() { return this.#spawns }

    /**
     * @return {Readonly<Position[]>}
     */
    get targets() { return this.#targets }

    /**
     * @return {Readonly<waveGroupData>}
     */
    get waves() { return this.#waves }

    get name() {
        return this.#name
    }

    /**
     * @param {Position} position
     * @return {boolean}
     */
    positionIsInBoundaries(position){
        return position.x >= 0 && position.y >= 0 && position.x < this.width && position.y < this.height
    }
}

/**
 * @param {string} template
 * @return {number[][]}
 */
function mapDataFromString(template) {
    const width = template.split("\n")
        .map(row => row.replaceAll(/\W/g, ""))
        .find(row => row.length !== 0)?.length

    const height = template.split("\n")
        .map(row => row.replaceAll(/\W/g, ""))
        .filter(row => row.length !== 0)
        .length

    // check that the parameters are correct
    if (width !== undefined && width < 1 && height < 1) {
        throw new Error(`Can't generate map from given data, width = ${width}, height = ${height}, template = ${template}`);
    }

    // remove invisible characters from the template
    template = template.replaceAll(/\W/g, '')
    console.log(template)

    return new Array(height).fill(0).map((_, y) =>
        new Array(width).fill(0).map((_, x) => {
            // todo view if there isn't an inversion between x and y (again T_T)
            return TileOption.from(template[y * width + x])
        })
    )
}

/**
 * @param {unprocessedWaveGroupData} waveData
 * @return {waveGroupData}
 */
function developWaveData(waveData) {
    return waveData.map(wave => wave.map(spawn => spawn.reduce((acc, unit) => {
        if (Array.isArray(unit)) {
            for (let i = 0; i < unit[0]; i++) {
                acc.push(unit[1])
            }
        } else {
            acc.push(unit)
        }
        return acc
    }, [])))
}

/** @typedef {unprocessedWaveData[]} unprocessedWaveGroupData */
/** @typedef {unprocessedSpawnData[]} unprocessedWaveData */
/** @typedef {unprocessedUnitData[]} unprocessedSpawnData */
/** @typedef {(typeof AbstractEntity) | [number, typeof AbstractEntity]} unprocessedUnitData */
/** @typedef {waveData[]} waveGroupData */
/** @typedef {spawnData[]} waveData */
/** @typedef {(typeof AbstractEntity)[]} spawnData */

/**
 * @type {ReadonlyArray<GameMap>}>}
 */
export const mapsData = Object.freeze([
    new GameMap(
        "classic",
        mapDataFromString(`
            0000000000000000000000
            0777777777777777777770
            0777777777777777777770
            0777777777777777777770
            0777777777777777777770
            3377777777777777777733
            0777777777777777777770
            0777777777777777777770
            0777777777777777777770
            0777777777777777777770
            0777777777777777777770
            0000000000000000000000
            0000000000000000000000
        `),
        [{x: 0, y: 5}],
        [{x: 13, y: 5}],
        {},
        developWaveData([
            [[ // wave 1
                [2, entities.Squire],
                entities.knight,
                [2, entities.Squire]
            ]],
            [[ // wave 2
                [2, entities.knight],
                entities.Squire,
                [2, entities.knight]
            ]]
        ])
    ),
    new GameMap(
        "test",
        mapDataFromString(`
            27772
            73737
            77777
            77277
            27772
            `
        ),
        [{x: 1, y: 1}],
        [{x: 3, y: 1}],
        {},
        [[ // wave 1
            [2, entities.Squire],
            entities.knight,
            [2, entities.Squire]
        ]],
        [[ // wave 2
            [2, entities.knight],
            entities.Squire,
            [2, entities.knight]
        ]]
    )
])
