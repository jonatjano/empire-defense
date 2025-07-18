import {AnimationKeys} from "../models/entities/AbstractEntity.js"
import * as Translator from "./Translator.js";
import TexturePack from "./TexturePack.js";

const BUTTON_INTERVAL_TIME = 100

class Options {
    /** @type {boolean} */
    #debug

    /** @type {string[]} */
    #knownLanguages
    /** @type {string} */
    #language
    /** @type {string} */
    #fallbackLanguage

    /** @type {TexturePack[]} */
    #knownTexturePacks
    /** @type {TexturePack} */
    #texturePack
    /** @type {TexturePack} */
    #defaultTexturePack

    /** @type {number} */
    #zoom = 60
    /** @type {number} */
    #minZoom = 20
    /** @type {number} */
    #maxZoom = 300

    /** @type {number} */
    #mapXOfsset = 0
    /** @type {number} */
    #mapYOffset = 0

    /** @type {number} */
    #speed = 1
    /** @type {number[]} */
    #speeds = Object.freeze([1, 2, 5])

    /** @type {boolean} */
    #unlimitedMoney = false

    // todo stuff with local storage and proxy and stuff
    constructor() {
        // document.body.classList.add("hidden")
        // document.querySelector("#mapPreview").classList.add("hidden")
        // document.querySelectorAll("#game > *").forEach(element => element.classList.add("hidden"))
        this.loadMeta()
        this.addEventsToDom();
    }

    loadMeta() {
        return fetch("/assets/meta.json")
            .then(res => res.json())
            .then(
                /** @param {{
                 *  languages: {default: string, list: string[]},
                 *  texturePacks: {default: string, list: string[]},
                 *  speeds: number[]
                 *  debug: ?boolean,
                 *  debugTextures: ?boolean,
                 *  showStats: ?boolean
                 *  unlimitedMoney: ?boolean,
                 * }} meta */
                meta => {
                /* debug */
                this.debug = meta.debug ?? false
                this.showStats = meta.showStats ?? this.debug
                this.unlimitedMoney = meta.unlimitedMoney ?? this.debug

                /* languages */
                this.#knownLanguages = meta.languages.list
                this.#fallbackLanguage = meta.languages.default
                this.language = window.navigator.languages.find(language => this.#knownLanguages.includes(language)) ?? this.#fallbackLanguage

                /* texture pack */
                this.#knownTexturePacks = meta.texturePacks.list.map(name => new TexturePack(name))
                this.texturePack = this.#knownTexturePacks.find(pack => pack.name === meta.texturePacks.default) ?? this.#knownTexturePacks[0]
                this.#defaultTexturePack = this.texturePack

                const texturePackSelect = document.querySelector("#texturePackSelect")
                this.#knownTexturePacks.forEach(pack => {
                    const option = document.createElement("option")
                    option.value = pack.name
                    option.textContent = pack.name
                    texturePackSelect.append(option)
                })
                texturePackSelect.onchange = () => { this.texturePack = texturePackSelect.value }

                if (meta.debugTextures) {
                    document.querySelector("#textures").classList.remove("hidden")
                }
                if (this.debug) { console.log(this) }
            })
    }

    reduceZoom() {
        this.#zoom *= 0.9
        document.querySelector("#zoomIn").style.visibility = "visible"
        if (this.#zoom < this.#minZoom) {
            this.#zoom = this.#minZoom
            document.querySelector("#zoomOut").style.visibility = "hidden"
        }
    }
    augmentZoom() {
        this.#zoom *= 1.1
        document.querySelector("#zoomOut").style.visibility = "visible"
        if (this.#zoom > this.#maxZoom) {
            this.#zoom = this.#maxZoom
            document.querySelector("#zoomIn").style.visibility = "hidden"
        }
    }
    get zoom() { return this.#zoom }

    changeMapOffset(x, y) {
        this.#mapXOfsset += x
        this.#mapYOffset += y
    }
    get mapOffset() { return {x: this.#mapXOfsset, y: this.#mapYOffset} }

    changeSpeed() {
        let newIndex = this.#speeds.indexOf(this.#speed) + 1
        if (newIndex === this.#speeds.length) { newIndex = 0 }
        this.#speed = this.#speeds[newIndex]
        const buttonImage = document.querySelector("#speed img")
        buttonImage.dataset.texture = `icons/speed${this.#speed}`
    }

    get speed() { return this.#speed }
    get speeds() { return this.#speeds }


    /** @param {boolean} value */
    set debug(value) {
        if (this.debug === value) { return }
        this.#debug = !! value
        document.getElementById("debugOverlay").classList.toggle("hidden", ! this.#debug)
    }
    get debug() { return this.#debug }

    /** @param {boolean} value */
    set showStats(value) {
        document.getElementById("debugOverlay").classList.toggle("hidden", ! value)
    }

    /** @param {boolean} value */
    set unlimitedMoney(value) {
        this.#unlimitedMoney = value
        if (value) {
            console.log("\n\n\n\n\nunlimited money activated\n\n\n\n\n")
            document.querySelector("#moneyLabel").textContent = "∞"
        }
    }

    get unlimitedMoney() { return this.#unlimitedMoney }

    /** @param {string} value */
    set language(value) {
        if (this.language === value) { return }
	    if (! this.#knownLanguages.includes(value)) {
            console.warn(`Language "${value}" is not supported, defaulting to ${this.#fallbackLanguage}`)
            value = this.#fallbackLanguage
        }
        this.#language = value
        Translator.loadTranslation()
            .then(Translator.translateDocument)
    }
    get language() { return this.#language }
    get fallbackLanguage() { return this.#fallbackLanguage }

    set texturePack(value) {
        if (this.texturePack === value) { return }
        let texturePack = value
        if (typeof value === "string") {
            texturePack = this.#knownTexturePacks.find(pack => pack.name === value)
        }
        if (texturePack) {
            this.#texturePack = texturePack
            this.#texturePack.updateDocumentTextures()
        }
    }

    get texturePack() { return this.#texturePack }
    get defaultTexturePack() { return this.#defaultTexturePack }

    uploadTexturePack() {
        const files = document.querySelector("#texturePackInput").files
        const file = files[0]

        const texturePackName = file.webkitRelativePath.split('/')[0]

        // TODO if the name is already taken, override the existing pack

        // TODO ensure structure looks good

        const texturePack = new TexturePack(texturePackName)

        const fileArray = [...files]

        texturePack.init(fileArray.find(({webkitRelativePath}) => webkitRelativePath === `${texturePackName}/pack.json`), fileArray)
            .then(_ => {
                this.#knownTexturePacks.push(texturePack)
                this.texturePack = texturePack

                const texturePackSelect = document.querySelector("#texturePackSelect")
                const option = document.createElement("option")
                option.value = texturePack.name
                option.textContent = texturePack.name
                option.selected = true
                texturePackSelect.append(option)
            })
    }

    addEventsToDom() {
        // ***********
        //   options
        // ***********
        /** @type {HTMLButtonElement} */
        const option = document.querySelector("#option")
        option.addEventListener("click", () => {
            globalThis.game?.pause()
            document.querySelector("#pauseMenu").classList.toggle("hidden", false)
        })

        // *********
        //   speed
        // *********
        /** @type {HTMLButtonElement} */
        const speed = document.querySelector("#speed")
        speed.addEventListener("click", () => this.changeSpeed())

        // ********
        //   zoom
        // ********
        let zoomInterval
        /** @type {HTMLButtonElement} */
        const zoomIn = document.querySelector("#zoomIn")
        zoomIn.addEventListener("mousedown", () => {
            this.augmentZoom()
            zoomInterval = setInterval(() => this.augmentZoom(), BUTTON_INTERVAL_TIME)
        })
        zoomIn.addEventListener("mouseup", () => clearInterval(zoomInterval))
        zoomIn.addEventListener("mouseleave", () => clearInterval(zoomInterval))
        /** @type {HTMLButtonElement} */
        const zoomOut = document.querySelector("#zoomOut")
        zoomOut.addEventListener("mousedown", () => {
            this.reduceZoom()
            zoomInterval = setInterval(() => this.reduceZoom(), BUTTON_INTERVAL_TIME)
        })
        zoomOut.addEventListener("mouseup", () => clearInterval(zoomInterval))
        zoomOut.addEventListener("mouseleave", () => clearInterval(zoomInterval))

        // **************
        //   pause menu
        // **************
        const resumeButton = document.querySelector("#resumeButton")
        resumeButton.addEventListener("click", () => {
            globalThis.game?.resume()
            document.querySelector("#pauseMenu").classList.toggle("hidden", true)
        })
        const quitButton = document.querySelector("#quitButton")
        quitButton.addEventListener("click", () => window.location.reload())
        this.updateIconsEvents()

    }

    updateIconsEvents() {
        const icons = document.querySelectorAll("[data-texture]")
        icons.forEach(icon => {
            icon.onclick = () => {
                icon.dataset.animation = AnimationKeys.CLICK
                this.texturePack.getTexture(icon.dataset.texture).then(texture => {
                    if (AnimationKeys.CLICK in texture.animations) {
                        setTimeout(() => {
                            if (icon.dataset.hovered) {
                                icon.dataset.animation = AnimationKeys.HOVER
                            } else {
                                delete icon.dataset.animation
                            }
                        }, texture.animations.click.timings.reduce((acc, frame) => acc + frame, 0))
                    }
                })
            }
            icon.onmouseenter = () => {
                if (! icon.dataset.animation) {
                    icon.dataset.animation = AnimationKeys.HOVER
                    icon.dataset.hovered = "true"
                }
            }
            icon.onmouseleave = () => {
                if (icon.dataset.animation === AnimationKeys.HOVER) {
                    delete icon.dataset.animation
                    delete icon.dataset.animationStartTime
                    delete icon.dataset.hovered
                }
            }
        })
    }
}


const options = new Options()
globalThis.options = options
export default options

