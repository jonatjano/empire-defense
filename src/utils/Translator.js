import options from "./Options.js";

/** @type {string} */
export const FALLBACK_LANGUAGE = "en"
/** @type {string[]} */
export const KNOWN_LANGUAGES = ["en", "fr"]
let globalTranslations = null
let globalFallbackTranslations = null

/**
 * set the text of every element with the data-translation attribute to the translation key
 */
export function translateDocument() {
    const elements = document.body.querySelectorAll("*[data-translation]")
    elements.forEach(element => {
        element.textContent = translate(element.dataset.translation)
    })
}

/**
 * fetch the translations data for the language define in options
 * @return {Promise}
 */
export function loadTranslation() {
    return Promise.all([
        fetch(`/assets/translations/${options.language}.json`)
            .then(result => result.text())
            .then(data => globalTranslations = Object.freeze(JSON.parse(data))),

        globalFallbackTranslations !== null ?
            true :
            fetch(`/assets/translations/${options.fallbackLanguage}.json`)
                .then(result => result.text())
                .then(data => globalFallbackTranslations = Object.freeze(JSON.parse(data))),
    ])
}

/**
 * return the value for the given translation key in loaded language
 * @param {string} key
 * @return {string}
 */
export function translate(key) {
    let translations = globalTranslations
    let fallbackTranslations = globalFallbackTranslations
    const split = key.split(".")
    while (split.length !== 0) {
        const part = split.shift()
        translations = translations?.[part]
        fallbackTranslations = fallbackTranslations?.[part]
    }
    return translations ??
        fallbackTranslations ?
            (console.error(`missing translation in ${globalTranslations.language.name} (${globalTranslations.language.code}) for ${key}`), fallbackTranslations) :
            (console.error(`missing translation for ${key}`), key)
}