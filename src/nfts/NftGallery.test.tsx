import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { NftEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import NftGallery from 'src/nfts/NftGallery'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockNftAllFields,
  mockNftMinimumFields,
  mockNftNullMetadata,
} from 'test/values'

jest.mock('src/analytics/ValoraAnalytics')

const defaultStore = createMockStore({
  web3: {
    account: mockAccount,
  },
  nfts: {
    nfts: [mockNftAllFields, mockNftMinimumFields, mockNftNullMetadata],
    nftsLoading: false,
    nftsError: null,
  },
})

describe('NftGallery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows NFTs from redux store', () => {
    const { getAllByTestId, queryByTestId } = render(
      <Provider store={defaultStore}>
        <NftGallery />
      </Provider>
    )

    // Should load two NFTs images and one placeholder
    expect(getAllByTestId('NftGallery/NftImage')).toHaveLength(2)
    expect(getAllByTestId('NftGallery/NftImage')[0]).toHaveProp(
      'source',
      expect.objectContaining({
        uri: mockNftAllFields.media[0].gateway,
        headers: {
          origin: networkConfig.nftsValoraAppUrl,
        },
      })
    )
    expect(getAllByTestId('NftGallery/NftImage')[1]).toHaveProp(
      'source',
      expect.objectContaining({
        uri: mockNftMinimumFields.media[0].gateway,
        headers: {
          origin: networkConfig.nftsValoraAppUrl,
        },
      })
    )

    // Expect NFTs with no metadata not to display
    expect(queryByTestId('ImageErrorIcon')).toBeFalsy()
  })

  it('shows error message when error', () => {
    const store = createMockStore({
      ...defaultStore.getState(),
      nfts: {
        nfts: [],
        nftsLoading: false,
        nftsError: 'Error',
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <NftGallery />
      </Provider>
    )

    expect(getByTestId('NftGallery/NftsLoadErrorScreen')).toBeTruthy()
  })

  it('shows no NFTs message when no wallet address has no NFTs', () => {
    const store = createMockStore({
      ...defaultStore.getState(),
      nfts: {
        nfts: [],
        nftsLoading: false,
        nftsError: null,
      },
    })
    const { getByText } = render(
      <Provider store={store}>
        <NftGallery />
      </Provider>
    )

    expect(getByText('nftGallery.noNfts')).toBeTruthy()
  })

  it('sends analytics on screen load', () => {
    render(
      <Provider store={defaultStore}>
        <NftGallery />
      </Provider>
    )

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(NftEvents.nft_gallery_screen_open, {
      numNfts: 2,
    })
  })
})
