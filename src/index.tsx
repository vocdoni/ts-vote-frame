import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Resvg } from '@resvg/resvg-js'
import { EnvOptions, IChoice, IQuestion, PublishedElection, VocdoniSDKClient } from '@vocdoni/sdk'
import emojiRegex from 'emoji-regex'
import { Frog } from 'frog'
import { ImageResponse } from 'hono-og'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import satori from 'satori'
import { Layout } from './components/Layout'
import { Question, Results } from './components/Question'
import { APP_BASE_URL, PORT, VOCDONI_ENV } from './constants'
import { languageFontMap } from './fonts'
import { toReactNode } from './utils'

const emReg = new RegExp(emojiRegex(), '')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const inter = fs.readFileSync('fonts/inter.ttf')
const notosans = fs.readFileSync('fonts/Noto+Sans.ttf')

const readFile = (file: string) =>
  new Promise((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) {
        return reject(err)
      }
      return resolve(data)
    })
  })

async function loadEmoji(name) {
  console.log('trying to load emoji:', name)
  try {
    const filePath = path.join('public', 'emojis', `${name}.svg`)
    return await readFile(filePath)
  } catch (err) {
    console.error('Error reading the SVG file:', err)
    return null
  }
}

export const app = new Frog({
  dev: {
    enabled: process.env.NODE_ENV === 'development',
  },
  imageOptions: {
    emoji: 'fluent',
  },
  // Supply a Hub API URL to enable frame verification.
  // hubApiUrl: 'https://api.hub.wevm.dev',
})

app.use('/*', serveStatic({ root: './public' }))

const getParamsToJson = (c) => {
  const body = {
    type: c.req.query('type'),
    question: c.req.query('question') || '',
    choices: c.req.queries('choice') || [],
    results: c.req.queries('result') || [],
    voteCount: c.req.query('voteCount') || 0,
    maxCensusSize: c.req.query('maxCensusSize') || 0,
    error: c.req.query('error') || '',
    info: c.req.queries('info') || [],
  }

  if (body.voteCount) {
    body.voteCount = parseInt(body.voteCount, 10)
  }
  if (body.maxCensusSize) {
    body.maxCensusSize = parseInt(body.maxCensusSize, 10)
  }
  if (body.question.length) {
    body.question = decodeURIComponent(body.question)
  }
  if (body.choices.length) {
    body.choices = body.choices.map((choice) => decodeURIComponent(choice))
  }
  if (body.info.length) {
    body.info = body.info.map((info) => decodeURIComponent(info))
  }
  if (body.error.length) {
    body.error = decodeURIComponent(body.error)
  }

  return body
}
const iresponse = (contents: JSX.Element) => new ImageResponse(contents, { emoji: 'fluent' })

const imageGenerationService = (body) => {
  switch (body.type) {
    case 'question': {
      const question: Partial<IQuestion> = {
        choices: body.choices.map((choice) => ({ title: { default: choice } } as IChoice)),
      }
      return iresponse(<Question title={body.question} question={question} />)
    }
    case 'results': {
      const election: Partial<PublishedElection> = {
        title: {
          default: body.question,
        },
        questions: [
          {
            choices: body.choices.map((choice) => ({ title: { default: choice } } as IChoice)),
          },
        ],
        results: [body.results],
        voteCount: body.voteCount,
        maxCensusSize: body.maxCensusSize,
      }
      return iresponse(<Results election={election} />)
    }

    case 'error': {
      return iresponse(
        <Layout style={{ padding: 0, margin: 0 }}>
          <img src={`${APP_BASE_URL}/images/error.png`} />
          <div tw='text-4xl absolute bottom-8 left-10 min-h-10 text-rose-700'>{body.error}</div>
        </Layout>
      )
    }

    case 'info': {
      return iresponse(
        <Layout>
          <div tw='text-6xl mb-6'>Vocdoni secured poll</div>
          {body.info.map((line) => (
            <div tw='text-5xl mb-1'>{line}</div>
          ))}
        </Layout>
      )
    }

    default:
      return iresponse(
        <Layout>
          <p tw='text-4xl'>You forgot to specify the type, or specified an invalid one</p>
        </Layout>
      )
  }
}

// Helper function to read a font file from disk
async function readFontFromFile(fontName) {
  console.log('would load font:', fontName)
  const fontPath = path.resolve('fonts', `${fontName}.ttf`) // Adjust path and extension as necessary
  try {
    return readFile(fontPath)
  } catch (error) {
    console.error(`Error reading font file for ${fontName}: ${error}`)
    return null // Or handle the error as appropriate
  }
}

function withCache(fn: Function) {
  const cache = new Map()
  return async (...args: string[]) => {
    const key = args.join(':')
    if (cache.has(key)) return cache.get(key)
    const result = await fn(...args)
    cache.set(key, result)
    return result
  }
}

const loadDynamicAsset = withCache(async (_code, text) => {
  if (_code === 'emoji') {
    // It's an emoji, load the image.
    return `data:image/svg+xml;base64,` + btoa(await loadEmoji(getIconCode(text)))
  }

  const codes = _code.split('|')

  // Get font names from languageFontMap based on codes
  const names = codes
    .map((code) => languageFontMap[code])
    .filter(Boolean)
    .flat() // Ensure it's a flat array of strings

  if (names.length === 0) return []

  const fonts = []
  for (const k of Object.keys(languageFontMap)) {
    const name = languageFontMap[k]
    console.log('name:', name, names)
    const fontData = await readFontFromFile(name)
    if (fontData) {
      fonts.push({
        name: `satori_${name}_fallback`,
        data: fontData,
        weight: 400,
        style: 'normal',
        lang: k,
      })
    }
  }

  // Here you would encode the font data as needed before returning
  // For simplicity, assuming fonts array is directly usable or you adjust as per your encoding scheme
  return fonts
})

const getIconCode = (code: string): string => {
  const codePoints = Array.from(code).map((char) => char.codePointAt(0).toString(16).toLowerCase())
  return codePoints.join('_')
}

app.hono.get('/test', async (c) => {
  const pid = '0x6b342d99f21838d2bc91b89928f78cbab3e4b1949e28787ec7a302020000000d'
  const client = new VocdoniSDKClient({
    env: EnvOptions.DEV,
    // api_url: 'https://api2-stg.vocdoni.net',
  })
  const election = await client.fetchElection(pid)

  // const img = await satori(toReactNode(<Results election={election} />), {
  const img = await satori(
    toReactNode(
      <Layout>
        <div tw='text-8xl'>Hello world 🫡❤️‍🔥 Kanjis 暗号 どこのチームですか？ デゲン 🎩 ⬜⬜</div>
      </Layout>
    ),
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: [
        {
          name: 'Inter',
          data: inter,
          weight: 400,
          style: 'normal',
        },
        // {
        //   name: 'NotoSanss',
        //   data: notosans,
        //   weight: 400,
        //   style: 'normal',
        // },
      ],
      graphemeImages: {},
      loadAdditionalAsset: loadDynamicAsset,
    }
  )
  const resvg = new Resvg(img)
  c.header('Content-Type', 'image/png')
  // return png image as response
  return c.body(resvg.render().asPng())
})

app.hono.get('/image', (c) => {
  const body = getParamsToJson(c)
  try {
    return imageGenerationService(body)
  } catch (e) {
    return c.res.json({ error: e.message })
  }
})

app.hono.post('/image', async (c) => {
  const body = await c.req.json()
  try {
    return imageGenerationService(body)
  } catch (e) {
    return c.res.json({ error: e.message })
  }
})

app.frame('/', (c) => {
  return c.res({
    image: (
      <Layout>
        <div tw='text-5xl text-center'>
          Use @vocdoni poll bot via farcaster or go to farcaster.vote to start creating
          decentralized polls
        </div>
      </Layout>
    ),
  })
})

app.frame('/poll/:pid', async (c) => {
  const pid = c.req.param('pid')
  const client = new VocdoniSDKClient({
    env: VOCDONI_ENV as EnvOptions,
  })
  const election = await client.fetchElection(pid)

  return c.res({
    image: <Question title={election.title.default} question={election.questions[0]} />,
  })
})

app.frame('/poll/results/:pid', async (c) => {
  const pid = c.req.param('pid')
  const client = new VocdoniSDKClient({
    env: VOCDONI_ENV as EnvOptions,
  })
  const election = await client.fetchElection(pid)

  return c.res({
    image: <Results election={election} />,
  })
})

serve({
  fetch: app.fetch,
  port: PORT,
})
