import { APP_BASE_URL } from '../../constants'
import { Layout } from './Layout'

type VoteCastProps = {
  title?: string
}

const VoteCast = ({ title, ...props }: VoteCastProps) => (
  <Layout
    {...props}
    style={{
      backgroundImage: `url(${APP_BASE_URL}/images/success.png)`,
      backgroundSize: '100% 100%',
    }}
  >
    <h1 tw='w-full font-bold text-6xl'>{title || 'Your vote has been cast!'}</h1>
  </Layout>
)

export default VoteCast
