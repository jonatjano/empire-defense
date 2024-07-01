import options from "../utils/Options.js";
import Position from "../models/Position.js";
import {MovementType} from "../models/MovementCapability.js";
import * as AngleUtils from "../utils/AngleUtils.js";
import Building from "../models/entities/Building.js";

const TILE_MARGIN = -1

function clearOffset(ctx, leftMargin, topMargin, map) {
    const BONUS = 10

    let func = ctx.clearRect.bind(ctx)
    if (globalThis.options.debug) {
        ctx.fillStyle = "#FF000033"
        func = ctx.fillRect.bind(ctx)
    }
    // top border
    func(leftMargin * options.zoom - BONUS, topMargin * options.zoom - BONUS, map.width * options.zoom + 2 * BONUS, map.offset.top * options.zoom + BONUS);
    // bottom border
    func(leftMargin * options.zoom - BONUS, (topMargin + map.height - map.offset.bottom) * options.zoom, map.width * options.zoom + 2 * BONUS, map.offset.bottom * options.zoom + BONUS);
    // left border
    func(leftMargin * options.zoom - BONUS, topMargin * options.zoom - BONUS, map.offset.left * options.zoom + BONUS, map.height * options.zoom + 2 * BONUS);
    // right border
    func((leftMargin + map.width - map.offset.right) * options.zoom, topMargin * options.zoom - BONUS, map.offset.right * options.zoom + BONUS, map.height * options.zoom + 2 * BONUS);

}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {GameMap} map
 * @param {(x: number, y: number) => undefined} [clickListener]
 */
export function printMapOnCanvas(canvas, map, clickListener) {
    console.log("drawing map")
    const leftMargin = (canvas.width / options.zoom - map.width) / 2;
    const topMargin = (canvas.height / options.zoom - map.height) / 2;
    const ctx = canvas.getContext('2d');
    clearCanvas(canvas, ctx)
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.textRendering = "optimizeLegibility"

    for (let y = 0; y < map.height; y++) {
        for (let x = 0; x < map.width; x++) {
            const tile = map.getTile(x, y)
            ctx.drawImage(
                globalThis.tileImages[tile.name],
                (leftMargin + x) * options.zoom + TILE_MARGIN,
                (topMargin + y) * options.zoom + TILE_MARGIN,
                options.zoom - 2 * TILE_MARGIN,
                options.zoom - 2 * TILE_MARGIN
            )
            if (globalThis.options.debug) {
                ctx.fillText(`x: ${x}, y: ${y}`,
                    (leftMargin + x + 0.5) * options.zoom + TILE_MARGIN,
                    (topMargin + y + 0.2) * options.zoom + TILE_MARGIN,
                )
            }
        }
    }

    clearOffset(ctx, leftMargin, topMargin, map);

    if (clickListener) {
        ctx.fillStyle = `#00000022`
        const gridWeight = Math.max(2, Math.abs(TILE_MARGIN))
        for (let y = 0; y < map.height; y++) {
            ctx.fillRect(leftMargin * options.zoom, (topMargin + y) * options.zoom - (gridWeight / 2), map.width * options.zoom, gridWeight);
        }
        for (let x = 0; x < map.width; x++) {
            ctx.fillRect((leftMargin + x) * options.zoom - (gridWeight / 2), topMargin * options.zoom, gridWeight, map.height * options.zoom);
        }
        canvas.ondragend = event => {
            console.log("drop", event)
        }
        canvas.onclick = event => {
            console.log(event)
            const boundingRect = canvas.getBoundingClientRect()
            const xRatio = canvas.width / boundingRect.width
            const yRatio = canvas.height / boundingRect.height
            const canvasX = event.x - boundingRect.left
            const canvasY = event.y - boundingRect.top
            const mapX = (canvasX * xRatio) / options.zoom - leftMargin
            const mapY = (canvasY * yRatio) / options.zoom - topMargin
            clickListener(mapX, mapY)
        }
    }
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {Game} game
 * @param {number} frameTiming used to take the right frame from animation
 */
export function drawEntities(canvas, ctx, game, frameTiming) {
    const leftMargin = (canvas.width / options.zoom - game.map.width) / 2;
    const topMargin = (canvas.height / options.zoom - game.map.height) / 2;
    clearCanvas(canvas, ctx)
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.textRendering = "optimizeLegibility"

    /**
     * @param {MovementType} type
     * @return {number}
     */
    const movementTypePriority = type => {
        switch (type) {
            case MovementType.Unobstructed: return 10
            case MovementType.Walking: return 0
            case MovementType.Flying: return 1
        }
    }

    /**
     * @type {Entity[]}
     */
    const entities = [...game.getEntities()].sort((a, b) => {
        return (a.position.y + movementTypePriority(a.movements.movementType)) -
            (b.position.y + movementTypePriority(b.movements.movementType))
    })


    for (const entity of entities) {
        const entityImages = globalThis.entityImages[entity.name]

        const heightFactor = entity instanceof Building ? 2 : 1

        // TODO move into entityImages to allow change between entities
        let ANIMATION_FRAME_DURATION = 1000
        if (entity.name === "missile") {
            ANIMATION_FRAME_DURATION = 500
        }
        let ANIMATION_FRAME_COUNT = 2
        if (entity.name === "tower") {
            ANIMATION_FRAME_COUNT = 1
        }
        let ANGLE_BETWEEN_ROTATIONS = 90
        if (entity.name === "missile") {
            ANGLE_BETWEEN_ROTATIONS = 15
        }

        if (entityImages.base) {
            ctx.drawImage(
                entityImages.base,
                (leftMargin + entity.position.x - 0.5) * options.zoom + TILE_MARGIN,
                (topMargin + entity.position.y - (heightFactor - 0.5)) * options.zoom + TILE_MARGIN,
                options.zoom - 2 * TILE_MARGIN,
                options.zoom - 2 * TILE_MARGIN
            )
        }

        let angle = AngleUtils.rad2deg(AngleUtils.clampAngleRad(-entity.position.rotation))
        angle = angle + (ANGLE_BETWEEN_ROTATIONS / 2)
        angle = angle - (angle % ANGLE_BETWEEN_ROTATIONS)

        ctx.drawImage(
            entityImages[angle],
            0,
            entityImages[angle].width * heightFactor * (Math.floor(frameTiming / ANIMATION_FRAME_DURATION) % ANIMATION_FRAME_COUNT),
            entityImages[angle].width,
            entityImages[angle].width * heightFactor,
            (leftMargin + entity.position.x - 0.5) * options.zoom + TILE_MARGIN,
            (topMargin + entity.position.y - (heightFactor - 0.5)) * options.zoom + TILE_MARGIN,
            options.zoom - 2 * TILE_MARGIN,
            heightFactor * options.zoom - 2 * TILE_MARGIN
        )
        if (globalThis.options.debug) {
            ctx.fillStyle = `#000000`
            // position text
            ctx.fillText(`x: ${(entity.position.x - 0.5).toFixed(1)}\ny: ${(entity.position.y - 0.5).toFixed(1)}\nr: ${(entity.position.rotation / (2 * Math.PI) * 360).toFixed(0)}`,
                (leftMargin + entity.position.x) * options.zoom + TILE_MARGIN,
                (topMargin + entity.position.y - (heightFactor - 0.6)) * options.zoom + TILE_MARGIN,
            )
            // forward dot
            ctx.fillRect(
                (leftMargin + entity.position.x) * options.zoom + TILE_MARGIN + Math.cos(entity.position.rotation) * 1000 * entity.movements.movementSpeed * options.zoom,
                (topMargin + entity.position.y) * options.zoom + TILE_MARGIN + Math.sin(entity.position.rotation) * 1000 * entity.movements.movementSpeed * options.zoom, 5, 5
            )
        }
    }

    if (globalThis.options.debug) {
        // print pathfinding infos
        ctx.textRendering = "optimizeSpeed"
        ctx.fillStyle = `#000000`
        for (let y = 0; y < game.map.height; y++) {
            for (let x = 0; x < game.map.width; x++) {
                const path = game.pathFinder.getNextTarget(new Position(x, y), MovementType.Walking)
                if (path) {
                    ctx.fillText((y * game.map.width + x).toString(),
                        (leftMargin + x + 0.5) * options.zoom + TILE_MARGIN,
                        (topMargin + y + 0.40) * options.zoom + TILE_MARGIN
                    )
                }
            }
        }

        Object.values(MovementType).forEach((movementType, i, array) => {
            switch (movementType) {
                case MovementType.Walking: ctx.fillStyle = `#000000`; break
                case MovementType.Flying: ctx.fillStyle = `#0000FF`; break
                case MovementType.Unobstructed: ctx.fillStyle = `#D3D3D3`; break
            }
            const textOffset = (i + 1) / (array.length + 1)
            for (let y = 0; y < game.map.height; y++) {
                for (let x = 0; x < game.map.width; x++) {
                        const path = game.pathFinder.getNextTarget(new Position(x, y), movementType)
                        if (path) {
                            ctx.fillText(path.value.toString(),
                                (leftMargin + x + textOffset) * options.zoom + TILE_MARGIN,
                                (topMargin + y + 0.55) * options.zoom + TILE_MARGIN
                            )
                            ctx.fillText(path.target.x === x ? (path.target.y > y ? 'v' : '^') : (path.target.x > x ? '>' : '<'),
                                (leftMargin + x + textOffset) * options.zoom + TILE_MARGIN,
                                (topMargin + y + 0.7) * options.zoom + TILE_MARGIN
                            )
                            ctx.fillText((path.target.y * game.map.width + path.target.x).toString(),
                            // ctx.fillText((path.target.y * game.map.width + path.target.x).toString(),
                                (leftMargin + x + textOffset) * options.zoom + TILE_MARGIN,
                                (topMargin + y + 0.85) * options.zoom + TILE_MARGIN
                            )
                        }
                }
            }
        })
    } else {
        clearOffset(ctx, leftMargin, topMargin, game.map);
    }
}

function clearCanvas(canvas, ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}