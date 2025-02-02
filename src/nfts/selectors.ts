import { createSelector } from 'reselect'
import { RootState } from 'src/redux/reducers'

export const nftsLoadingSelector = (state: RootState) => state.nfts.nftsLoading

export const nftsErrorSelector = (state: RootState) => state.nfts.nftsError

export const nftsSelector = (state: RootState) => state.nfts.nfts

export const nftsWithMetadataSelector = createSelector(nftsSelector, (nfts) =>
  nfts.filter((nft) => nft.metadata)
)
