import { useContext } from 'react'
import Title from '../../components/Title'
import Button from '../../components/Button'
import Content from '../../components/Content'
import Container from '../../components/Container'
import ButtonsOnBottom from '../../components/ButtonsOnBottom'
import { NavigationContext, Pages } from '../../providers/navigation'

export function SunsetNotice() {
  const { navigate } = useContext(NavigationContext)
  return (
    <p className='bg-red-500 cursor-pointer font-semibold md:p-x-4 p-1 my-4 rounded-md text-sm text-white'>
      <a onClick={() => navigate(Pages.Sunsetting)}>Helm is sunsetting, know more</a>
    </p>
  )
}

export default function Sunsetting() {
  const { navigate } = useContext(NavigationContext)

  const goBackToWallet = () => navigate(Pages.Wallet)

  return (
    <Container>
      <Content>
        <Title text='Sunsetting' subtext='Withdraw your funds' />
        <div className='flex flex-col gap-6 mt-10'>
          <p>After all the issues with the Liquid Network and Boltz Exchange, I decided to sunset Helm.</p>
          <p>Please make sure to withdraw your funds and stop using Helm for transactions.</p>
          <p>Thank you for using Helm and for your understanding during this transition.</p>
          <p>
            <strong>
              If you have any issues with Helm, you can recover your mnemonic in{' '}
              <a
                className='underline cursor-pointer'
                href='https://sideswap.io'
                target='_blank'
                rel='noopener noreferrer'
              >
                sideswap.io
              </a>
            </strong>
          </p>
        </div>
      </Content>
      <ButtonsOnBottom>
        <Button onClick={goBackToWallet} label='Back to wallet' secondary />
      </ButtonsOnBottom>
    </Container>
  )
}
