module.exports = async function evaluation(config) {
    async function loadSection({
        id,
        bypass = {},
        origin = window.location.origin,
        path = window.location.pathname,
        params = new URLSearchParams(window.location.search),
        selector = null
    } = {}) {
        /** @param {DocumentFragment} doc */
        function parseSection(doc) {
            // const script = doc.querySelector(
            //     selector ?? `#shopify-section-${id} script[type="application/json"]`
            // )
            // return script ? JSON.parse(script.innerHTML) : null

            return doc.querySelector(selector ?? `#shopify-section-${id}`)?.outerHTML
        }

        /** @param {URL} url */
        async function request(url) {
            const response = await fetch(url)

            const text = await response.text()
            const range = document.createRange()
            const fragment = range.createContextualFragment(text)

            return parseSection(fragment)
        }

        // try to find it in the current document
        if (!bypass.doc) {
            const section = parseSection(document)
            if (section) return section
        }

        const url = new URL(path, origin)

        // try to use the section rendering api
        if (!bypass.api) {
            try {
                params.append("section_id", id)
                url.search = params
                return await request(url)
            } catch (error) {
                console.warn(`Request to render section ${id} failed. Requesting full page.`)
            }
        }

        // request the full page
        url.search = ""
        return await request(url)
    }

    return await loadSection(config)
}
