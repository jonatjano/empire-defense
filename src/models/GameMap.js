import Position from "./Position.js";
import Entities from "./entities/entities.js";

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
 * @param {string[]} waveData
 * @return {waveGroupData}
 */
function developWaveData(waveData) {
    const letterToEntityType = {
        "S": Entities.Squire,
        "F": Entities.Footman,
        "C": Entities.Cannoneer,
        "K": Entities.Knight,
        "B": Entities.Ram,
        "H": Entities.Champion,
        "Y": Entities.Harpy,
        "E": Entities.Elephant,
    }
    let count = 0;
    return waveData.map(row => {
        console.log(row);
        return [
            row.split("").reduce((acc, char) => {
                if (char === " ") {
                    // ignore
                } else if (char.match(/[0-9]/)) {
                    count = count * 10 + Number.parseInt(char)
                } else {
                    const entityType = letterToEntityType[char];
                    const spawnedCount = Math.max(count, 1)
                    for (let i = 0; i < spawnedCount; ++i) {
                        acc.push(entityType)
                    }
                    count = 0;
                }
                return acc
            }, [])
        ]
    })
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
        [{x: 21, y: 5}],
        {},
        developWaveData([
            "1S",
            "3S",
            "4S",
            "5S",
            "1F 5S",
            "8S",
            "10S",
            "12S",
            "5F",
            "6S 3F 10S",
            "5F",
            "2C",
            "8F",
            "10F",
            "17S 2C 5F",
            "4C",
            "10F",
            "20S",
            "1K",
            "2K 10S",
            "25S",
            "20F",
            "1B",
            "6C",
            "25S",
            "20F",
            "5K",
            "8C",
            "2H",
            "1Y",
            "1B 4F",
            "5K",
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
        developWaveData([
            "2S K 2S",
            "2K S 2K"
        ])
    )
])
