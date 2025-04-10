import ActionButtonList from './components/ActionButton'
// import Footer from './components/Footer'
// import InfoList from './components/InfoList'
import { useAppKitTheme } from './config'
import { SignMessage } from './components/SignMessage'
import CounterState from './components/CounterState'
import IncrementButton from './components/Increment'
import TokenTransfer from './components/TokenTransfer'
import IncrementSplPaidButton from './components/IncrementSplPaid'
export default function App() {
  const { themeMode } = useAppKitTheme()
  document.documentElement.className = themeMode

  return (
    <div className="page-container">

      <h1 className="page-title">React Solana Example</h1>

      <div className="appkit-buttons-container">
        <appkit-button />
        <appkit-network-button />
      </div>

      <ActionButtonList />
      {/* <InfoList /> */}
      <SignMessage />
      <CounterState />
      <IncrementButton />
      <IncrementSplPaidButton />
      <TokenTransfer />

    </div>
  )
}
