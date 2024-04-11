import { IChoice, IQuestion, PublishedElection } from '@vocdoni/sdk'
import { Layout } from './Layout'

export const Question = ({
  title,
  question,
}: {
  title: string
  question: Pick<IQuestion, 'choices'>
}) => {
  const fs = calculateFontSize(title.length, 4, 7, 250)
  const qlength = question.choices.reduce((prev, curr) => prev + curr.title.default.length, 0)
  const qfs = calculateFontSize(qlength, 5, 7, 200)
  return (
    <Layout icon='🗳️'>
      <div tw={`text-${fs}xl mb-6 grow`}>{title}</div>
      <ul tw={`text-${qfs}xl flex-col grow`}>
        {question.choices.map((choice, i) => (
          <li>
            {i + 1}. {choice.title.default}
          </li>
        ))}
      </ul>
    </Layout>
  )
}

export const Results = ({ election }: { election: Partial<PublishedElection> }) => {
  if (!election) return <></>
  if (!election.questions) return <></>
  if (!election.title) return <></>

  // title font size must vary depending on number of choices
  const sizes: { [key: number]: number[] } = {
    2: [4, 7],
    3: [3, 7],
    4: [3, 6],
  }
  const [min, max] = sizes[election.questions[0].choices.length] || [4, 7]
  const tfs = calculateFontSize(election.title.default.length, min, max, 250)

  const [question] = election.questions
  // get choices length
  const clength = question.choices.reduce((prev, curr) => prev + curr.title.default.length, 0)
  const rsizes: { [key: number]: number[] } = {
    2: [4, 6],
    3: [3, 6],
    4: [3, 5],
  }
  const [rmin, rmax] = rsizes[election.questions[0].choices.length] || [4, 6]
  const cfs = calculateFontSize(clength, rmin, rmax, 200)

  const [results] = election.results as string[][]
  // map results to numbers
  const rnum: number[] = results.map((result: string) => parseInt(result, 10))
  // weights and turn out
  const weight = rnum.reduce((prev, curr) => prev + curr, 0)

  return (
    <Layout icon='📊'>
      <div tw='flex flex-col grow'>
        <div tw={`text-${tfs}xl`}>{election.title?.default}</div>
        {weight > 0 ? (
          <div tw={`text-${tfs - 1}xl mt-2 mb-4 flex`}>
            Votes: {election.voteCount}
            <Turnout election={election} /> | Weight: {weight}
          </div>
        ) : (
          <>{/* vercel-og has serious issues with common react logic */}</>
        )}
      </div>
      <div tw='flex flex-col grow'>
        {weight <= 0 ? (
          <p tw='text-6xl'>No results yet</p>
        ) : (
          <>
            <ul tw={`text-${cfs}xl flex-col`}>
              {question.choices.map((choice: IChoice, i: number) => {
                const percent = Math.round((rnum[i] / weight) * 1000) / 10
                return (
                  <li tw='flex-col'>
                    <span>
                      {i + 1}. {choice.title.default}
                    </span>
                    <span tw='text-4xl'>
                      {generateProgressBar(percent)} {percent}%
                    </span>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </Layout>
  )
}

const Turnout = ({ election }: { election: Partial<PublishedElection> }) => {
  if (!election.voteCount || !election.maxCensusSize) return <></>

  const turnOut = Math.round((election.voteCount / election.maxCensusSize) * 1000) / 10

  // returning null does not work for some reason
  if (turnOut <= 1) return <></>

  return <> ({turnOut})</>
}

export const calculateFontSize = (
  tlength: number,
  minFontSize: number,
  maxFontSize: number,
  maxLength: number
): number => {
  const decreasePerChar: number = (maxFontSize - minFontSize) / maxLength
  const fontSize: number = maxFontSize - tlength * decreasePerChar

  return Math.floor(Math.max(Math.min(fontSize, maxFontSize), minFontSize))
}

const generateProgressBar = (percent: number): string => {
  const maxBarLength = 14
  const length = (percent * maxBarLength) / 100
  const bar = '🟪'.repeat(length)
  const empty = '⬜'.repeat(maxBarLength - length)

  return `${bar}${empty}`
}
