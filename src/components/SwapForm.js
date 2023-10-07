import './SwapForm.css';
import { useContext, useEffect, useState } from 'react';
import { MetaMaskContext } from '../contexts/MetaMask';
import debounce from '../lib/debounce';
import Axios from 'axios';
import { ethers } from "ethers";

const SwapInput = ({ token, amount, setAmount, disabled, readOnly }) => {
  return (
    <fieldset className="SwapInput" disabled={disabled}>
      <input 
        type="text"
        id={token + "_amount"} 
        placeholder="0.0"
        value={amount} 
        onChange={(ev) => {
          setAmount(ev.target.value);
        }}
        readOnly={readOnly} 
      />
      <span className='pl-2 pt-2'>{token}</span>
    </fieldset>
  );
}


const ChangeDirectionButton = ({ onClick, disabled }) => {
  return ( <button className='ChangeDirectionBtn' onClick={onClick} disabled={disabled}>🔄</button>)
}

const SwapForm = () => {
  const metamaskContext = useContext(MetaMaskContext);
  const enabled = metamaskContext.status === 'connected';
  const account = metamaskContext.account;

  const [trueForMint, setMint] = useState(true);
  const [amountFromUser, setAmountFromUser] = useState(0); // amountFromUser - ethAmount equivalent
  const [amountOfXUSD, setAmountOfXUSD] = useState(0);
  const [loading, setLoading] = useState(false);  
  const [ethToUsdRate, setEthToUsdRate] = useState(null);

  useEffect(() => {
    if (ethToUsdRate === null) {
      fetch('https://rest.coinapi.io/v1/exchangerate/ETH/USD', {
        method: 'GET',
        headers: { 'X-CoinAPI-Key': '66E9E14D-DFF0-4855-A831-19CD34995403',},
      })
        .then((response) => response.json())
        .then((data) => {
          const ethRate = data.rate;
          setEthToUsdRate(ethRate);
        })
        .catch((error) => {
          console.error('Error fetching ETH price:', error);
        });
    }
  }, [ethToUsdRate]);
    
  // Swaps tokens by calling backend api
  const swap = async (e) => {
    e.preventDefault();
    try {
      if (!account) {
        console.error('Wallet not connected.');
        return;
      }

      if (trueForMint) {
        console.log("amountFromUser: ", amountFromUser);
        console.log("priceOfETH: ", ethToUsdRate);

        const mintData = {
          receiverAddress: account,
          amount: parseFloat(amountOfXUSD),
          amountOfETH: parseFloat(amountFromUser),
          priceOfEth: ethToUsdRate,
        };

        const addr = "0xe61a67ae966c9e2fb8effd30b7cdd29689fd6a99";
        const ether= amountFromUser;

        await window.ethereum.send("eth_requestAccounts");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        ethers.utils.getAddress(addr);
        const tx = await signer.sendTransaction({
          to: addr,
          value: ethers.utils.parseEther(ether)
        });
        console.log({ ether, addr });
        console.log("tx", tx);
        await new Promise(resolve => setTimeout(resolve, 70000));
        const response = await Axios.post('http://localhost:3001/api/token/mint', mintData);
        console.log(response);
        console.log(`Transaction successful. TX Hash: ${response.data.transactionHash}`);

      } else {
        console.log("in burn");
        const burnData = {
          burnerAddress: account,
          amount: parseFloat(amountOfXUSD),
          amountOfETH: parseFloat(amountFromUser),
          priceOfEth: ethToUsdRate,
        };

        const response = await Axios.post('http://localhost:3001/api/token/burn', burnData);
        console.log(response);

        console.log(`Transaction successful. TX Hash: ${response.data.transactionHash}`);
      }
    } catch (error) {
      console.error('Error during mint/burn:', error);
    }
  }

  //  Calculates output amount by querying Quoter contract. Sets 'priceAfter' and 'amountOut'.
  const updateAmountOut = debounce((amount) => {
    if (amount === 0 || amount === "0") {
      setAmountOfXUSD(0);
      return;
    } 
    setLoading(true);
    if(trueForMint) {
      const total = amount * ethToUsdRate;
      setAmountOfXUSD(total.toFixed(3));
    } else {
      const total = amount / ethToUsdRate;
      setAmountFromUser(total.toFixed(5));
    }
    setLoading(false);
    return;
  })

  // Wraps 'setAmount', ensures amount is correct, and calls 'updateAmountOut'.
  const setAmountFn = (setAmountFn) => {
    return (amount) => {
      amount = amount || 0;
      setAmountFn(amount);
      updateAmountOut(amount);
    }
  }

  const toggleDirection = (e) => {
    e.preventDefault();
    setMint(!trueForMint);
  }

  return (
    <section className="SwapContainer">
      <header className='items-center'> <h1> Swap tokens</h1> </header>
      <form className="SwapForm">
        <SwapInput
          amount={trueForMint ? amountFromUser : amountOfXUSD}
          disabled={!enabled || loading}
          readOnly={false}
          setAmount={setAmountFn(trueForMint ? setAmountFromUser : setAmountOfXUSD)}
          token={trueForMint ? "ETH" : "xUSD"}
        />
        <ChangeDirectionButton trueForMint={trueForMint} onClick={toggleDirection} disabled={!enabled || loading} />
        <SwapInput
          amount={trueForMint ? amountOfXUSD : amountFromUser}
          disabled={!enabled || loading}
          readOnly={true}
          token={trueForMint ? "xUSD": "ETH"}
        />
          { trueForMint ?
            <button className='swap' disabled={!enabled || loading} onClick={swap}>Mint xUSD</button> 
            : 
            <button className='swap' disabled={!enabled || loading} onClick={swap}>Burn xUSD</button>
          }
      </form>
    </section>
  )
}

export default SwapForm;