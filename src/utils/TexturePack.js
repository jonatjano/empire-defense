import * as AngleUtils from "./AngleUtils.js";
import entities from "../models/entities/entities.js";
import AbstractBuilding from "../models/entities/AbstractBuilding.js";
import AbstractProjectile from "../models/entities/AbstractProjectile.js";
import AbstractUnit from "../models/entities/AbstractUnit.js";

export const TextureType = {
    IMAGE: Symbol("IMAGE"),
    ROTATION_AND_BASE: Symbol("ROTATION_AND_BASE"),
    ROTATION_ONLY: Symbol("ROTATION_ONLY"),
    BASE_ONLY: Symbol("BASE_ONLY")
}

const DEFAULTS = {
    extension: "png",
    animationFrameDuration: 1000,
    angleBetweenRotations: 90,
    isSymmetric: true,
    textureType: TextureType.IMAGE,
    pixelSize: 128,
    worldSize: 1,
    entities: {
        textureType: TextureType.ROTATION_ONLY,
        buildings: {
            textureType: TextureType.ROTATION_AND_BASE,
            pixelHeight: 256,
            worldHeight: 2,
            // archer: { textureType: TextureType.BASE_ONLY }
        },
        projectiles: {
            angleBetweenRotations: 15,
            animationFrameDuration: 500
        }
    }
}

class TextureMeta {
    /** @type {TextureMeta | null} */
    #parent
    /** @type {string} */
    #extension
    /** @type {number} */
    #animationFrameDuration
    /** @type {number} */
    #angleBetweenRotations
    /** @type {boolean} */
    #isSymmetric
    /** @type {TextureType} */
    #textureType
    /** @type {number} */
    #pixelWidth
    /** @type {number} */
    #pixelHeight
    /** @type {number} */
    #worldWidth
    /** @type {number} */
    #worldHeight

    constructor(parent, {extension, animationFrameDuration, angleBetweenRotations, isSymmetric, textureType, pixelWidth, pixelHeight, pixelSize, worldWidth, worldHeight, worldSize}) {
        this.#parent = parent

        this.#extension = extension
        this.#animationFrameDuration = animationFrameDuration
        this.#angleBetweenRotations = angleBetweenRotations
        this.#isSymmetric = isSymmetric
        this.#textureType = typeof textureType === "string" ? TextureType[textureType] : textureType
        this.#pixelWidth = pixelWidth ?? pixelSize
        this.#pixelHeight = pixelHeight ?? pixelSize
        this.#worldWidth = worldWidth ?? worldSize
        this.#worldHeight = worldHeight ?? worldSize
    }

    /** @return {string} */
    get extension() { return this.#extension ?? this.#parent.extension }
    /** @return {number} */
    get animationFrameDuration() { return this.#animationFrameDuration ?? this.#parent.animationFrameDuration }
    /** @return {number} */
    get angleBetweenRotations() { return this.#angleBetweenRotations ?? this.#parent.angleBetweenRotations }
    /** @return {TextureType} */
    get textureType() { return this.#textureType ?? this.#parent.textureType }
    /** @return {boolean} */
    get isSymmetric() { return this.#isSymmetric ?? this.#parent.isSymmetric }
    /** @return {number} */
    get pixelWidth() { return this.#pixelWidth ?? this.#parent.pixelWidth }
    /** @return {number} */
    get pixelHeight() { return this.#pixelHeight ?? this.#parent.pixelHeight }
    /** @return {number} */
    get worldWidth() { return this.#worldWidth ?? this.#parent.worldWidth }
    /** @return {number} */
    get worldHeight() { return this.#worldHeight ?? this.#parent.worldHeight }
}

const textureListLeaf = Symbol()
const textureList = {
    // keep first here to ensure it is present when trying to frame other images
    frame: textureListLeaf,

    // {buildings: {archer: textureListLeaf, ...}, ...}
    entities: Object.values(entities).reduce(
        (acc, klass) => {
            switch (klass.__proto__) {
                case AbstractBuilding: {
                    acc.buildings[klass.name.toLowerCase()] = textureListLeaf
                    break
                }
                case AbstractProjectile: {
                    acc.projectiles[klass.name.toLowerCase()] = textureListLeaf
                    break
                }
                case AbstractUnit: {
                    acc.units[klass.name.toLowerCase()] = textureListLeaf
                    break
                }
            }
            return acc
        },
        {buildings: {}, projectiles: {}, units: {}}
    ),
    icons: {
        money: textureListLeaf,
        life: textureListLeaf,
        crystal: textureListLeaf,
        wave: textureListLeaf,
        option: textureListLeaf,
        speed1: textureListLeaf,
        speed2: textureListLeaf,
        speed5: textureListLeaf,
        zoomIn: textureListLeaf,
        zoomOut: textureListLeaf,
    },
    maps: {
        classic: textureListLeaf,
        test: textureListLeaf
    },
}

export default class TexturePack {
    /**
     * the rotation we want portrayed in the framed variant, the closest if not available
     * @type {Number}
     */
    static get framedRotation() {return 60};

    /** @type {string} */
    #name
    /** @type {Map<string, Texture>} */
    #textures
    /** @type {Promise} */
    #initPromise
    /** @type {TextureMeta} */
    #packMeta

    constructor(name) {
        this.#name = name
        this.#textures = null
        this.#initPromise = null
    }

    get name() { return this.#name }
    get packMeta() { return this.#packMeta }

    /**
     * @param {string} path
     * @return {Promise<Texture>}
     */
    async getTexture(path) {
        if (this.#textures === null && this.#initPromise === null) {
            this.#initPromise = fetch(`/assets/images/${this.#name}/pack.json`)
                .then(res => res.blob())
                .then(blob => this.init(blob))
        }
        await this.#initPromise
        return this.#textures.get(path)
    }

    /**
     * @param {Blob} packJsonBlob
     * @param {File[]} [files] only used for webkitDirectory
     * @return {Promise}
     */
    init(packJsonBlob, files) {
        const isWebkitDirectory = files !== undefined
        this.#initPromise = packJsonBlob.text()
            .then(async content => {
                const packMeta = JSON.parse(content)

                /** @type {[string[], TextureMeta, (Object<string, Object | symbol> | symbol)][]}  */
                const toGet = [[[], null, textureList]]
                /** @type {{[key: string]: Texture}} */
                const textures = {}
                const promises = []

                while(toGet.length !== 0) {
                    const [path, localMeta, item] = toGet.shift()
                    if (item === textureListLeaf) {
                        let localDefault = DEFAULTS
                        let localPackMeta = packMeta
                        for (const part of path) {
                            localDefault = localDefault?.[part]
                            localPackMeta = localPackMeta?.[part]
                        }
                        const texturePromise = isWebkitDirectory ?
                            Texture.forWebkitDirectory(files, path, this.#name, new TextureMeta(localMeta, {...localDefault, ...localPackMeta})) :
                            Texture.for(path, this.#name, new TextureMeta(localMeta, {...localDefault, ...localPackMeta}))
                        if (path.join("/") === "frame") {
                            const texture = await texturePromise
                            textures[path.join("/")] = texture
                            promises.push(texture.makeFramed(textures.frame, this.#name))
                        } else {
                            promises.push(
                                texturePromise
                                    .then(texture => textures[path.join("/")] = texture )
                                    .then(texture => texture.makeFramed(textures.frame, this.#name) )
                            )
                        }
                    } else {
                        let localDefault = DEFAULTS
                        let localPackMeta = packMeta
                        for (const part of path) {
                            localDefault = localDefault?.[part]
                            localPackMeta = localPackMeta?.[part]
                        }
                        const textureMeta = new TextureMeta(localMeta, {...localDefault, ...localPackMeta})
                        if (localMeta === null) { this.#packMeta  = textureMeta }
                        Object.keys(item).forEach(key => {
                            toGet.push(
                                [
                                    [...path, key],
                                    textureMeta,
                                    item[key]
                                ]
                            )
                        })
                    }
                }
                await Promise.all(promises)
                this.#textures = new Map()
                ;[...Object.entries(textures)].forEach(([key, item]) => this.#textures.set(key, item))
            })

        return this.#initPromise
    }

    static getHtmlTextureContainerFor(texturePackName, closeOthers = true) {
        let texturesDiv = document.getElementById("textures")
        let texturePackDetails = texturesDiv.querySelector(`#${texturePackName}`)
        if (texturePackDetails === null) {
            if (closeOthers) {
                texturesDiv.querySelectorAll("details").forEach(detail => detail.open = false)
            }

            texturePackDetails = document.createElement("details")
            texturePackDetails.id = texturePackName
            texturePackDetails.open = true

            const texturePackSummary = document.createElement("summary")
            texturePackSummary.textContent = texturePackName
            texturePackDetails.append(texturePackSummary)

            const div = document.createElement("div")
            div.classList.add("textures-grid")
            texturePackDetails.append(div)

            texturesDiv.appendChild(texturePackDetails)
        }

        return texturePackDetails.querySelector("& > div")
    }

    changeDocumentTextures() {
        const elements = document.body.querySelectorAll("*[data-texture]")
        elements.forEach(element => this.changeElementTexture(element))
    }

    /** @param {HTMLImageElement} element */
    async changeElementTexture(element) {
        if (element.dataset.texture.startsWith("framed/")) {
            element.setAttribute("src", (await this.getTexture(element.dataset.texture.substring("framed/".length))).getFramed().src)
        } else {
            element.setAttribute("src", (await this.getTexture(element.dataset.texture)).getBase().src)
        }
    }
}


class Texture {
    static #idGenerator = 0;
    #id = Texture.#idGenerator++;

    /** @type {Symbol} */
    static #baseMarker = Symbol("Texture.baseMarker")
    /** @type {Symbol} */
    static #framedMarker = Symbol("Texture.framedMarker")

    /**
     * the scale applied to the image when framed
     * @type {Number}
     */
    static #frameScale = 75/100;

    /** @type {TextureMeta} */
    #meta
    /** @type {Map<number | Symbol, HTMLImageElement>} */
    #imageElements = new Map()

    constructor(meta) {
        this.#meta = meta
    }

    /**
     * @param {number | Symbol} orientation
     * @return {HTMLImageElement}
     */
    getForOrientation(orientation) { return this.#imageElements.get(orientation) }
    /** @return {HTMLImageElement} */
    getBase() { return this.getForOrientation(Texture.#baseMarker) }
    /** @return {HTMLImageElement} */
    getFramed() { return this.getForOrientation(Texture.#framedMarker) }

    get animationFrameDuration() { return this.#meta.animationFrameDuration }
    get animationFrameCount() { return this.getForOrientation(0).height / this.pixelHeight }
    get animationFrameCountForBase() { return this.getForOrientation(Texture.#baseMarker).height / this.pixelHeight }
    get angleBetweenRotations() { return this.#meta.angleBetweenRotations }
    /** @return {TextureType} */
    get textureType() { return this.#meta.textureType }
    get pixelWidth() { return this.#meta.pixelWidth }
    get pixelHeight() { return this.#meta.pixelHeight; }
    get worldWidth() { return this.#meta.worldWidth }
    get worldHeight() { return this.#meta.worldHeight; }

    /**
     * @param {Texture} frame
     * @param {string} texturePackName
     * @return {Promise<>}
     */
    makeFramed(frame, texturePackName) {
        // TODO animation
        if (this.#imageElements.has(Texture.#framedMarker)) {
            return new Promise(() => {})
        }


        // get the canvas
        const canvas = document.getElementById("utilsCanvas")
        canvas.width = this.#meta.pixelWidth / this.#meta.worldWidth
        canvas.height = this.#meta.pixelHeight / this.#meta.worldHeight

        const marginLeft = (1 - Texture.#frameScale) / 2
        const marginTop = marginLeft // this.#meta.worldHeight === 1 ? marginLeft : 0
        const scale = Texture.#frameScale

        // paste the image reversed left<->right on it
        const context = canvas.getContext("2d")
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (this.#meta.textureType === TextureType.IMAGE) {
            context.drawImage(this.getBase(), canvas.width * marginLeft, canvas.height * marginTop, canvas.width * scale, canvas.height * scale)
        }
        if (this.#meta.textureType === TextureType.BASE_ONLY || this.#meta.textureType === TextureType.ROTATION_AND_BASE) {
            context.drawImage(this.getBase(), 0, 0, this.#meta.pixelWidth / this.#meta.worldWidth, this.#meta.pixelHeight, canvas.width * marginLeft, canvas.height * marginTop, canvas.width * scale, this.#meta.pixelHeight * scale)
        }
        if (this.#meta.textureType === TextureType.ROTATION_ONLY || this.#meta.textureType === TextureType.ROTATION_AND_BASE) {
            const framedRotation = Math.ceil(TexturePack.framedRotation / this.#meta.angleBetweenRotations) * this.#meta.angleBetweenRotations
            context.drawImage(this.getForOrientation(framedRotation), 0, 0, this.#meta.pixelWidth / this.#meta.worldWidth, this.#meta.pixelHeight, canvas.width * marginLeft, canvas.height * marginTop, canvas.width * scale, this.#meta.pixelHeight * scale)
        }
        context.drawImage(frame.getBase(), 0, 0, canvas.width, canvas.height)

        // create a new image element with the rotated image
        const framedImage = document.createElement("img")
        framedImage.classList.add("framed")
        framedImage.src = canvas.toDataURL("image/png")
        framedImage.style.order = this.#id.toString(10)
        TexturePack.getHtmlTextureContainerFor(texturePackName).appendChild(framedImage)
        this.#imageElements.set(Texture.#framedMarker, framedImage)
        return new Promise((resolve, reject) => {
            framedImage.onload = resolve
            framedImage.onerror = reject
        })
    }

    /**
     * @param {string[]} path
     * @param {string} texturePackName
     * @param {TextureMeta} textureMeta
     * @return {Promise<Texture>}
     */
    static for(path, texturePackName, textureMeta) {
        const result = new Texture(textureMeta)
        const texturesDiv = TexturePack.getHtmlTextureContainerFor(texturePackName)
        /** @type {Promise[]} */
        const promises = []

        if (textureMeta.textureType === TextureType.IMAGE) {
            const image = document.createElement("img")
            image.src = `/assets/images/${texturePackName}/${path.join("/")}.${textureMeta.extension}`
            image.style.order = result.#id.toString(10)
            texturesDiv.appendChild(image)
            result.#imageElements.set(Texture.#baseMarker, image)
            return new Promise((res, err) => {
                image.onload = () => { res(result) }
                image.onerror = error => { err(`Couldn't load texture for path ${path.join("/")}: ${typeof error === "string" ? error : error.type}`) }
            })
        }

        if (textureMeta.textureType !== TextureType.BASE_ONLY && (360 % textureMeta.angleBetweenRotations) !== 0) {
            console.error("Given textureMeta angle isn't valid", textureMeta)
            throw new TypeError("Given textureMeta angle isn't valid")
        }

        if (textureMeta.textureType !== TextureType.ROTATION_ONLY) {
            const image = document.createElement("img")
            image.src = `/assets/images/${texturePackName}/${path.join("/")}/base.${textureMeta.extension}`
            image.style.order = result.#id.toString(10)
            texturesDiv.appendChild(image)
            result.#imageElements.set(Texture.#baseMarker, image)
            promises.push(new Promise((res, err) => {
                image.onload = () => { res(Texture.#baseMarker) }
                image.onerror = error => { err(`Couldn't load texture for path ${path.join("/")}/base: ${typeof error === "string" ? error : error.type}`) }
            }))
        }

        if (textureMeta.textureType === TextureType.BASE_ONLY) {
            return Promise.all(promises).then(() => result)
        }

        let angle = 0
        while (angle < 360) {
            if (angle <= 180 || (angle > 180 && ! textureMeta.isSymmetric)) {
                const hoistedAngle = angle
                const image = document.createElement("img")
                image.style.order = result.#id.toString(10)
                image.src = `/assets/images/${texturePackName}/${path.join("/")}/${angle}.${textureMeta.extension}`
                texturesDiv.appendChild(image)
                result.#imageElements.set(hoistedAngle, image)
                if (hoistedAngle === 0) {
                    result.#imageElements.set(360, image);
                }

                promises.push(new Promise((res, err) => {
                    image.onload = () => {
                        if (textureMeta.isSymmetric && hoistedAngle !== 0 && hoistedAngle !== 180) {
                            const rotatedImage = Texture.#mirrorImage(image)
                            rotatedImage.style.order = result.#id.toString(10)
                            texturesDiv.appendChild(rotatedImage)
                            result.#imageElements.set(360 - hoistedAngle, rotatedImage)
                            promises.push(new Promise((res, err) => {
                                rotatedImage.onload = () => res(hoistedAngle)
                                rotatedImage.onerror = error => err(error)
                            }))
                        }

                        res(hoistedAngle)
                    }
                    image.onerror = error => err(`Couldn't load texture for path ${path.join("/")}/${angle}: ${typeof error === "string" ? error : error.type}`)
                }))
            }

            angle += textureMeta.angleBetweenRotations
        }
        return Promise.all(promises).then(() => result)
    }

    /**
     * @param {File[]} files
     * @param {string[]} path
     * @param {string} texturePackName
     * @param {TextureMeta} textureMeta
     * @return {Promise<Texture>}
     */
    static forWebkitDirectory(files, path, texturePackName, textureMeta) {
        const result = new Texture(textureMeta)
        const texturesDiv = TexturePack.getHtmlTextureContainerFor(texturePackName)
        /** @type {Promise[]} */
        const promises = []

        if (textureMeta.textureType === TextureType.IMAGE) {
            const file = files.find(({webkitRelativePath}) => webkitRelativePath === `${texturePackName}/${path.join("/")}.${textureMeta.extension}`)
            if (file !== undefined) {
                return Texture.#readFileAsDataUrl(file)
                    .then(dataUrl => {
                        const image = document.createElement("img")
                        image.src = dataUrl
                        image.style.order = result.#id.toString(10)
                        texturesDiv.appendChild(image)
                        result.#imageElements.set(Texture.#baseMarker, image)
                    })
                    .then(() => result)
            } else {
                return globalThis.options.defaultTexturePack.getTexture(path.join("/"))
            }
        }

        if (textureMeta.textureType !== TextureType.BASE_ONLY && (360 % textureMeta.angleBetweenRotations) !== 0) {
            console.error("Given textureMeta angle isn't valid", textureMeta)
            throw new TypeError("Given textureMeta angle isn't valid")
        }

        if (textureMeta.textureType !== TextureType.ROTATION_ONLY) {
            const file = files.find(({webkitRelativePath}) => webkitRelativePath === `${texturePackName}/${path.join("/")}/base.${textureMeta.extension}`)
            if (file !== undefined) {
                promises.push(Texture.#readFileAsDataUrl(file)
                    .then(dataUrl => {
                        const image = document.createElement("img")
                        image.src = dataUrl
                        image.style.order = result.#id.toString(10)
                        texturesDiv.appendChild(image)
                        result.#imageElements.set(Texture.#baseMarker, image)
                    }))
            } else {
                return globalThis.options.defaultTexturePack.getTexture(path.join("/"))
            }
        }

        if (textureMeta.textureType === TextureType.BASE_ONLY) {
            return Promise.all(promises).then(() => result)
        }

        let angle = 0
        while (angle < 360) {
            if (angle <= 180 || (angle > 180 && ! textureMeta.isSymmetric)) {
                const hoistedAngle = angle
                const file = files.find(({webkitRelativePath}) => webkitRelativePath === `${texturePackName}/${path.join("/")}/${hoistedAngle}.${textureMeta.extension}`)
                if (file !== undefined) {
                    promises.push(Texture.#readFileAsDataUrl(files.find(({webkitRelativePath}) => webkitRelativePath === `${texturePackName}/${path.join("/")}/${hoistedAngle}.${textureMeta.extension}`))
                        .then(dataUrl => {
                            const image = document.createElement("img")
                            image.src = dataUrl
                            image.style.order = result.#id.toString(10)
                            texturesDiv.appendChild(image)
                            result.#imageElements.set(AngleUtils.clampAngleDeg(hoistedAngle), image)

                            if (textureMeta.isSymmetric && hoistedAngle !== 0 && hoistedAngle !== 180) {
                                image.onload = () => {
                                    const rotatedImage = Texture.#mirrorImage(image)
                                    rotatedImage.style.order = result.#id.toString(10)
                                    texturesDiv.appendChild(rotatedImage)
                                    result.#imageElements.set(AngleUtils.clampAngleDeg(360 - hoistedAngle), rotatedImage)
                                }
                            }
                            if (hoistedAngle === 0) {
                                result.#imageElements.set(360, image);
                            }
                        }))
                } else {
                    return globalThis.options.defaultTexturePack.getTexture(path.join("/"))
                }
            }

            angle += textureMeta.angleBetweenRotations
        }
        return Promise.all(promises).then(() => result)
    }

    /**
     * @param {File} file
     * @return {Promise<string>}
     */
    static #readFileAsDataUrl(file) {
        return new Promise((res, err) => {
            const fr = new FileReader();
            fr.onload = () => res(fr.result)
            fr.onerror = error => err(error)
            fr.readAsDataURL(file);
        })
    }

    /**
     * @param {HTMLImageElement} image
     * @returns {HTMLImageElement}
     */
    static #mirrorImage(image) {
        // get the canvas
        const canvas = document.getElementById("utilsCanvas")
        canvas.width = image.width
        canvas.height = image.height

        // paste the image reversed left<->right on it
        const context = canvas.getContext("2d")
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.scale(-1, 1)
        context.drawImage(image, -canvas.width, 0)

        // create a new image element with the rotated image
        const rotatedImage = document.createElement("img")
        rotatedImage.src = canvas.toDataURL("image/png")
        return rotatedImage
    }
}
