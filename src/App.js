import './App.css';
import SwapForm from './components/SwapForm.js';
import MetaMask from './components/MetaMask.js';
import { MetaMaskProvider } from './contexts/MetaMask';

const App = () => {

  return (
    <MetaMaskProvider>
      <div className="App flex flex-col justify-between items-center w-full h-full">
        <div className="pt-8">
          <MetaMask />
        </div>
        <SwapForm/>
        <footer>
          <div className="MetaMaskContainer pt-8">
            <span>Copyright @BankerSmith</span>
          </div>
        </footer>
      </div>
    </MetaMaskProvider>
  );
}

export default App;
