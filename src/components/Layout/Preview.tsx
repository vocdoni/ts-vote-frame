import { differenceInHours } from 'date-fns'
import { Layout } from './Layout'

type PreviewProps = {
  title: string
  ends: string
  ended: boolean
}

const Preview = ({ title, ...props }: PreviewProps) => {
  return (
    <Layout {...props}>
      <div tw='flex flex-col w-full justify-center h-screen p-6'>
        <div tw='flex text-5xl w-full font-black justify-center text-center leading-snug'>
          {title}
        </div>
        <div tw='flex mt-3 justify-center'>
          <EndDate {...props} />
        </div>
      </div>
    </Layout>
  )
}

const EndDate = ({ ends, ended }: Omit<PreviewProps, 'title'>) => {
  const ending = ended ? differenceInHours(new Date(), ends) : differenceInHours(ends, new Date())

  if (!ended) {
    return <div tw='flex bg-lime-500/70 px-3 py-2 rounded-md'>Ends in {ending.toString()}h</div>
  }

  return <div tw='flex bg-red-700/70 px-3 py-2 rounded-md'>Ended {ending.toString()}h ago</div>
}

export default Preview
