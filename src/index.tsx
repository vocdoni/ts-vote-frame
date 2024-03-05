import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { EnvOptions, IChoice, IQuestion, PublishedElection, VocdoniSDKClient } from '@vocdoni/sdk'
import { Frog } from 'frog'
import { ImageResponse } from 'hono-og'
import { Layout } from './components/Layout'
import { Question, Results } from './components/Question'
import { APP_BASE_URL, PORT, VOCDONI_ENV } from './constants'

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
    body.voteCount = parseInt(voteCount, 10)
  }
  if (body.maxCensusSize) {
    body.maxCensusSize = parseInt(maxCensusSize, 10)
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
