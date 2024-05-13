import { APP_BASE_URL } from '../../constants'
import { Layout } from './Layout'

type AlreadyVotedProps = {
  title?: string
}

const AlreadyVoted = ({ title, ...props }: AlreadyVotedProps) => (
  <Layout
    {...props}
    style={{
      backgroundImage: `url(${APP_BASE_URL}/images/alreadyvoted.png)`,
      backgroundSize: '100% 100%',
    }}
  >
    <h1 tw='w-full font-bold text-6xl'>{title || 'You already voted!'}</h1>
  </Layout>
)

export default AlreadyVoted
