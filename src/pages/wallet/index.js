import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Web3 from 'web3';
import './index.css';

function Wallet() {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [web3, setWeb3] = useState(null);
  const [sendAddress, setSendAddress] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadBalance = useCallback(async () => {
    try {
      if (account && web3) {
        const balanceWei = await web3.eth.getBalance(account);
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
        setBalance(parseFloat(balanceEth).toFixed(4));
      }
    } catch (err) {
      setError('Failed to load balance');
    }
  }, [account, web3]);

  useEffect(() => {
    if (account && web3) {
      loadBalance();
    }
  }, [account, web3, loadBalance]);

  const connectWallet = async () => {
    try {
      setError('');
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
        setWeb3(web3Instance);
        setSuccess('Wallet connected successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Please install MetaMask or another Web3 wallet');
      }
    } catch (err) {
      setError(err.message || 'Failed to connect wallet');
    }
  };


  const sendETH = async () => {
    if (!sendAddress || !sendAmount) {
      setError('Please enter recipient address and amount');
      return;
    }

    if (!web3.utils.isAddress(sendAddress)) {
      setError('Invalid Ethereum address');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      const amountWei = web3.utils.toWei(sendAmount, 'ether');
      const gasPrice = await web3.eth.getGasPrice();
      const gasEstimate = await web3.eth.estimateGas({
        from: account,
        to: sendAddress,
        value: amountWei,
      });

      await web3.eth.sendTransaction({
        from: account,
        to: sendAddress,
        value: amountWei,
        gas: gasEstimate,
        gasPrice: gasPrice,
      });

      setSuccess(`Successfully sent ${sendAmount} ETH!`);
      setSendAddress('');
      setSendAmount('');
      loadBalance();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    setSuccess('Address copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="wallet-container">
      <div className="wallet-wrapper">
        <button className="back-button" onClick={() => navigate('/')} title="Go back">
          <span className="back-arrow">←</span>
          <span className="back-text">Back</span>
        </button>
        <div className="wallet-header">
          <h1 className="wallet-title">ETH Wallet</h1>
          <p className="wallet-subtitle">Manage your Ethereum transactions</p>
        </div>

        {!account ? (
          <div className="connect-section">
            <div className="connect-card">
              <div className="wallet-icon">🔐</div>
              <h2>Connect Your Wallet</h2>
              <p>Connect your MetaMask wallet to get started</p>
              <button className="connect-btn" onClick={connectWallet}>
                Connect Wallet
              </button>
            </div>
          </div>
        ) : (
          <div className="wallet-content">
            {/* Account Info Card */}
            <div className="account-card">
              <div className="account-header">
                <div className="account-info">
                  <h3>Your Account</h3>
                  <div className="address-display">
                    <span className="address-text">{formatAddress(account)}</span>
                    <button className="copy-btn" onClick={copyAddress} title="Copy address">
                      📋
                    </button>
                  </div>
                </div>
                <div className="balance-display">
                  <div className="balance-label">Balance</div>
                  <div className="balance-amount">{balance} ETH</div>
                </div>
              </div>
            </div>

            {/* Send ETH Card */}
            <div className="send-card">
              <h3>Send ETH</h3>
              <div className="form-group">
                <label>Recipient Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="0x..."
                  value={sendAddress}
                  onChange={(e) => setSendAddress(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Amount (ETH)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0.0"
                  step="0.001"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                />
              </div>
              <button
                className="send-btn"
                onClick={sendETH}
                disabled={isLoading || !sendAddress || !sendAmount}
              >
                {isLoading ? 'Processing...' : 'Send ETH'}
              </button>
            </div>

            {/* Receive ETH Card */}
            <div className="receive-card">
              <h3>Receive ETH</h3>
              <div className="receive-content">
                <div className="qr-placeholder">
                  <div className="qr-code">
                    <div className="qr-pattern"></div>
                  </div>
                </div>
                <div className="receive-address">
                  <label>Your Address</label>
                  <div className="address-box">
                    <code>{account}</code>
                    <button className="copy-btn-large" onClick={copyAddress}>
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="message error-message">
                <span>⚠️</span> {error}
              </div>
            )}
            {success && (
              <div className="message success-message">
                <span>✅</span> {success}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Wallet;

