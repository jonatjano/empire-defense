import Position from "./Position.js";

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
    /** @type {{top: number, right: number, bottom: number, left: number}} */
    #borders

    /**
     * @param {string} name
     * @param {Array<Array<number>>} mapData
     * @param {{x: number, y: number}[]} spawns
     * @param {{x: number, y: number}[]} targets
     * @param {{[top]: number, [right]: number, [bottom]: number, [left]: number}} borders
     */
    constructor(name, mapData, spawns, targets, borders) {
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

    get name() {
        return this.#name
    }

    /**
     * @param {Position} position
     * @return {boolean}
     */
    positionIsValid(position){
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
 * @type {Readonly<{map: GameMap, waves: any[]}[]>}
 */
export const mapsData = Object.freeze([
    {
        map: new GameMap(
            "classic",
            mapDataFromString(`
                0000000000000000000
                0077777777777777700
                0077777777777777700
                0077777777777777700
                0077777777777777700
                3337777777777777333
                0077777777777777700
                0077777777777777700
                0077777777777777700
                0077777777777777700
                0077777777777777700
                0000000000000000000
                0000000000000000000
            `),
            [{x: 0, y: 5}],
            [{x: 18, y: 5}],
            {left: 1, right: 1}
        ),
        waves: [

        ]
    },
    {
        map: new GameMap(
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
            {}
        ),
        waves: [
            
        ]
    }
])
