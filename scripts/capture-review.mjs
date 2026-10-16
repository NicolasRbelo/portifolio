import { chromium } from 'playwright'

const outDir = process.argv[2] ?? '.impeccable/review'
const url = 'http://localhost:5173/'

const browser = await chromium.launch()

async function capture(width, height, filename) {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.keyboard.press('Space')
  await page.waitForTimeout(2600)
  await page.screenshot({ path: `${outDir}/${filename}`, fullPage: true })
  await page.close()
}

await capture(1440, 900, 'desktop.png')
await capture(390, 844, 'mobile.png')

await browser.close()
console.log('done')
