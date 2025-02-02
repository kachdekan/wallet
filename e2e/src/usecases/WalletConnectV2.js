import { newKit } from '@celo/contractkit'
import {
  hashMessageWithPrefix,
  verifyEIP712TypedDataSigner,
  verifySignature,
} from '@celo/utils/lib/signatureUtils'
import { recoverTransaction } from '@celo/wallet-base'
import Client from '@walletconnect/sign-client'
import fetch from 'node-fetch'
import { WALLET_CONNECT_PROJECT_ID_E2E } from 'react-native-dotenv'
import { formatUri, utf8ToHex } from '../utils/encoding'
import { launchApp, reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, scrollIntoView, sleep, waitForElementId } from '../utils/utils'
import { Core } from '@walletconnect/core'

const jestExpect = require('expect')

const dappName = 'WalletConnectV2 E2E'

const kitUrl = process.env.FORNO_URL || 'https://alfajores-forno.celo-testnet.org'
const kit = newKit(kitUrl)

const walletAddress = (
  process.env.E2E_WALLET_ADDRESS || '0x6131a6d616a4be3737b38988847270a64bc10caa'
).toLowerCase()

async function formatTestTransaction(address) {
  try {
    const response = await fetch(kitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
        id: 1,
      }),
    })
    const data = await response.json()

    return {
      from: address,
      to: address,
      data: '0x',
      nonce: parseInt(data.result, 16),
      gasPrice: '0x02540be400',
      gasLimit: '0x5208',
      value: '0x01',
    }
  } catch (error) {
    throw new Error(`Failed to create test tx with error ${error.toString()}`)
  }
}

const verifySuccessfulConnection = async () => {
  await waitFor(element(by.text(`Success! Please go back to ${dappName} to continue`)))
    .toBeVisible()
    .withTimeout(15 * 1000)
  await waitFor(element(by.id('SendOrRequestBar')))
    .toBeVisible()
    .withTimeout(15 * 1000)
}

const verifySuccessfulSign = async () => {
  await waitFor(element(by.text(`Confirm transaction`)))
    .toBeVisible()
    .withTimeout(15 * 1000)
  await waitFor(element(by.text(`${dappName} would like to sign a data payload.`)))
    .toBeVisible()
    .withTimeout(15 * 1000)
  await element(by.text('Allow')).tap()
  await enterPinUiIfNecessary()
  await verifySuccessfulConnection()
}

const verifySuccessfulTransaction = async (tx) => {
  await waitFor(element(by.text(`Confirm transaction`)))
    .toBeVisible()
    .withTimeout(15 * 1000)

  await expect(element(by.id('WalletConnectRequest/ActionRequestPayload/Value'))).toHaveText(
    `[${JSON.stringify(tx)}]`
  )

  await element(by.id('WalletConnectActionRequest/Allow')).tap()
  await enterPinUiIfNecessary()
  await verifySuccessfulConnection()
}

export default WalletConnect = () => {
  let walletConnectClient, pairingUrl, core
  let intervalsToClear = []

  beforeAll(async () => {
    // ensure clean slate when starting the tests, in case test cases before this ended on a different screen
    await reloadReactNative()

    // @walletconnect/heartbeat keeps a setInterval running, which causes jest to hang, unable to shut down cleanly
    // https://github.com/WalletConnect/walletconnect-utils/blob/4484e47f24a5a82078c27a0cf0185db921cf60d7/misc/heartbeat/src/heartbeat.ts#L47
    // As a workaround, since no reference to the interval is kept, we capture them
    // during the WC client init, and then clear them after the test is done
    // Note: this is a hack, and should be removed once @walletconnect/heartbeat is fixed
    const originalSetInterval = global.setInterval
    const originalAbortController = global.AbortController
    global.setInterval = (...args) => {
      const id = originalSetInterval(...args)
      intervalsToClear.push(id)
      return id
    }
    // This is fixed in Jest 27, but we're still on 26
    const abortFn = jest.fn()
    global.AbortController = jest.fn(() => ({
      abort: abortFn,
    }))

    core = await Core.init({
      projectId: WALLET_CONNECT_PROJECT_ID_E2E,
      relayUrl: 'wss://relay.walletconnect.org',
    })

    walletConnectClient = await Client.init({
      core,
      metadata: {
        name: dappName,
        description: 'WalletConnect Client',
        url: 'https://valoraapp.com/',
        icons: [],
      },
    })

    // Now restore the original setInterval
    global.setInterval = originalSetInterval
    global.AbortController = originalAbortController

    const { uri } = await walletConnectClient.connect({
      requiredNamespaces: {
        eip155: {
          methods: [
            'eth_sendTransaction',
            'eth_signTransaction',
            'eth_sign',
            'personal_sign',
            'eth_signTypedData',
          ],
          chains: ['eip155:44787'],
          events: ['chainChanged', 'accountsChanged'],
        },
      },
    })

    pairingUrl = formatUri(uri)
  })

  beforeEach(async () => {
    // wait for any banners to disappear
    await sleep(5000)
  })

  afterAll(async () => {
    // Clear the captured intervals and the transport (connection), so jest can shut down cleanly
    intervalsToClear.forEach((id) => clearInterval(id))
    await walletConnectClient.core.relayer.transportClose()
  })

  it('Then is able to establish a session', async () => {
    if (device.getPlatform() === 'android') {
      await launchApp({ url: pairingUrl, newInstance: true })
    } else {
      await device.openURL({ url: pairingUrl })
    }

    await waitFor(element(by.id('WalletConnectSessionRequestHeader')))
      .toBeVisible()
      .withTimeout(30 * 1000)

    await element(by.text('Allow')).tap()
    await verifySuccessfulConnection()
  })

  it('Then is able to send a transaction (eth_sendTransaction)', async () => {
    let txHash
    const tx = await formatTestTransaction(walletAddress)
    const [session] = walletConnectClient.session.map.values()
    walletConnectClient
      .request({
        topic: session.topic,
        chainId: 'eip155:44787',
        request: {
          method: 'eth_sendTransaction',
          params: [tx],
        },
      })
      .then((result) => {
        txHash = result
      })

    await waitFor(element(by.text(`${dappName} would like to send a Celo transaction.`)))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await verifySuccessfulTransaction(tx)

    // Wait for transaction and get receipt
    const { status, from, to } = await kit.connection.getTransactionReceipt(txHash)

    jestExpect(status).toStrictEqual(true)
    jestExpect(from).toStrictEqual(walletAddress)
    jestExpect(to).toStrictEqual(walletAddress)
  })

  it('Then is able to sign a transaction (eth_signTransaction)', async () => {
    let signedTx
    const tx = await formatTestTransaction(walletAddress)
    const [session] = walletConnectClient.session.map.values()
    walletConnectClient
      .request({
        topic: session.topic,
        chainId: 'eip155:44787',
        request: {
          method: 'eth_signTransaction',
          params: [tx],
        },
      })
      .then((result) => {
        signedTx = result
      })

    await waitFor(element(by.text(`${dappName} would like to sign a Celo transaction.`)))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await verifySuccessfulTransaction(tx)

    const [recoveredTx, recoveredSigner] = recoverTransaction(signedTx)

    jestExpect(recoveredSigner.toLowerCase()).toEqual(walletAddress)
    jestExpect(recoveredTx.nonce).toEqual(tx.nonce)
    jestExpect(recoveredTx.to).toEqual(tx.to)
    jestExpect(recoveredTx.data).toEqual(tx.data)
    jestExpect(recoveredTx.value).toEqual(tx.value)
  })

  it('Then is able to sign a message (eth_sign)', async () => {
    let signature
    const message = hashMessageWithPrefix(`My email is valora.test@mailinator.com - ${+new Date()}`)
    const params = [walletAddress, message]
    const [session] = walletConnectClient.session.map.values()
    walletConnectClient
      .request({
        topic: session.topic,
        chainId: 'eip155:44787',
        request: {
          method: 'eth_sign',
          params,
        },
      })
      .then((result) => {
        signature = result
      })

    await verifySuccessfulSign()

    jestExpect(verifySignature(message, signature, walletAddress)).toStrictEqual(true)
  })

  it('Then is able to sign a personal message (personal_sign)', async () => {
    let signature
    const message = `My email is valora.test@mailinator.com - ${+new Date()}`
    const params = [utf8ToHex(message), walletAddress]
    const [session] = walletConnectClient.session.map.values()
    walletConnectClient
      .request({
        topic: session.topic,
        chainId: 'eip155:44787',
        request: {
          method: 'personal_sign',
          params,
        },
      })
      .then((result) => {
        signature = result
      })

    await verifySuccessfulSign()

    jestExpect(verifySignature(message, signature, walletAddress)).toStrictEqual(true)
  })

  it('Then is able to sign typed data (eth_signTypedData)', async () => {
    let signature
    const typedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'wallet', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
          { name: 'other', type: 'OtherTypes' },
        ],
        // Ensure some "less" common types are supported
        OtherTypes: [
          { name: 'ui8', type: 'uint8' },
          { name: 'ui160', type: 'uint160' },
          { name: 'i8', type: 'int8' },
          { name: 'i160', type: 'int160' },
          { name: 'b1', type: 'bytes1' },
          { name: 'b17', type: 'bytes17' },
          { name: 'b32', type: 'bytes32' },
        ],
      },
      primaryType: 'Mail',
      domain: {
        name: 'Ether Mail',
        version: '1',
        chainId: 1,
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
      },
      message: {
        from: { name: 'Cow', wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826' },
        to: { name: 'Bob', wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB' },
        contents: 'Hello, Bob!',
        other: {
          ui8: 250,
          ui160: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
          i8: -120,
          i160: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
          b1: '0x01',
          b17: '0x0102030405060708090a0b0c0d0e0f1011',
          b32: '0x0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20',
        },
      },
    }
    const params = [walletAddress, JSON.stringify(typedData)]
    const [session] = walletConnectClient.session.map.values()
    walletConnectClient
      .request({
        topic: session.topic,
        chainId: 'eip155:44787',
        request: {
          method: 'eth_signTypedData',
          params,
        },
      })
      .then((result) => {
        signature = result
      })

    await verifySuccessfulSign()

    jestExpect(verifyEIP712TypedDataSigner(typedData, signature, walletAddress)).toStrictEqual(true)
  })

  it('Then should be able to disconnect a session', async () => {
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()

    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitForElementId('Settings')
    await element(by.id('Settings')).tap()
    await element(by.id('ConnectedApplications')).tap()
    await element(by.text('Tap to Disconnect')).tap()
    await element(by.text('Disconnect')).tap()
    await element(by.id('BackChevron')).tap()
    await expect(element(by.id('ConnectedApplications/value'))).toHaveText('0')
  })
}
