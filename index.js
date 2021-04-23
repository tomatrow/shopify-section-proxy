const Koa = require("koa")
const { webkit } = require("playwright")
const evaluation = require("./evaluation.js")
const yargs = require("yargs/yargs")
const { hideBin } = require("yargs/helpers")

/** @param {{ port: string, previewUrl: URL }} options */
async function main({ port, previewUrl }) {
    console.log("Starting browser")

    const browser = await webkit.launch()
    const page = await browser.newPage()

    console.log("Loading /")
    await page.goto(previewUrl.href, { waitUntil: "domcontentloaded" })
    await page.waitForSelector(`#shopify-section-index`, {
        state: "attached"
    })

    const app = new Koa()

    app.use(async ctx => {
        const url = new URL(ctx.url, previewUrl.href)
        const id = url.searchParams.get("section_id")

        url.search = previewUrl.search + "&section_id=" + id
        console.log("rendering", url.href)

        const sectionHTML = await page.evaluate(evaluation, {
            id,
            bypass: {
                doc: true
            }
        })

        console.log("rendered ", sectionHTML)

        ctx.body = sectionHTML
    })

    console.log("Starting app on port", port)
    app.listen(port)
}

const { argv } = yargs(hideBin(process.argv))
    .option("port", {
        alias: "p",
        describe: "port for server"
    })
    .option("url", {
        alias: "u",
        describe: "url to shopify site (or preview url)"
    })

main({
    port: argv.port,
    previewUrl: argv.url
})
