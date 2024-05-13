import { ReactNode } from 'hono/jsx'
import { APP_BASE_URL } from '../../constants'
import { Layout } from './Layout'

type ErrorProps = {
  title?: string
  children: ReactNode
}

const Error = ({ children, title, ...props }: ErrorProps) => (
  <Layout
    {...props}
    style={{
      backgroundImage: `url(${APP_BASE_URL}/images/error.png)`,
      backgroundSize: '100% 100%',
    }}
  >
    <h1 tw='w-full font-bold text-7xl'>{title?.toUpperCase() || 'ERROR'}</h1>
    <div tw='text-6xl w-full'>{children}</div>
  </Layout>
)

export default Error
