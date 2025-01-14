import firebase from '@react-native-firebase/app'
import BigNumber from 'bignumber.js'
import { default as DeviceInfo } from 'react-native-device-info'
import { FIREBASE_ENABLED } from 'src/config'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import { ProviderSelectionAnalyticsData } from 'src/fiatExchanges/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { UserLocationData } from 'src/networkInfo/saga'
import { TokenBalance } from 'src/tokens/slice'
import { CiCoCurrency, Currency } from 'src/utils/currencies'
import { fetchWithTimeout } from 'src/utils/fetchWithTimeout'
import Logger from 'src/utils/Logger'
import networkConfig from 'src/web3/networkConfig'

const TAG = 'fiatExchanges:utils'

export enum FiatExchangeFlow {
  CashIn = 'CashIn',
  CashOut = 'CashOut',
  Spend = 'Spend',
}

export enum CICOFlow {
  CashIn = 'CashIn',
  CashOut = 'CashOut',
}

export enum PaymentMethod {
  Bank = 'Bank',
  Card = 'Card',
  Coinbase = 'Coinbase',
  MobileMoney = 'MobileMoney', // legacy mobile money
  FiatConnectMobileMoney = 'FiatConnectMobileMoney',
}

export enum CloudFunctionDigitalAsset {
  CELO = 'CELO',
  CUSD = 'CUSD',
  CEUR = 'CEUR',
  CREAL = 'CREAL',
}
interface ProviderRequestData {
  userLocation: UserLocationData
  walletAddress: string
  fiatCurrency: LocalCurrencyCode
  digitalAsset: CloudFunctionDigitalAsset
  fiatAmount?: number
  digitalAssetAmount?: number
  txType: 'buy' | 'sell'
}

export interface FetchProvidersOutput {
  name: string
  restricted: boolean
  unavailable?: boolean
  paymentMethods: PaymentMethod[]
  url?: string
  logoWide: string
  logo: string
  quote?: SimplexQuote | RawProviderQuote[]
  cashIn: boolean
  cashOut: boolean
}

export interface UserAccountCreationData {
  ipAddress: string
  timestamp: string
  userAgent: string
}

export interface RawProviderQuote {
  paymentMethod: PaymentMethod
  digitalAsset: string
  returnedAmount?: number
  fiatFee?: number
}
export interface LegacyMobileMoneyProvider {
  name: string
  celo: {
    cashIn: boolean
    cashOut: boolean
    countries: string[]
    url: string
  }
  cusd: {
    cashIn: boolean
    cashOut: boolean
    countries: string[]
    url: string
  }
}

interface SimplexPaymentData {
  orderId: string
  paymentId: string
  checkoutHtml: string
}

export interface ProviderInfo {
  name: string
  logoWide: string
  logo: string
}

export type ProviderQuote = RawProviderQuote & {
  cashIn: boolean
  cashOut: boolean
  url: string
}

export type SimplexQuote = {
  user_id: string
  quote_id: string
  wallet_id: string
  digital_money: {
    currency: string
    amount: number
  }
  fiat_money: {
    currency: string
    base_amount: number
    total_amount: number
  }
  valid_until: string
  supported_digital_currencies: string[]
}

export interface CicoQuote {
  quote: ProviderQuote | SimplexQuote
  provider: ProviderInfo
}

const composePostObject = (body: any) => ({
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})

export const fetchProviders = async (
  requestData: ProviderRequestData
): Promise<FetchProvidersOutput[] | undefined> => {
  try {
    const response = await fetchWithTimeout(
      networkConfig.providerFetchUrl,
      composePostObject(requestData)
    )

    if (!response.ok) {
      throw Error(`Fetch failed with status ${response?.status}`)
    }

    return response.json()
  } catch (error) {
    Logger.error(`${TAG}:fetchProviders`, 'Failed to fetch providers', error)
    throw error
  }
}

export const fetchSimplexPaymentData = async (
  userAddress: string,
  phoneNumber: string | null,
  phoneNumberVerified: boolean,
  simplexQuote: SimplexQuote,
  currentIpAddress: string
) => {
  try {
    const response = await fetchWithTimeout(
      networkConfig.simplexApiUrl,
      composePostObject({
        type: 'payment',
        userAddress,
        phoneNumber,
        phoneNumberVerified,
        simplexQuote,
        currentIpAddress,
        deviceInfo: {
          id: DeviceInfo.getUniqueId(),
          appVersion: DeviceInfo.getVersion(),
          userAgent: DeviceInfo.getUserAgentSync(),
        },
      })
    )

    if (!response.ok) {
      throw Error(`Fetch failed with status ${response?.status}`)
    }

    const simplexPaymentDataResponse = await response.json()
    if (simplexPaymentDataResponse?.error) {
      throw Error(simplexPaymentDataResponse.error)
    }

    const simplexPaymentData: SimplexPaymentData = simplexPaymentDataResponse
    return simplexPaymentData
  } catch (error) {
    Logger.error(`${TAG}:fetchSimplexPaymentData`, 'Failed to fetch simplex payment data', error)
    throw error
  }
}

export const isSimplexQuote = (quote: RawProviderQuote[] | SimplexQuote): quote is SimplexQuote =>
  !!quote && 'wallet_id' in quote

const typeCheckNestedProperties = (obj: any, property: string) =>
  obj[property] &&
  typeof obj[property].cashIn === 'boolean' &&
  typeof obj[property].cashOut === 'boolean' &&
  typeof obj[property].url === 'string' &&
  obj[property].countries instanceof Array &&
  obj[property].countries.every(
    (country: any) => typeof country === 'string' && country.length === 2
  )

const isLegacyMobileMoneyProvider = (obj: any): obj is LegacyMobileMoneyProvider => {
  return (
    typeof obj.name === 'string' &&
    typeCheckNestedProperties(obj, 'celo') &&
    typeCheckNestedProperties(obj, 'cusd')
  )
}

export const fetchLegacyMobileMoneyProviders = async () => {
  if (!FIREBASE_ENABLED) return []
  const firebaseLocalProviders: any[] = await firebase
    .database()
    .ref('localCicoProviders')
    .once('value')
    .then((snapshot) => snapshot.val())
    .then((providers) =>
      Object.entries(providers).map(([name, values]: [string, any]) => ({
        ...values,
        name,
      }))
    )

  const providers: LegacyMobileMoneyProvider[] = firebaseLocalProviders.filter((provider) =>
    isLegacyMobileMoneyProvider(provider)
  )

  return providers
}

export const filterLegacyMobileMoneyProviders = (
  providers: LegacyMobileMoneyProvider[] | undefined,
  flow: CICOFlow,
  userCountry: string | null,
  selectedCurrency: CiCoCurrency
) => {
  if (
    !providers ||
    !userCountry ||
    ![CiCoCurrency.cUSD, CiCoCurrency.CELO].includes(selectedCurrency)
  ) {
    return []
  }

  const activeProviders = providers.filter(
    (provider) =>
      (flow === CICOFlow.CashIn && (provider.cusd.cashIn || provider.celo.cashIn)) ||
      (flow === CICOFlow.CashOut && (provider.cusd.cashOut || provider.celo.cashOut))
  )

  return activeProviders.filter((provider) =>
    provider[selectedCurrency === CiCoCurrency.cUSD ? 'cusd' : 'celo'].countries.includes(
      userCountry
    )
  )
}

export async function fetchExchanges(
  countryCodeAlpha2: string | null,
  currency: CiCoCurrency
): Promise<ExternalExchangeProvider[] | undefined> {
  // If user location data is not available, default fetching exchanges serving the US
  if (!countryCodeAlpha2) countryCodeAlpha2 = 'us'
  // Standardize cGLD to CELO

  try {
    const resp = await fetch(
      `${networkConfig.fetchExchangesUrl}?country=${countryCodeAlpha2}&currency=${currency}`
    )

    if (!resp.ok) {
      throw Error(`Fetch exchanges failed with status ${resp?.status}`)
    }

    return resp.json()
  } catch (error) {
    Logger.error(TAG, 'Failure fetching available exchanges', error)
    throw error
  }
}

export const filterProvidersByPaymentMethod = (
  paymentMethod: PaymentMethod,
  externalProviders: FetchProvidersOutput[] | undefined
) => {
  return externalProviders?.find((quote) => quote.paymentMethods.includes(paymentMethod))
}

export const isUserInputCrypto = (flow: CICOFlow): boolean => flow === CICOFlow.CashOut

export function resolveCloudFunctionDigitalAsset(
  currency: CiCoCurrency
): CloudFunctionDigitalAsset {
  const mapping: Record<CiCoCurrency, CloudFunctionDigitalAsset> = {
    [CiCoCurrency.CELO]: CloudFunctionDigitalAsset.CELO,
    [CiCoCurrency.cUSD]: CloudFunctionDigitalAsset.CUSD,
    [CiCoCurrency.cEUR]: CloudFunctionDigitalAsset.CEUR,
    [CiCoCurrency.cREAL]: CloudFunctionDigitalAsset.CREAL,
  }
  return mapping[currency]
}

/**
 * Get analytics data for provider selection.
 *
 * Used for cico_providers_quote_selected, cico_providers_exchanges_selected and
 * coinbase_pay_flow_start analytics events.
 */
export function getProviderSelectionAnalyticsData({
  normalizedQuotes,
  exchangeRates,
  tokenInfo,
  legacyMobileMoneyProviders,
  centralizedExchanges,
  coinbasePayAvailable,
  transferCryptoAmount,
  cryptoType,
}: {
  normalizedQuotes: NormalizedQuote[]
  exchangeRates: { [token in Currency]: string | null }
  tokenInfo?: TokenBalance
  legacyMobileMoneyProviders?: LegacyMobileMoneyProvider[]
  centralizedExchanges?: ExternalExchangeProvider[]
  coinbasePayAvailable: boolean
  transferCryptoAmount: number
  cryptoType: CiCoCurrency
}): ProviderSelectionAnalyticsData {
  let lowestFeePaymentMethod: PaymentMethod | undefined = undefined
  let lowestFeeProvider: string | undefined = undefined
  let lowestFeeCryptoAmount: BigNumber | null = null
  let lowestFeeKycRequired: boolean | undefined = undefined
  const centralizedExchangesAvailable = !!centralizedExchanges && centralizedExchanges?.length > 0
  const paymentMethodsAvailable: Record<PaymentMethod, boolean> = {
    [PaymentMethod.Bank]: false,
    [PaymentMethod.Card]: false,
    [PaymentMethod.FiatConnectMobileMoney]: false,
    [PaymentMethod.Coinbase]: coinbasePayAvailable,
    [PaymentMethod.MobileMoney]:
      !!legacyMobileMoneyProviders && legacyMobileMoneyProviders.length > 0,
  }

  for (const quote of normalizedQuotes) {
    paymentMethodsAvailable[quote.getPaymentMethod()] = true
    if (tokenInfo) {
      const fee = quote.getFeeInCrypto(exchangeRates, tokenInfo)
      if (fee && (lowestFeeCryptoAmount === null || fee.isLessThan(lowestFeeCryptoAmount))) {
        lowestFeeCryptoAmount = fee
        lowestFeePaymentMethod = quote.getPaymentMethod()
        lowestFeeProvider = quote.getProviderId()
        lowestFeeKycRequired = !!quote.getKycInfo()
      }
    }
  }

  return {
    transferCryptoAmount,
    cryptoType,
    paymentMethodsAvailable,
    lowestFeePaymentMethod,
    lowestFeeProvider,
    lowestFeeKycRequired,
    centralizedExchangesAvailable,
    coinbasePayAvailable,
    lowestFeeCryptoAmount: lowestFeeCryptoAmount?.toNumber(),
    // counts centralized exchanges as single option, since that's how they appear on the Select Providers screen
    totalOptions:
      (centralizedExchangesAvailable ? 1 : 0) +
      (coinbasePayAvailable ? 1 : 0) +
      (legacyMobileMoneyProviders?.length ?? 0) +
      normalizedQuotes.length,
  }
}
