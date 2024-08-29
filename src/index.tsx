import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { EnvOptions, IChoice, IQuestion, VocdoniSDKClient } from '@vocdoni/sdk'
import { Frog } from 'frog'
import { devtools } from 'frog/dev'
import { readFileSync } from 'fs'
import { Context } from 'hono'
import { ImageResponse } from 'hono-og'
import AlreadyVoted from './components/Layout/AlreadyVoted'
import Error from './components/Layout/Error'
import { Layout } from './components/Layout/Layout'
import NotEligible from './components/Layout/NotEligible'
import Preview from './components/Layout/Preview'
import VoteCast from './components/Layout/VoteCast'
import { FrameElection, Question, Results } from './components/Question'
import { PORT, VOCDONI_ENV } from './constants'

// Required to convert BigInt to number
declare global {
  interface BigInt {
    toJSON(): number
  }
}
BigInt.prototype.toJSON = function () {
  return Number(this)
}

const imageOptions: any = {
  emoji: 'fluent',
  debug: false,
  height: 640,
  width: 640,
  fonts: [
    {
      name: 'Inter',
      weight: 400,
      style: 'normal',
      data: readFileSync('./fonts/Inter-Regular.ttf'),
    },
    {
      name: 'Inter',
      weight: 700,
      style: 'normal',
      data: readFileSync('./fonts/Inter-Bold.ttf'),
    },
  ],
}

export const app = new Frog({
  dev: {
    enabled: process.env.NODE_ENV === 'development',
  },
  imageOptions,
  imageAspectRatio: '1:1',
})

app.use('/*', serveStatic({ root: './public' }))

type BodyType =
  | 'question'
  | 'error'
  | 'info'
  | 'results'
  | 'alreadyvoted'
  | 'votecast'
  | 'noteligible'
  | 'preview'

type Body = {
  type: BodyType
  question: string
  choices: string[]
  results: string[]
  voteCount: number
  error: string
  info: string[]
  turnout: number
  participation: number
  title: string
  ends: string
  ended: boolean
}

const getParamsToJson = (c: Context) => {
  const body = {
    type: (c.req.query('type') || '') as BodyType,
    question: c.req.query('question') || '',
    choices: c.req.queries('choice') || [],
    results: c.req.queries('result') || [],
    voteCount: Number(c.req.query('voteCount')) || 0,
    error: c.req.query('error') || '',
    info: c.req.queries('info') || [],
    participation: Number(c.req.query('participation')) || 0,
    turnout: Number(c.req.query('turnout')) || 0,
    title: c.req.query('title') || '',
    ends: c.req.query('ends') || '',
    ended: c.req.query('ended') || false,
  }

  if (body.question.length) {
    body.question = decodeURIComponent(body.question)
  }
  if (body.choices.length) {
    body.choices = body.choices.map((choice: string) => decodeURIComponent(choice))
  }
  if (body.info.length) {
    body.info = body.info.map((info: string) => decodeURIComponent(info))
  }
  if (body.error.length) {
    body.error = decodeURIComponent(body.error)
  }

  return body
}
const iresponse = (contents: JSX.Element) => new ImageResponse(contents, imageOptions)

const imageGenerationService = (body: Body) => {
  switch (body.type) {
    case 'question': {
      const question: Pick<IQuestion, 'choices'> = {
        choices: body.choices.map((choice) => ({ title: { default: choice } } as IChoice)),
      }
      return iresponse(<Question title={body.question} question={question} />)
    }
    case 'results': {
      const election: Partial<FrameElection> = {
        title: {
          default: body.question,
        },
        questions: [
          {
            title: { default: body.question },
            choices: body.choices.map((choice) => ({ title: { default: choice } } as IChoice)),
          },
        ],
        results: [body.results],
        voteCount: body.voteCount,
        participation: body.participation ?? 0,
        turnout: body.turnout ?? 0,
      }
      return iresponse(<Results election={election} />)
    }

    case 'error': {
      return iresponse(<Error title={body.title} children={body.error} />)
    }

    case 'noteligible': {
      return iresponse(<NotEligible title={body.title} />)
    }

    case 'alreadyvoted': {
      return iresponse(<AlreadyVoted title={body.title} />)
    }

    case 'preview': {
      return iresponse(<Preview title={body.question} ends={body.ends} ended={body.ended} />)
    }

    case 'votecast': {
      return iresponse(<VoteCast title={body.title} />)
    }

    case 'info': {
      return iresponse(
        <Layout>
          <div tw='text-4xl my-4'>Vocdoni secured poll</div>
          {body.info.map((line) => (
            <div tw='text-3xl mb-1'>{line}</div>
          ))}
        </Layout>
      )
    }

    default:
      return iresponse(<Error>You forgot to specify the type, or specified an invalid one</Error>)
  }
}

app.hono.get('/image', (c) => {
  const body = getParamsToJson(c)
  try {
    return imageGenerationService(body)
  } catch (e: any) {
    const error = e.message || 'An error occurred'
    return c.json({ error })
  }
})

app.hono.post('/image', async (c) => {
  const body = await c.req.json()
  try {
    return imageGenerationService(body)
  } catch (e: any) {
    const error = e.message || 'An error occurred'
    return c.json({ error })
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

app.frame('/poll/results/:pid', async (c) => {
  const pid = c.req.param('pid')
  const client = new VocdoniSDKClient({
    env: VOCDONI_ENV as EnvOptions,
  })
  const election = await client.fetchElection(pid)
  if (!election) return c.res({ image: <p>Not found</p> })

  return c.res({
    image: <Results election={election} />,
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

console.log(`Server is running on port ${PORT}`)

devtools(app, { serveStatic })

if (process.env.NODE_ENV !== 'development') {
  serve({
    fetch: app.fetch,
    port: PORT,
  })
}
