const Web3 = require('web3')
const OriginTokenContract = require('./OriginToken')
const MultiSigWalletContract = require('./MultiSigWallet')
const assert = require('assert')

const web3Url = 'http://127.0.0.1:8545'

const tokenAddress = '0x345ca3e014aaf5dca488057592ee47305d9b3e10'
const multiSigWalletAddress = '0x38cf23c52bb4b13f051aec09580a2de845a7fa35'

async function createTransferTxn() {
  // Basic setup
  const web3Provider = new Web3.providers.HttpProvider(web3Url)
  const web3 = new Web3(web3Provider)
  const accounts = await new Promise((resolve, reject) => {
    web3.eth.getAccounts((error, result) => {
      if (error) {
        reject(err)
      }
      resolve(result)
    })
  })
  const signer = accounts[0]
  const otherAccount = accounts[1]
  const OriginToken = new web3.eth.Contract(OriginTokenContract.abi, tokenAddress)
  const MultiSigWallet = new web3.eth.Contract(MultiSigWalletContract.abi, multiSigWalletAddress)

  // Validate stuff, because local blockchains are so ephemeral and error
  // messages are sometimes cryptic
  assert.equal(await OriginToken.methods.symbol().call(), 'OGN')
  assert.equal(await MultiSigWallet.methods.isOwner(signer).call(), true)

  // Step 1: Create hex data for Ethereum transaction
  const amount = '1000000000000000000' // 1 OGN
  const data = await OriginToken.methods.transfer(otherAccount, amount).encodeABI()
  console.log('txn data:', data)

  // Step 2: Submit transaction to multsig wallet, pending further signatures
  const submit = MultiSigWallet.methods.submitTransaction(OriginToken._address, 0 /* eth */, data)
  const submitGas = await submit.estimateGas({gas: 600000}) // this returns ~173k gas
  await submit.send({ from: signer, gas: submitGas })

  // Step 3: in the Gnosis DApp, the other required signers confirm the transaction
  console.log('\ntransaction submitted. the transaction must now be confirmed in the Gnosis UI by the other signers')
}

createTransferTxn()
