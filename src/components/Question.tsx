import { IChoice, IQuestion, PublishedElection } from '@vocdoni/sdk'
import { Layout } from './Layout/Layout'

export type FrameElection = Partial<PublishedElection> & {
  turnout?: number
  participation?: number
}

const Box = ({ style, ...props }: any) => (
  <div
    style={{
      background:
        'linear-gradient(90.68deg, rgba(255, 255, 255, 0.25) 1.37%, rgba(255, 255, 255, 0.125) 99.55%)',
      backgroundFilter: 'blur(8px)',
      borderRadius: '12px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
      color: 'white',
      padding: '20px',
      fontFamily: 'Inter',
      fontWeight: 700,
      lineHeight: 1.1,
      maxWidth: '600px',
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'left',
      position: 'relative',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderBottom: 'none',
      ...style,
    }}
    {...props}
  />
)

export const Question = ({
  title,
  question,
}: {
  title: string
  question: Pick<IQuestion, 'choices'>
}) => (
  <Layout>
    <Box tw='w-full text-xl my-6 mx-0'>{title}</Box>
    <div tw='flex flex-col mx-auto mx-0'>
      {question.choices.map((choice, i) => (
        <div tw='flex flex-row text-base mb-6'>
          <Box
            tw='mr-6 text-3xl w-20 justify-center items-center'
            style={{ paddingTop: 0, paddingBottom: 0 }}
          >
            {'ABCDEFGH'[i]}
          </Box>
          <Box tw='w-full text-xl' style={{ fontWeight: 400 }}>
            {choice.title.default}
          </Box>
        </div>
      ))}
    </div>
  </Layout>
)

export const Results = ({ election }: { election: Partial<FrameElection> }) => {
  if (!election) return <></>
  if (!election.questions) return <></>
  if (!election.title) return <></>

  const [question] = election.questions
  const [results] = election.results as string[][]
  // map results to numbers
  const rnum: number[] = results.map((result: string) => parseInt(result, 10))
  // weight
  const weight = rnum.reduce((prev, curr) => prev + curr, 0)

  return (
    <Layout>
      <Box tw='w-screen my-6 mx-auto'>
        <div tw='text-xl'>{election.title?.default}</div>
        <Participation election={election} weight={weight} />
      </Box>
      <div tw='flex flex-col'>
        {weight <= 0 ? (
          <p tw='text-2xl mx-auto'>No results yet 😢</p>
        ) : (
          <>
            <ul tw={`text-xl flex-col`}>
              {question.choices.map((choice: IChoice, i: number) => {
                const percent = Math.round((rnum[i] / weight) * 1000) / 10
                return (
                  <li tw='flex-col mb-2'>
                    <span tw='flex-row my-1'>
                      <span tw='mr-1 font-bold'>{'ABCDEFGH'[i]}</span>
                      <span>
                        - {percent}%: {choice.title.default}
                      </span>
                    </span>
                    <ProgressBar percent={percent} />
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

const Participation = ({
  election,
  weight,
}: {
  election: Partial<FrameElection>
  weight: number
}) => {
  if (!election.voteCount && !election.participation && !election.turnout) return <></>

  return (
    <div tw='flex flex-row mt-4'>
      {election.voteCount !== undefined && (
        <span tw='flex flex-col border-r-2 border-white mr-4 pr-4'>
          <span tw='font-normal'>Votes</span>
          <span tw='text-3xl'>
            {election.voteCount}
            {election.participation !== undefined && (
              <span tw='text-2xl ml-2'>({Math.trunc(election.participation * 100) / 100}%)</span>
            )}
          </span>
        </span>
      )}
      <span tw='flex flex-col'>
        <span tw='font-normal'>Weight</span>
        <span tw='text-3xl'>
          {weight}
          {election.turnout !== undefined && (
            <span tw='text-2xl ml-2'> ({Math.trunc(election.turnout * 100) / 100}%)</span>
          )}
        </span>
      </span>
    </div>
  )
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

const ProgressStep = ({ empty, ...props }: any) => {
  const styles: any = {
    backgroundColor: empty ? 'rgba(255, 255, 255, .1)' : 'transparent',
    padding: 0,
    borderRadius: '6px',
    height: '20px',
    width: '20px',
    backdropFilter: 'blur(2px)',
    opacity: empty ? 0.3 : 1,
  }

  if (!empty) {
    styles.backgroundImage =
      'linear-gradient(to right, rgba(255, 255, 255, 0.5) 0%, rgba(255, 255, 255, .9) 100%)'
  }

  return <Box tw='flex w-5 h-5 border-black' {...props} style={styles} />
}

const ProgressBar = ({ percent }: { percent: number }) => {
  const maxBarLength = 20
  const length = Math.round((percent * maxBarLength) / 100)
  const bar = Array.from({ length }, (_, i) => <ProgressStep key={`filled-${i}`} />)
  const empty = Array.from({ length: maxBarLength - length }, (_, i) => (
    <ProgressStep key={`empty-${i}`} empty />
  ))

  return (
    <div tw='flex flex-row justify-between'>
      {bar}
      {empty}
    </div>
  )
}
