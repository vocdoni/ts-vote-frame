import { APP_BASE_URL } from '../../constants'
import { Layout } from './Layout'

type NotEligibleProps = {
  title?: string
}

const NotEligible = ({ title, ...props }: NotEligibleProps) => (
  <Layout
    {...props}
    style={{
      backgroundImage: `url(${APP_BASE_URL}/images/noteligible.png)`,
      backgroundSize: '100% 100%',
    }}
  >
    <h1 tw='w-full font-bold text-6xl'>{title || "Sorry, you're not eligible to vote"}</h1>
  </Layout>
)

export default NotEligible
