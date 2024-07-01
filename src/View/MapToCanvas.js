import options from "../utils/Options.js";
import Position from "../models/Position.js";
import {MovementType} from "../models/MovementCapability.js";
import * as AngleUtils from "../utils/AngleUtils.js";
import {TextureType} from "../utils/TexturePack.js";
import GameMap from "../models/GameMap.js";
import Game from "../models/Game.js";

const TILE_MARGIN = -1

/**
 * @param {HTMLCanvasElement} canvas
 * @param {(x: number, y: number) => undefined} clickListener
 */
export function setCanvasEvent(canvas, clickListener) {
    const leftMargin = (canvas.width / options.zoom - game.map.width) / 2;
    const topMargin = (canvas.height / options.zoom - game.map.height) / 2;
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

/**
 * @param {HTMLCanvasElement} canvas
 * @param {CanvasRenderingContext2D} ctx
 * @param {Game | GameMap} game
 * @param {number} frameTiming used to take the right frame from animation
 */
export async function drawMap(canvas, ctx, game, frameTiming) {
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.textRendering = "optimizeLegibility"

    const map = game instanceof Game ? game.map : game
    const mapWidth = map.effectiveWidth
    const mapHeight = map.effectiveHeight

    const visibleLeftMargin = (canvas.width / options.zoom - mapWidth) / 2
    const visibleTopMargin = (canvas.height / options.zoom - mapHeight) / 2
    const leftMargin = (canvas.width / options.zoom - map.width) / 2;
    const topMargin = (canvas.height / options.zoom - map.height) / 2;

    // print map base
    await globalThis.options.texturePack.getTexture(`maps/${map.name}/base`).then(mapTexture => {
        ctx.drawImage(mapTexture.getBase(),
            visibleLeftMargin * options.zoom,
            visibleTopMargin * options.zoom,
            options.zoom * mapWidth,
            options.zoom * mapHeight
        )
    })
    const gridWeight = Math.max(1, Math.abs(TILE_MARGIN))
    if (globalThis.options.debug) {
        // draw the whole grid
        for (let y = 0; y <= map.height; y++) {
            ctx.fillRect(leftMargin * options.zoom - (gridWeight / 2), (topMargin + y) * options.zoom - (gridWeight / 2), map.width * options.zoom + gridWeight, gridWeight);
        }
        for (let x = 0; x <= map.width; x++) {
            ctx.fillRect((leftMargin + x) * options.zoom - (gridWeight / 2), topMargin * options.zoom - (gridWeight / 2), gridWeight, map.height * options.zoom + gridWeight);
        }
    } else {
        // draw the grid to the size of the visible map
        for (let y = 0; y <= mapHeight; y++) {
            ctx.fillRect(visibleLeftMargin * options.zoom - (gridWeight / 2), (visibleTopMargin + y) * options.zoom - (gridWeight / 2), mapWidth * options.zoom + gridWeight, gridWeight);
        }
        for (let x = 0; x <= mapWidth; x++) {
            ctx.fillRect((visibleLeftMargin + x) * options.zoom - (gridWeight / 2), visibleTopMargin * options.zoom - (gridWeight / 2), gridWeight, mapHeight * options.zoom + gridWeight);
        }

    }

    if (game instanceof GameMap) {
        globalThis.options.texturePack.getTexture(`maps/${map.name}/additions`).then(mapAdditionTexture => {
            if (mapAdditionTexture !== undefined) {
                ctx.drawImage(mapAdditionTexture.getBase(),
                    visibleLeftMargin * options.zoom,
                    visibleTopMargin * options.zoom,
                    options.zoom * mapWidth,
                    options.zoom * mapHeight
                )
            }
        })
        if (globalThis.options.debug) {
            for (let y = 0; y < map.height; y++) {
                for (let x = 0; x < map.width; x++) {
                    const tileOption = map.getTileOption(x, y)
                    ctx.fillText(`x: ${x}, y: ${y}, o: ${tileOption}`,
                        (leftMargin + x + 0.5) * options.zoom + TILE_MARGIN,
                        (topMargin + y + 0.2) * options.zoom + TILE_MARGIN,
                    )
                }
            }
        }
        return
    }
    /**
     * @param {MovementType} type
     * @return {number}
     */
    const movementTypeDrawPriority = type => {
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
        return (a.position.y + movementTypeDrawPriority(a.movements.movementType)) -
            (b.position.y + movementTypeDrawPriority(b.movements.movementType))
    })

    const packWidth = globalThis.options.texturePack.packMeta.width
    const packHeight = globalThis.options.texturePack.packMeta.height

    for (const entity of entities) {
        entity.texture.then(entityTexture => {
            const textureHorizontalSpan = Math.floor(entityTexture.width / packWidth)
            const textureLeftMargin = ((textureHorizontalSpan * packWidth) - entityTexture.width) / 2

            const textureVerticalSpan = Math.floor(entityTexture.height / packHeight)
            const textureTopMargin = ((textureVerticalSpan * packHeight) - entityTexture.height) / 2

            const heightFactor = entityTexture.height / packHeight

            /** @type {[number, number, number, number]} */
            const drawImageArgs = {
                dx: (leftMargin + entity.position.x - (textureHorizontalSpan - 0.5)) * options.zoom  + textureLeftMargin + TILE_MARGIN,
                dy: (topMargin + entity.position.y - (textureVerticalSpan - 0.5)) * options.zoom + textureTopMargin + TILE_MARGIN,
                dw: (entityTexture.width / packWidth) * options.zoom - 2 * TILE_MARGIN,
                dh: (entityTexture.height / packHeight) * options.zoom - 2 * TILE_MARGIN
            }

            if (entityTexture.textureType !== TextureType.ROTATION_ONLY) {
                ctx.drawImage(entityTexture.getBase(), drawImageArgs.dx, drawImageArgs.dy, drawImageArgs.dw, drawImageArgs.dh)
            }

            if (entityTexture.textureType !== TextureType.BASE_ONLY) {
                let angle = AngleUtils.rad2deg(AngleUtils.clampAngleRad(-entity.position.rotation))
                angle = angle + (entityTexture.angleBetweenRotations / 2)
                angle = angle - (angle % entityTexture.angleBetweenRotations)

                // console.log(angle, entityTexture.getForOrientation(angle))
                ctx.drawImage(
                    entityTexture.getForOrientation(angle),
                    0, entityTexture.height * (Math.floor(frameTiming / entityTexture.animationFrameDuration) % entityTexture.animationFrameCount),
                    entityTexture.width, entityTexture.height,
                    drawImageArgs.dx, drawImageArgs.dy, drawImageArgs.dw, drawImageArgs.dh,
                )
            }
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
        })
    }

    if (globalThis.options.debug) {
        // print pathfinding infos
        ctx.textRendering = "optimizeSpeed"
        ctx.fillStyle = `#000000`

        for (let y = 0; y < game.map.height; y++) {
            for (let x = 0; x < game.map.width; x++) {
                const tileOption = game.map.getTileOption(x, y)
                ctx.fillText(`x: ${x}, y: ${y}, o: ${tileOption}`,
                    (leftMargin + x + 0.5) * options.zoom + TILE_MARGIN,
                    (topMargin + y + 0.2) * options.zoom + TILE_MARGIN,
                )
            }
        }

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
        ctx.clearRect(0, 0, canvas.width, visibleTopMargin * options.zoom)
        ctx.clearRect(0, 0, visibleLeftMargin * options.zoom, canvas.height)
        ctx.clearRect(0, (visibleTopMargin + mapHeight) * options.zoom, canvas.width, canvas.height)
        ctx.clearRect((visibleLeftMargin + mapWidth) * options.zoom, 0, canvas.width, canvas.height)
    }

    globalThis.options.texturePack.getTexture(`maps/${game.map.name}/additions`).then(mapAdditionTexture => {
        if (mapAdditionTexture !== undefined) {
            ctx.drawImage(mapAdditionTexture.getBase(),
                visibleLeftMargin * options.zoom,
                visibleTopMargin * options.zoom,
                options.zoom * mapWidth,
                options.zoom * mapHeight
            )
        }
    })
}