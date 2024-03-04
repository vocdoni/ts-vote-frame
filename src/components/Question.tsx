import { IQuestion, PublishedElection } from '@vocdoni/sdk'
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
    <Layout>
      <div tw={`text-${fs}xl mb-6 grow`}>{title}</div>
      <ul tw={`text-${qfs}xl flex-col grow mr-80`}>
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
  // title font size must vary depending on number of choices
  const sizes = {
    2: [4, 7],
    3: [3, 7],
    4: [3, 6],
  }
  const [min, max] = sizes[election.questions[0].choices.length] || [2, 5]
  const tfs = calculateFontSize(election.title.default.length, min, max, 250)

  const [question] = election.questions
  // get choices length
  const clength = question.choices.reduce((prev, curr) => prev + curr.title.default.length, 0)
  // reuse the same sizes from the title to be used as choices font-size
  const cfs = calculateFontSize(clength, min, max, 200)

  const [results] = election.results
  // map results to numbers
  const rnum: number[] = results.map((result) => parseInt(result, 10))
  // weights and turn out
  const weight = rnum.reduce((prev, curr) => prev + curr, 0)

  return (
    <Layout>
      <div tw={`text-${tfs}xl`}>{election.title.default}</div>
      {weight <= 0 ? (
        <p tw='text-6xl'>No results yet</p>
      ) : (
        <>
          <div tw={`text-${tfs - 1}xl mb-6 flex`}>
            Votes: {election.voteCount}
            <Turnout election={election} /> | Weight: {weight}
          </div>
          <ul tw={`text-${cfs}xl flex-col max-w-screen-sm mr-30`}>
            {question.choices.map((choice, i) => {
              const percent = Math.round((rnum[i] / weight) * 1000) / 10
              return (
                <li tw='flex-col'>
                  <span>
                    {i + 1}. {choice.title.default}
                  </span>
                  <span tw='text-2xl'>
                    {generateProgressBar(percent)} {percent}%
                  </span>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </Layout>
  )
}

const Turnout = ({ election }: { election: Partial<PublishedElection> }) => {
  const turnOut = Math.round((election.voteCount / election.maxCensusSize) * 1000) / 10

  // returning null does not work for some reason
  if (turnOut <= 1) return <></>

  return ` (${turnOut})`
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
  const maxBarLength = 20
  const length = (percent * maxBarLength) / 100
  const bar = '🟪'.repeat(length)
  const empty = '⬜'.repeat(maxBarLength - length)

  return `${bar}${empty}`
}
