import { PropsWithChildren } from 'frog/jsx'
import { VocdoniLogo } from '../VocdoniLogo'

export const Layout = ({ children, ...props }: PropsWithChildren<any>) => (
  <div
    tw='flex flex-col h-screen w-screen text-white px-6'
    style={{
      backgroundImage: `linear-gradient(to bottom, #2A1161 50%, #642BE2 100%)`,
    }}
    {...props}
  >
    {children}
    <SecuredBy />
  </div>
)

const SecuredBy = () => (
  <div tw='flex flex-col absolute bottom-4 flex-row items-center w-screen justify-center'>
    <div>Votes secured with</div>
    <VocdoniLogo tw='mx-2' />
    <div tw='font-black'>Vocdoni Protocol</div>
  </div>
)
