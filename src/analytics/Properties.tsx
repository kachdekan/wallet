import { DappKitRequestTypes } from '@celo/utils'
import {
  FiatAccountSchema,
  FiatConnectError,
  KycStatus as FiatConnectKycStatus,
} from '@fiatconnect/fiatconnect-types'
import { check } from 'react-native-permissions'
import { PincodeType } from 'src/account/reducer'
import {
  AppEvents,
  AssetsEvents,
  AuthenticationEvents,
  BuilderHooksEvents,
  CICOEvents,
  CeloExchangeEvents,
  CeloNewsEvents,
  CoinbasePayEvents,
  ContractKitEvents,
  DappExplorerEvents,
  DappKitEvents,
  DappShortcutsEvents,
  EscrowEvents,
  FeeEvents,
  FiatExchangeEvents,
  HomeEvents,
  IdentityEvents,
  InviteEvents,
  KeylessBackupEvents,
  NavigationEvents,
  NftEvents,
  OnboardingEvents,
  PerformanceEvents,
  PhoneVerificationEvents,
  QrScreenEvents,
  RequestEvents,
  RewardsEvents,
  SendEvents,
  SettingsEvents,
  SwapEvents,
  TokenBottomSheetEvents,
  TransactionEvents,
  VerificationEvents,
  WalletConnectEvents,
  WebViewEvents,
} from 'src/analytics/Events'
import {
  BackQuizProgress,
  DappRequestOrigin,
  HooksEnablePreviewOrigin,
  ScrollDirection,
  SendOrigin,
  WalletConnectPairingOrigin,
} from 'src/analytics/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { TokenPickerOrigin } from 'src/components/TokenBottomSheet'
import {
  RewardsScreenCta,
  RewardsScreenOrigin,
} from 'src/consumerIncentives/analyticsEventsTracker'
import { DappSection } from 'src/dapps/types'
import { ProviderSelectionAnalyticsData } from 'src/fiatExchanges/types'
import { CICOFlow, FiatExchangeFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { HomeActionName } from 'src/home/types'
import { KeylessBackupFlow } from 'src/keylessBackup/types'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { NftOrigin } from 'src/nfts/types'
import { NotificationReceiveState } from 'src/notifications/types'
import { AdventureCardName } from 'src/onboarding/types'
import { RecipientType } from 'src/recipients/recipient'
import { Field } from 'src/swap/types'
import { CiCoCurrency, Currency, CurrencyOrCREAL, StableCurrency } from 'src/utils/currencies'
import { Awaited } from 'src/utils/typescript'

type PermissionStatus = Awaited<ReturnType<typeof check>>

interface AppEventsProperties {
  [AppEvents.app_launched]: {
    // TODO: Figure out how to measure loadingDuration iOS and make param required
    reactLoadDuration?: number
    appLoadDuration?: number
    deviceInfo?: object
    deviceHeight: number
    deviceWidth: number
    language: string | null
  }
  [AppEvents.app_state_error]: {
    error: string
  }
  [AppEvents.error_displayed]: {
    error: string
  }
  [AppEvents.error_fallback]: {
    error: ErrorMessages
  }
  [AppEvents.error_boundary]: {
    error: string
  }
  [AppEvents.user_restart]: undefined
  [AppEvents.fetch_balance]: {
    dollarBalance?: string
    goldBalance?: string
  }
  [AppEvents.fetch_balance_error]: {
    dollarBalance?: string
    goldBalance?: string
    error?: string
  }
  [AppEvents.redux_keychain_mismatch]: {
    account: string
  }
  [AppEvents.redux_store_recovery_success]: {
    account: string
  }
  [AppEvents.redux_no_matching_keychain_account]: {
    walletAddress: string
  }
  [AppEvents.push_notification_opened]: {
    id?: string
    state: NotificationReceiveState
    type?: string
  }
  [AppEvents.push_notifications_permission_changed]: {
    enabled: boolean
  }
  [AppEvents.android_mobile_services_checked]: {
    googleIsAvailable: boolean | undefined
    huaweiIsAvailable: boolean | undefined
  }
  [AppEvents.request_tracking_permission_started]: {
    currentPermission: PermissionStatus
  }
  [AppEvents.request_tracking_permission_declined]: {
    newPermission: PermissionStatus
  }
  [AppEvents.request_tracking_permission_accepted]: {
    newPermission: 'granted'
  }
  [AppEvents.account_funded]: undefined
  [AppEvents.account_liquidated]: undefined
  [AppEvents.in_app_review_impression]: undefined
  [AppEvents.in_app_review_error]: {
    error: string
  }
}

interface HomeEventsProperties {
  [HomeEvents.home_send]: undefined
  [HomeEvents.home_request]: undefined
  [HomeEvents.home_qr]: undefined
  [HomeEvents.hamburger_tapped]: undefined
  [HomeEvents.drawer_navigation]: {
    navigateTo: string
  }
  [HomeEvents.drawer_address_copy]: undefined

  [HomeEvents.notification_scroll]: {
    // TODO: Pass in notificationType and make param required
    notificationType?: NotificationBannerTypes
    direction: ScrollDirection
  }
  [HomeEvents.notification_select]: {
    notificationType: NotificationBannerTypes
    selectedAction: NotificationBannerCTATypes
    notificationId?: string
  }
  [HomeEvents.notification_impression]: {
    notificationId: string
  }
  [HomeEvents.transaction_feed_item_select]: undefined
  [HomeEvents.transaction_feed_address_copy]: undefined
  [HomeEvents.view_token_balances]: { totalBalance?: string }
  [HomeEvents.view_nft_home_assets]: undefined
  [HomeEvents.home_action_pressed]: { action: HomeActionName }
  [HomeEvents.notification_bell_pressed]: { hasNotifications: boolean }
}

interface SettingsEventsProperties {
  [SettingsEvents.settings_profile_edit]: undefined
  [SettingsEvents.profile_generate_name]: undefined
  [SettingsEvents.profile_save]: undefined
  [SettingsEvents.profile_cancel]: undefined
  [SettingsEvents.profile_photo_chosen]: undefined
  [SettingsEvents.profile_photo_removed]: undefined
  [SettingsEvents.language_select]: {
    language: string
  }
  [SettingsEvents.settings_verify_number]: undefined
  [SettingsEvents.pin_require_on_load]: {
    enabled: boolean
  }
  [SettingsEvents.licenses_view]: undefined
  [SettingsEvents.tos_view]: undefined
  [SettingsEvents.start_account_removal]: undefined
  [SettingsEvents.completed_account_removal]: undefined
  [SettingsEvents.change_pin_start]: undefined
  [SettingsEvents.change_pin_current_pin_entered]: undefined
  [SettingsEvents.change_pin_current_pin_error]: undefined
  [SettingsEvents.change_pin_new_pin_entered]: undefined
  [SettingsEvents.change_pin_new_pin_confirmed]: undefined
  [SettingsEvents.change_pin_new_pin_error]: undefined
  [SettingsEvents.settings_biometry_opt_in_enable]: undefined
  [SettingsEvents.settings_biometry_opt_in_complete]: undefined
  [SettingsEvents.settings_biometry_opt_in_error]: undefined
  [SettingsEvents.settings_biometry_opt_in_disable]: undefined
  [SettingsEvents.settings_recovery_phrase]: undefined
  [SettingsEvents.settings_haptic_feedback]: { enabled: boolean }
  [SettingsEvents.settings_analytics]: { enabled: boolean }
  [SettingsEvents.settings_revoke_phone_number]: undefined
  [SettingsEvents.settings_revoke_phone_number_confirm]: undefined
  [SettingsEvents.settings_set_up_keyless_backup]: undefined
  [SettingsEvents.settings_delete_keyless_backup]: undefined
}

interface CommonKeylessBackupProps {
  keylessBackupFlow: KeylessBackupFlow
}

interface KeylessBackupEventsProperties {
  [KeylessBackupEvents.wallet_security_primer_get_started]: undefined
  [KeylessBackupEvents.set_up_keyless_backup_screen_continue]: undefined
  [KeylessBackupEvents.cab_sign_in_with_google]: CommonKeylessBackupProps
  [KeylessBackupEvents.cab_sign_in_with_google_success]: CommonKeylessBackupProps
  [KeylessBackupEvents.cab_sign_in_with_email_screen_cancel]: CommonKeylessBackupProps
  [KeylessBackupEvents.enter_phone_number_continue]: CommonKeylessBackupProps
  [KeylessBackupEvents.cab_issue_sms_code_start]: CommonKeylessBackupProps
  [KeylessBackupEvents.cab_issue_sms_code_success]: CommonKeylessBackupProps
  [KeylessBackupEvents.cab_issue_sms_code_error]: CommonKeylessBackupProps
  [KeylessBackupEvents.cab_issue_valora_keyshare_start]: CommonKeylessBackupProps
  [KeylessBackupEvents.cab_issue_valora_keyshare_success]: CommonKeylessBackupProps
  [KeylessBackupEvents.cab_issue_valora_keyshare_error]: CommonKeylessBackupProps
  [KeylessBackupEvents.cab_progress_completed_continue]: undefined
  [KeylessBackupEvents.cab_progress_failed_later]: undefined
  [KeylessBackupEvents.cab_progress_failed_manual]: undefined
}

interface OnboardingEventsProperties {
  [OnboardingEvents.onboarding_education_start]: undefined
  [OnboardingEvents.onboarding_education_scroll]: {
    currentStep: number
    direction: ScrollDirection
  }
  [OnboardingEvents.onboarding_education_step_impression]: {
    step: number
  }
  [OnboardingEvents.onboarding_education_complete]: undefined
  [OnboardingEvents.onboarding_education_cancel]: undefined

  [OnboardingEvents.create_account_start]: undefined
  [OnboardingEvents.create_account_cancel]: undefined

  [OnboardingEvents.restore_account_start]: undefined
  [OnboardingEvents.restore_account_cancel]: undefined

  [OnboardingEvents.backup_education_start]: undefined
  [OnboardingEvents.backup_education_scroll]: {
    currentStep: number
    direction: ScrollDirection
  }
  [OnboardingEvents.backup_education_complete]: undefined
  [OnboardingEvents.backup_education_cancel]: undefined

  [OnboardingEvents.backup_start]: undefined
  [OnboardingEvents.backup_continue]: undefined
  [OnboardingEvents.backup_complete]: undefined
  [OnboardingEvents.backup_more_info]: undefined
  [OnboardingEvents.backup_delay_confirm]: undefined
  [OnboardingEvents.backup_delay_cancel]: undefined
  [OnboardingEvents.backup_cancel]: undefined
  [OnboardingEvents.backup_error]: {
    error: string
    context?: string
  }

  [OnboardingEvents.backup_quiz_start]: undefined
  [OnboardingEvents.backup_quiz_progress]: {
    action: BackQuizProgress
  }
  [OnboardingEvents.backup_quiz_complete]: undefined
  [OnboardingEvents.backup_quiz_incorrect]: undefined

  [OnboardingEvents.terms_and_conditions_accepted]: undefined

  [OnboardingEvents.celo_education_start]: undefined
  [OnboardingEvents.celo_education_scroll]: {
    currentStep: number
    direction: ScrollDirection
  }
  [OnboardingEvents.celo_education_complete]: undefined
  [OnboardingEvents.celo_education_cancel]: undefined

  [OnboardingEvents.name_and_picture_set]: {
    includesPhoto: boolean
    profilePictureSkipped: boolean
  }
  [OnboardingEvents.name_and_picture_skip]: undefined
  [OnboardingEvents.name_and_picture_generate_name]: undefined
  [OnboardingEvents.phone_number_set]: {
    countryCode: string
    country?: string
  }

  [OnboardingEvents.pin_set]: undefined
  [OnboardingEvents.pin_invalid]: {
    error: string
  }
  [OnboardingEvents.pin_failed_to_set]: {
    pincodeType: PincodeType
    error: string
  }
  [OnboardingEvents.pin_never_set]: undefined

  [OnboardingEvents.biometry_opt_in_start]: undefined
  [OnboardingEvents.biometry_opt_in_cancel]: undefined
  [OnboardingEvents.biometry_opt_in_approve]: undefined
  [OnboardingEvents.biometry_opt_in_complete]: undefined
  [OnboardingEvents.biometry_opt_in_error]: undefined

  [OnboardingEvents.wallet_import_start]: undefined
  [OnboardingEvents.wallet_import_phrase_updated]: {
    wordCount: number
    wordCountChange: number
  }
  [OnboardingEvents.wallet_import_submit]: {
    useEmptyWallet: boolean
    recoveryPhraseWordCount: number
  }
  [OnboardingEvents.wallet_import_cancel]: undefined
  [OnboardingEvents.wallet_import_zero_balance]: {
    account: string
  }
  [OnboardingEvents.wallet_import_phrase_invalid]: {
    wordCount: number
    invalidWordCount: number | undefined
  }
  [OnboardingEvents.wallet_import_phrase_correction_attempt]: undefined
  [OnboardingEvents.wallet_import_phrase_correction_success]: {
    attemptNumber: number
  }
  [OnboardingEvents.wallet_import_phrase_correction_failed]: {
    timeout: boolean
    error?: string
  }
  [OnboardingEvents.wallet_import_error]: {
    error: string
  }
  [OnboardingEvents.wallet_import_success]: undefined

  [OnboardingEvents.initialize_account_start]: undefined
  [OnboardingEvents.initialize_account_complete]: undefined
  [OnboardingEvents.initialize_account_error]: {
    error: string
  }

  [OnboardingEvents.account_dek_register_start]:
    | {
        feeless?: boolean
      }
    | undefined
  [OnboardingEvents.account_dek_register_account_unlocked]:
    | {
        feeless?: boolean
      }
    | undefined
  [OnboardingEvents.account_dek_register_account_checked]:
    | {
        feeless?: boolean
      }
    | undefined
  [OnboardingEvents.account_dek_register_complete]: {
    newRegistration: boolean
    feeless?: boolean
  }
  [OnboardingEvents.protect_wallet_use_recovery]:
    | {
        position?: number
      }
    | undefined
  [OnboardingEvents.protect_wallet_help]: undefined
  [OnboardingEvents.protect_wallet_help_dismiss]: undefined
  [OnboardingEvents.protect_wallet_copy_phrase]: undefined
  [OnboardingEvents.protect_wallet_complete]: undefined
  [OnboardingEvents.cya_button_press]: {
    name: string
    position: number
    cardOrder: AdventureCardName[]
  }
  [OnboardingEvents.cya_later]: {
    cardOrder: AdventureCardName[]
  }
}

interface VerificationEventsProperties {
  [VerificationEvents.verification_start]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_complete]:
    | {
        feeless?: boolean
        phoneNumberHash: string
      }
    | undefined
  [VerificationEvents.verification_error]: {
    error: string
    feeless?: true
  }
  [VerificationEvents.verification_cancel]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_timeout]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_revoke_start]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_revoke_finish]:
    | {
        feeless?: boolean
      }
    | undefined
  [VerificationEvents.verification_revoke_error]: {
    error: string
    feeless?: boolean
  }
  [VerificationEvents.verification_skip]: undefined
  [VerificationEvents.verification_skip_confirm]: undefined
}

interface PhoneVerificationEventsProperties {
  [PhoneVerificationEvents.phone_verification_skip]: undefined
  [PhoneVerificationEvents.phone_verification_skip_confirm]: undefined
  [PhoneVerificationEvents.phone_verification_learn_more]: undefined
  [PhoneVerificationEvents.phone_verification_start]: {
    country: string
    countryCallingCode: string
  }
  [PhoneVerificationEvents.phone_verification_code_request_success]: undefined
  [PhoneVerificationEvents.phone_verification_code_verify_start]: undefined
  [PhoneVerificationEvents.phone_verification_code_verify_success]: {
    phoneNumberHash: string
    inviterAddress: string | null
  }
  [PhoneVerificationEvents.phone_verification_restore_success]: undefined
  [PhoneVerificationEvents.phone_verification_code_verify_error]: undefined
  [PhoneVerificationEvents.phone_verification_input_help]: undefined
  [PhoneVerificationEvents.phone_verification_input_help_continue]: undefined
  [PhoneVerificationEvents.phone_verification_input_help_skip]: undefined
  [PhoneVerificationEvents.phone_verification_resend_message]: undefined
  [PhoneVerificationEvents.phone_verification_revoke_start]: undefined
  [PhoneVerificationEvents.phone_verification_revoke_success]: undefined
  [PhoneVerificationEvents.phone_verification_revoke_error]: undefined
}

interface IdentityEventsProperties {
  [IdentityEvents.contacts_connect]: {
    matchMakingEnabled: boolean
  }
  [IdentityEvents.contacts_import_permission_denied]: undefined
  [IdentityEvents.contacts_import_start]: undefined
  [IdentityEvents.contacts_import_complete]: {
    contactImportCount: number
  }
  [IdentityEvents.contacts_processing_complete]: undefined
  [IdentityEvents.contacts_import_error]: {
    error: string
  }

  [IdentityEvents.phone_number_lookup_start]: undefined
  [IdentityEvents.phone_number_lookup_complete]: undefined
  [IdentityEvents.phone_number_lookup_error]: {
    error: string
  }

  [IdentityEvents.phone_number_lookup_purchase_complete]: undefined
  [IdentityEvents.phone_number_lookup_purchase_error]: {
    error: string
  }
  [IdentityEvents.phone_number_lookup_purchase_skip]: undefined
}

interface AuthenticationEventsProperties {
  [AuthenticationEvents.get_pincode_start]: undefined
  [AuthenticationEvents.get_pincode_complete]: undefined
  [AuthenticationEvents.get_pincode_error]: undefined

  [AuthenticationEvents.get_pincode_with_biometry_start]: undefined
  [AuthenticationEvents.get_pincode_with_biometry_complete]: undefined
  [AuthenticationEvents.get_pincode_with_biometry_error]: undefined

  [AuthenticationEvents.get_pincode_with_input_start]: undefined
  [AuthenticationEvents.get_pincode_with_input_complete]: undefined
  [AuthenticationEvents.get_pincode_with_input_error]: undefined
}

interface InviteEventsProperties {
  [InviteEvents.invite_banner_impression]: undefined
  [InviteEvents.invite_with_share]: {
    phoneNumberHash: string | null
  }
  [InviteEvents.invite_with_share_dismiss]: undefined
  [InviteEvents.invite_with_referral_url]: {
    action: 'sharedAction' | 'dismissedAction'
    activityType?: string | undefined
  }
  [InviteEvents.opened_via_invite_url]: {
    inviterAddress: string
  }
  [InviteEvents.invite_help_link]: undefined
}

interface EscrowEventsProperties {
  [EscrowEvents.escrow_fetch_start]: undefined
  [EscrowEvents.escrow_fetch_complete]: undefined
  [EscrowEvents.escrow_fetch_error]: {
    error: string
  }

  [EscrowEvents.escrow_reclaim_confirm]: undefined
  [EscrowEvents.escrow_reclaim_cancel]: undefined
  [EscrowEvents.escrow_reclaim_start]: undefined
  [EscrowEvents.escrow_reclaim_complete]: undefined
  [EscrowEvents.escrow_reclaim_error]: {
    error: string
  }
}
interface SendEventsProperties {
  [SendEvents.send_scan]: undefined
  [SendEvents.send_select_recipient]: {
    usedSearchBar: boolean
    recipientType: RecipientType
  }
  [SendEvents.send_cancel]: undefined
  [SendEvents.send_amount_back]: undefined
  [SendEvents.send_amount_continue]:
    | {
        origin: SendOrigin
        isScan: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        localCurrencyAmount: string | null
        underlyingCurrency: Currency
        underlyingAmount: string | null
      }
    | {
        origin: SendOrigin
        recipientType: RecipientType
        isScan: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        localCurrencyAmount: string | null
        underlyingTokenAddress: string
        underlyingTokenSymbol: string
        underlyingAmount: string | null
        amountInUsd: string | null
      }
  [SendEvents.send_confirm_back]: undefined
  [SendEvents.send_confirm_send]:
    | {
        origin: SendOrigin
        isScan: boolean
        isRequest: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        dollarAmount: string | null
        localCurrencyAmount: string | null
        commentLength: number
      }
    | {
        origin: SendOrigin
        recipientType: RecipientType
        isScan: boolean
        localCurrency: LocalCurrencyCode
        usdAmount: string | null
        localCurrencyAmount: string | null
        tokenAmount: string
        tokenSymbol: string
        tokenAddress: string
        commentLength: number
      }

  [SendEvents.send_secure_start]: {
    confirmByScan: boolean
  }
  [SendEvents.send_secure_back]: undefined
  [SendEvents.send_secure_cancel]: undefined
  [SendEvents.send_secure_submit]: {
    partialAddressValidation: boolean
    address: string
  }
  [SendEvents.send_secure_complete]: {
    confirmByScan: boolean
    partialAddressValidation?: boolean
  }
  [SendEvents.send_secure_incorrect]: {
    confirmByScan: boolean
    partialAddressValidation?: boolean
    error: string
  }
  [SendEvents.send_secure_info]: {
    partialAddressValidation: boolean
  }
  [SendEvents.send_secure_info_dismissed]: {
    partialAddressValidation: boolean
  }
  [SendEvents.send_secure_edit]: undefined

  [SendEvents.send_tx_start]: undefined
  [SendEvents.send_tx_complete]: {
    txId: string
    recipientAddress: string
    amount: string
    usdAmount: string | undefined
    tokenAddress: string
  }
  [SendEvents.send_tx_error]: {
    error: string
  }
  [SendEvents.token_dropdown_opened]: {
    currentTokenAddress: string
  }
  [SendEvents.token_selected]: {
    origin: TokenPickerOrigin
    tokenAddress: string
  }
  [SendEvents.max_pressed]: {
    tokenAddress: string
  }
  [SendEvents.swap_input_pressed]: {
    tokenAddress: string
    swapToLocalAmount: boolean
  }
  [SendEvents.check_account_alert_shown]: undefined
  [SendEvents.check_account_do_not_ask_selected]: undefined
  [SendEvents.check_account_alert_back]: undefined
  [SendEvents.check_account_alerts_continue]: undefined
}

interface RequestEventsProperties {
  [RequestEvents.request_amount_back]: undefined
  [RequestEvents.request_cancel]: undefined
  [RequestEvents.request_scan]: undefined
  [RequestEvents.request_select_recipient]: {
    usedSearchBar: boolean
    recipientType: RecipientType
  }
  [RequestEvents.request_amount_continue]:
    | {
        origin: SendOrigin
        isScan: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        localCurrencyAmount: string | null
        underlyingCurrency: Currency
        underlyingAmount: string | null
      }
    | {
        origin: SendOrigin
        isScan: boolean
        localCurrencyExchangeRate?: string | null
        localCurrency: LocalCurrencyCode
        localCurrencyAmount: string | null
        underlyingTokenAddress: string
        underlyingTokenSymbol: string
        underlyingAmount: string | null
        amountInUsd: string | null
      }
  [RequestEvents.request_confirm_back]: undefined
  [RequestEvents.request_confirm_request]: {
    requesteeAddress: string
    recipientType: RecipientType
    isScan: boolean
  }
  [RequestEvents.request_error]: {
    error: string
  }
}

interface FeeEventsProperties {
  [FeeEvents.fee_rendered]: {
    feeType: string
    fee?: string
  }
  [FeeEvents.estimate_fee_failed]: {
    feeType: string
    tokenAddress: string
    error: string
  }
  [FeeEvents.estimate_fee_success]: {
    feeType: string
    tokenAddress: string
    usdFee: string
  }
  [FeeEvents.fetch_tobin_tax_failed]: {
    error: string
  }
}

interface TransactionEventsProperties {
  [TransactionEvents.transaction_start]: {
    txId: string
    description?: string
    fornoMode?: boolean
  }
  [TransactionEvents.transaction_gas_estimated]: {
    txId: string
    estimatedGas: number
    prefilled: boolean
    feeCurrencyAddress?: string
  }
  [TransactionEvents.transaction_hash_received]: {
    txId: string
    txHash: string
  }
  [TransactionEvents.transaction_confirmed]: {
    txId: string
  }
  [TransactionEvents.transaction_receipt_received]: {
    txId: string
  }
  [TransactionEvents.transaction_error]: {
    txId: string
    error: string
  }
  [TransactionEvents.transaction_exception]: {
    txId: string
    error: string
    feeCurrencyAddress?: string
  }
}

interface CeloExchangeEventsProperties {
  [CeloExchangeEvents.celo_home_info]: undefined
  [CeloExchangeEvents.celo_fetch_exchange_rate_start]: undefined
  [CeloExchangeEvents.celo_fetch_exchange_rate_complete]: {
    currency: StableCurrency
    makerAmount: number
    exchangeRate: number
  }
  [CeloExchangeEvents.celo_fetch_exchange_rate_error]: {
    error: string
  }

  [CeloExchangeEvents.celo_withdraw_review]: {
    amount: string
  }
  [CeloExchangeEvents.celo_withdraw_edit]: undefined
  [CeloExchangeEvents.celo_withdraw_cancel]: undefined
  [CeloExchangeEvents.celo_withdraw_confirm]: {
    amount: string
  }
  [CeloExchangeEvents.celo_withdraw_completed]: {
    amount: string
  }
  [CeloExchangeEvents.celo_withdraw_error]: {
    error: string
  }
  [CeloExchangeEvents.celo_chart_tapped]: undefined
}

interface FiatExchangeEventsProperties {
  [FiatExchangeEvents.cico_cash_out_info_support]: undefined
  [FiatExchangeEvents.external_exchange_link]: {
    name: string
    link: string
    isCashIn: boolean
  }
  [FiatExchangeEvents.spend_merchant_link]: {
    name: string
    link: string
  }
  [FiatExchangeEvents.cash_in_success]: {
    provider: string | undefined
  }
  [FiatExchangeEvents.cico_add_bottom_sheet_selected]: {
    rampAvailable: boolean
  }
  [FiatExchangeEvents.cico_add_bottom_sheet_impression]: undefined
  [FiatExchangeEvents.cico_add_bottom_sheet_ramp_selected]: undefined
  [FiatExchangeEvents.cico_add_bottom_sheet_ramp_available]: undefined
  [FiatExchangeEvents.cico_add_funds_info_support]: undefined
  [FiatExchangeEvents.cico_external_exchanges_back]: undefined
  [FiatExchangeEvents.cico_cash_out_copy_address]: undefined
  [FiatExchangeEvents.cico_spend_select_provider_back]: undefined
  [FiatExchangeEvents.cico_non_celo_exchange_send_bar_continue]: undefined
  [FiatExchangeEvents.cico_celo_exchange_send_bar_continue]: undefined
  [FiatExchangeEvents.cico_landing_token_balance]: { totalBalance?: string }
  [FiatExchangeEvents.cico_landing_select_flow]: { flow: FiatExchangeFlow }
  [FiatExchangeEvents.cico_landing_how_to_fund]: undefined
  [FiatExchangeEvents.cico_currency_chosen]: {
    flow: FiatExchangeFlow
    currency: CurrencyOrCREAL
  }
  [FiatExchangeEvents.cico_currency_back]: { flow: FiatExchangeFlow }
  [FiatExchangeEvents.cico_amount_chosen]: {
    amount: number
    currency: CurrencyOrCREAL
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_amount_chosen_invalid]: {
    amount: number
    currency: CurrencyOrCREAL
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_amount_back]: {
    currency: CurrencyOrCREAL
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_providers_section_impression]: {
    paymentMethod: PaymentMethod
    quoteCount: number
    flow: CICOFlow
    providers: string[]
  }
  [FiatExchangeEvents.cico_providers_section_expand]: {
    paymentMethod: PaymentMethod
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_providers_section_collapse]: {
    paymentMethod: PaymentMethod
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_providers_quote_selected]: {
    paymentMethod: PaymentMethod
    provider: string
    flow: CICOFlow
    feeCryptoAmount: number | undefined
    kycRequired: boolean
    isLowestFee: boolean | undefined
  } & ProviderSelectionAnalyticsData
  [FiatExchangeEvents.cico_providers_back]: { flow: CICOFlow }
  [FiatExchangeEvents.cico_providers_exchanges_selected]: {
    flow: CICOFlow
  } & ProviderSelectionAnalyticsData
  [FiatExchangeEvents.cico_providers_unavailable_impression]: { flow: CICOFlow }
  [FiatExchangeEvents.cico_providers_unavailable_selected]: { flow: CICOFlow }
  [FiatExchangeEvents.cico_providers_new_info_opened]: {
    flow: CICOFlow
    provider: string
    paymentMethod: PaymentMethod
  }
  [FiatExchangeEvents.cico_fc_review_submit]: { flow: CICOFlow; provider: string }
  [FiatExchangeEvents.cico_fc_review_cancel]: {
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_review_back]: {
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_review_error_retry]: {
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_review_error_contact_support]: {
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_link_account_continue]: {
    fiatAccountSchema: FiatAccountSchema
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_link_account_back]: {
    fiatAccountSchema: FiatAccountSchema
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_link_kyc_account_back]: {
    fiatAccountSchema: FiatAccountSchema
    provider: string
    flow: CICOFlow
    step: 'one' | 'two'
  }
  [FiatExchangeEvents.cico_fc_link_account_provider_website]: {
    fiatAccountSchema: FiatAccountSchema
    provider: string
    flow: CICOFlow
    page: 'home' | 'termsAndConditions' | 'privacyPolicy'
  }
  [FiatExchangeEvents.cico_fiat_details_success]: {
    fiatAccountSchema: FiatAccountSchema
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fiat_details_back]: {
    fiatAccountSchema: FiatAccountSchema
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fiat_details_cancel]: {
    fiatAccountSchema: FiatAccountSchema
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fiat_details_error]: {
    fiatConnectError?: FiatConnectError
    error?: string
    fiatAccountSchema: FiatAccountSchema
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_simplex_open_webview]: {
    amount: number
    cryptoCurrency: CiCoCurrency
    feeInFiat: number
    fiatCurrency: string
  }
  [FiatExchangeEvents.cico_fc_transfer_api_error]: {
    fiatConnectError?: FiatConnectError
    error?: string
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_transfer_tx_error]: {
    error: string
    transferAddress: string
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_transfer_error]: {
    error: string
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_transfer_success]: {
    txHash: string | null
    transferAddress?: string
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_transfer_error_retry]: {
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_transfer_error_cancel]: {
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_transfer_error_contact_support]: {
    provider: string
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_fc_transfer_success_complete]: {
    provider: string
    flow: CICOFlow
    txHash: string | null
  }
  [FiatExchangeEvents.cico_fc_transfer_success_view_tx]: {
    provider: string
    flow: CICOFlow
    txHash: string | null
  }
  [FiatExchangeEvents.cico_fc_transfer_processing_continue]: {
    provider: string
    flow: CICOFlow
    txHash: string | null
  }
  [FiatExchangeEvents.cico_fc_transfer_processing_view_tx]: {
    provider: string
    flow: CICOFlow
    txHash: string | null
  }
  [FiatExchangeEvents.cico_fc_kyc_status_contact_support]: FiatConnectKycProperties
  [FiatExchangeEvents.cico_fc_kyc_status_back]: FiatConnectKycProperties
  [FiatExchangeEvents.cico_fc_kyc_status_close]: FiatConnectKycProperties
  [FiatExchangeEvents.cico_fc_kyc_status_try_again]: FiatConnectKycProperties
  [FiatExchangeEvents.cico_fc_kyc_status_switch_method]: FiatConnectKycProperties
  [FiatExchangeEvents.cico_exchange_qr_bottom_sheet_open]: {
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_exchange_qr_bottom_sheet_close]: {
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_exchange_qr_bottom_sheet_link_press]: {
    flow: CICOFlow
    exchange: string
  }
  [FiatExchangeEvents.cico_exchange_qr_back]: {
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_exchange_qr_copy_address]: {
    flow: CICOFlow
  }
  [FiatExchangeEvents.cico_exchange_qr_share]: {
    flow: CICOFlow
  }
}

interface QrScreenProperties {
  [QrScreenEvents.qr_screen_copy_address]: undefined
  [QrScreenEvents.qr_screen_bottom_sheet_open]: undefined
  [QrScreenEvents.qr_screen_bottom_sheet_close]: undefined
  [QrScreenEvents.qr_screen_bottom_sheet_link_press]: {
    exchange: string
  }
  [QrScreenEvents.qr_scanner_open]: undefined
}
interface FiatConnectKycProperties {
  provider: string
  flow: CICOFlow
  fiatConnectKycStatus: FiatConnectKycStatus
}

interface ContractKitEventsProperties {
  [ContractKitEvents.init_contractkit_start]: undefined
  [ContractKitEvents.init_contractkit_get_wallet_start]: undefined
  [ContractKitEvents.init_contractkit_get_wallet_finish]: undefined
  [ContractKitEvents.init_contractkit_init_wallet_finish]: undefined
  [ContractKitEvents.init_contractkit_finish]: undefined
}

interface PerformanceProperties {
  [PerformanceEvents.redux_store_size]: {
    size: number
  }
}

interface NavigationProperties {
  [NavigationEvents.navigator_not_ready]: undefined
}

interface RewardsProperties {
  [RewardsEvents.rewards_screen_opened]: {
    origin: RewardsScreenOrigin
  }
  [RewardsEvents.rewards_screen_cta_pressed]: {
    buttonPressed: RewardsScreenCta
  }
  [RewardsEvents.learn_more_pressed]: undefined
  [RewardsEvents.claimed_reward]: {
    amount: string
    token: string
    version?: number
  }
}

export interface WalletConnect1Properties {
  version: 1
  dappRequestOrigin: DappRequestOrigin
  dappName: string
  dappUrl: string
  dappDescription: string
  dappIcon: string
  peerId: string
  chainId: string
}

export interface WalletConnect2Properties {
  version: 2
  dappRequestOrigin: DappRequestOrigin
  dappName: string
  dappUrl: string
  dappDescription: string
  dappIcon: string
  relayProtocol: string
  // eip155Events, eip155Chains, eip155Methods are added dynamically based on the requiredNamespaces property in the WalletConnect response
}

type WalletConnectDefaultProperties = WalletConnect1Properties | WalletConnect2Properties

type WalletConnectRequestDefaultProperties = WalletConnectDefaultProperties & {
  requestChainId: string | undefined
  requestId: number
  requestJsonrpc: string
  requestMethod: string
  // TODO: add back when we confirm there's no privacy issue with tracking this
  // requestParams: any
}

type WalletConnectRequestRejectSessionProperties = WalletConnectDefaultProperties & {
  rejectReason: string
}

type WalletConnectRequestDenyProperties = WalletConnectRequestDefaultProperties & {
  denyReason: string
}

interface WalletConnectProperties {
  [WalletConnectEvents.wc_pairing_start]: {
    dappRequestOrigin: DappRequestOrigin
    origin: WalletConnectPairingOrigin
  }
  [WalletConnectEvents.wc_pairing_success]: { dappRequestOrigin: DappRequestOrigin }
  [WalletConnectEvents.wc_pairing_error]: {
    dappRequestOrigin: DappRequestOrigin
    error: string
  }

  [WalletConnectEvents.wc_session_propose]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_approve_start]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_approve_success]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_approve_error]: WalletConnectDefaultProperties & {
    error: string
  }
  [WalletConnectEvents.wc_session_reject_start]: WalletConnectRequestRejectSessionProperties
  [WalletConnectEvents.wc_session_reject_success]: WalletConnectRequestRejectSessionProperties
  [WalletConnectEvents.wc_session_reject_error]: WalletConnectRequestRejectSessionProperties & {
    error: string
  }
  [WalletConnectEvents.wc_session_remove_start]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_remove_success]: WalletConnectDefaultProperties
  [WalletConnectEvents.wc_session_remove_error]: WalletConnectDefaultProperties & {
    error: string
  }

  [WalletConnectEvents.wc_request_propose]: WalletConnectRequestDefaultProperties
  [WalletConnectEvents.wc_request_details]: WalletConnectRequestDefaultProperties
  [WalletConnectEvents.wc_request_accept_start]: WalletConnectRequestDefaultProperties
  [WalletConnectEvents.wc_request_accept_success]: WalletConnectRequestDefaultProperties
  [WalletConnectEvents.wc_request_accept_error]: WalletConnectRequestDefaultProperties & {
    error: string
  }
  [WalletConnectEvents.wc_request_deny_start]: WalletConnectRequestDenyProperties
  [WalletConnectEvents.wc_request_deny_success]: WalletConnectRequestDenyProperties
  [WalletConnectEvents.wc_request_deny_error]: WalletConnectRequestDenyProperties & {
    error: string
  }

  [WalletConnectEvents.wc_copy_request_payload]: WalletConnectRequestDefaultProperties
}

interface DappKitRequestDefaultProperties {
  dappRequestOrigin: DappRequestOrigin
  dappName: string
  dappUrl: string
  requestType: DappKitRequestTypes
  requestCallback: string
  requestId: string
}

interface DappKitProperties {
  [DappKitEvents.dappkit_parse_deeplink_error]: {
    dappRequestOrigin: DappRequestOrigin
    deeplink: string
    error: string
  }
  [DappKitEvents.dappkit_request_propose]: DappKitRequestDefaultProperties
  [DappKitEvents.dappkit_request_cancel]: DappKitRequestDefaultProperties
  [DappKitEvents.dappkit_copy_request_details]: DappKitRequestDefaultProperties
  [DappKitEvents.dappkit_request_accept_start]: DappKitRequestDefaultProperties
  [DappKitEvents.dappkit_request_accept_success]: DappKitRequestDefaultProperties
  [DappKitEvents.dappkit_request_accept_error]: DappKitRequestDefaultProperties & {
    error: string
  }
}

interface CICOEventsProperties {
  [CICOEvents.persona_kyc_start]: undefined
  [CICOEvents.persona_kyc_success]: undefined
  [CICOEvents.persona_kyc_failed]: undefined
  [CICOEvents.persona_kyc_cancel]: undefined
  [CICOEvents.persona_kyc_error]: undefined
}

interface DappProperties {
  categories: string[]
  dappId: string
  dappName: string
}

interface DappEventProperties extends DappProperties {
  section: DappSection
  horizontalPosition?: number
}

interface DappExplorerEventsProperties {
  [DappExplorerEvents.dapp_impression]: DappEventProperties
  [DappExplorerEvents.dapp_open]: DappEventProperties
  [DappExplorerEvents.dapp_close]: DappEventProperties
  [DappExplorerEvents.dapp_screen_open]: undefined
  [DappExplorerEvents.dapp_view_all]: { section: DappSection }
  [DappExplorerEvents.dapp_select]: DappEventProperties
  [DappExplorerEvents.dapp_bottom_sheet_open]: DappEventProperties
  [DappExplorerEvents.dapp_bottom_sheet_dismiss]: DappEventProperties
  [DappExplorerEvents.dapp_favorite]: DappEventProperties
  [DappExplorerEvents.dapp_unfavorite]: DappEventProperties
  [DappExplorerEvents.dapp_open_info]: undefined
  [DappExplorerEvents.dapp_open_more_info]: undefined
  [DappExplorerEvents.dapp_filter]: {
    id: string
    remove: boolean
  }
  [DappExplorerEvents.dapp_search]: {
    searchTerm: string
  }
  [DappExplorerEvents.dapp_rankings_open]: undefined
  [DappExplorerEvents.dapp_rankings_impression]: undefined
}

interface WebViewEventsProperties {
  [WebViewEvents.webview_more_options]: {
    currentUrl: string
  }
  [WebViewEvents.webview_open_in_browser]: {
    currentUrl: string
  }
}

interface CoinbasePayEventsProperties {
  [CoinbasePayEvents.coinbase_pay_flow_start]: ProviderSelectionAnalyticsData
  [CoinbasePayEvents.coinbase_pay_flow_exit]: undefined
}

interface SwapEvent {
  toToken: string
  fromToken: string
  amount: string | null
  amountType: 'buyAmount' | 'sellAmount'
}

type SwapQuoteEvent = SwapEvent & {
  allowanceTarget: string
  estimatedPriceImpact?: string
  price: string
  provider: string
}

export interface SwapTimeMetrics {
  quoteToTransactionElapsedTimeInMs?: number // The elapsed time since the quote was received until the swap transaction is sent to the blockchain
  quoteToUserConfirmsSwapElapsedTimeInMs: number // The elapsed time since the quote was received until the user confirmed to execute the swap
}
interface SwapEventsProperties {
  [SwapEvents.swap_screen_open]: undefined
  [SwapEvents.swap_screen_select_token]: {
    fieldType: Field
  }
  [SwapEvents.swap_screen_confirm_token]: {
    fieldType: Field
    tokenSymbol: string
  }
  [SwapEvents.swap_screen_max_swap_amount]: {
    tokenSymbol?: string
  }
  [SwapEvents.swap_gas_fees_learn_more]: undefined
  [SwapEvents.swap_screen_review_swap]: undefined
  [SwapEvents.swap_feed_detail_view_tx]: undefined
  [SwapEvents.swap_review_screen_open]: SwapEvent
  [SwapEvents.swap_review_submit]: SwapQuoteEvent & {
    usdTotal: number
  }
  [SwapEvents.swap_execute_price_change]: {
    price: string
    guaranteedPrice: string
    toToken: string
    fromToken: string
  }
  [SwapEvents.swap_execute_success]: SwapQuoteEvent &
    SwapTimeMetrics & {
      fromTokenBalance: string
      swapExecuteTxId: string
      swapApproveTxId: string
    }
  [SwapEvents.swap_execute_error]: SwapQuoteEvent &
    SwapTimeMetrics & {
      error: string
      fromTokenBalance: string
      swapExecuteTxId: string
      swapApproveTxId: string
    }
  [SwapEvents.swap_learn_more]: undefined
  [SwapEvents.swap_price_impact_warning_displayed]: SwapEvent & {
    provider: string
    priceImpact: string
  }
}

interface CeloNewsEventsProperties {
  [CeloNewsEvents.celo_news_screen_open]: undefined
  [CeloNewsEvents.celo_news_article_tap]: {
    url: string
  }
  [CeloNewsEvents.celo_news_bottom_read_more_tap]: {
    url: string
  }
  [CeloNewsEvents.celo_news_retry_tap]: undefined
}
interface TokenBottomSheetEventsProperties {
  [TokenBottomSheetEvents.search_token]: {
    origin: TokenPickerOrigin
    searchInput: string
  }
}

interface AssetsEventsProperties {
  [AssetsEvents.show_asset_balance_info]: undefined
  [AssetsEvents.view_wallet_assets]: undefined
  [AssetsEvents.view_dapp_positions]: undefined
  [AssetsEvents.tap_asset]:
    | {
        assetType: 'token'
        address: string
        title: string // Example: 'cUSD'
        description: string
        balanceUsd: number
      }
    | {
        assetType: 'position'
        network: string // Example: 'celo'
        appId: string // Example: 'ubeswap'
        address: string
        title: string // Example: MOO / CELO
        description: string
        balanceUsd: number
      }
  [AssetsEvents.tap_claim_rewards]: undefined
}

interface NftsEventsProperties {
  [NftEvents.nft_error_screen_open]: undefined
  [NftEvents.nft_media_load]: {
    tokenId: string
    contractAddress: string
    url?: string
    origin: NftOrigin
    error?: string
    mediaType: 'image' | 'video'
  }
  [NftEvents.nft_gallery_screen_open]: {
    numNfts: number
  }
}

interface BuilderHooksProperties {
  [BuilderHooksEvents.hooks_enable_preview_propose]: {
    origin: HooksEnablePreviewOrigin
  }
  [BuilderHooksEvents.hooks_enable_preview_confirm]: undefined
  [BuilderHooksEvents.hooks_enable_preview_cancel]: undefined
  [BuilderHooksEvents.hooks_enable_preview_error]: {
    error: string
  }
  [BuilderHooksEvents.hooks_disable_preview]: undefined
}

interface DappShortcutClaimRewardEvent {
  rewardId: string
  appName: string
  appId: string
  network: string
  shortcutId: string
}
interface DappShortcutsProperties {
  [DappShortcutsEvents.dapp_shortcuts_rewards_screen_open]: {
    numRewards: number
  }
  [DappShortcutsEvents.dapp_shortcuts_reward_claim_start]: DappShortcutClaimRewardEvent & {
    rewardTokens: string // comma separated
    rewardAmounts: string // comma separated
    claimableValueUsd: string
  }
  [DappShortcutsEvents.dapp_shortcuts_reward_claim_success]: DappShortcutClaimRewardEvent
  [DappShortcutsEvents.dapp_shortcuts_reward_claim_error]: DappShortcutClaimRewardEvent
  [DappShortcutsEvents.dapp_shortcuts_reward_tx_propose]: DappShortcutClaimRewardEvent
  [DappShortcutsEvents.dapp_shortcuts_reward_tx_copy]: DappShortcutClaimRewardEvent
  [DappShortcutsEvents.dapp_shortcuts_reward_tx_accepted]: DappShortcutClaimRewardEvent
  [DappShortcutsEvents.dapp_shortcuts_reward_tx_rejected]: DappShortcutClaimRewardEvent
}

export type AnalyticsPropertiesList = AppEventsProperties &
  HomeEventsProperties &
  SettingsEventsProperties &
  KeylessBackupEventsProperties &
  OnboardingEventsProperties &
  VerificationEventsProperties &
  PhoneVerificationEventsProperties &
  IdentityEventsProperties &
  AuthenticationEventsProperties &
  InviteEventsProperties &
  SendEventsProperties &
  EscrowEventsProperties &
  RequestEventsProperties &
  FeeEventsProperties &
  TransactionEventsProperties &
  CeloExchangeEventsProperties &
  FiatExchangeEventsProperties &
  ContractKitEventsProperties &
  PerformanceProperties &
  NavigationProperties &
  RewardsProperties &
  WalletConnectProperties &
  DappKitProperties &
  CICOEventsProperties &
  DappExplorerEventsProperties &
  WebViewEventsProperties &
  CoinbasePayEventsProperties &
  SwapEventsProperties &
  CeloNewsEventsProperties &
  QrScreenProperties &
  TokenBottomSheetEventsProperties &
  AssetsEventsProperties &
  NftsEventsProperties &
  BuilderHooksProperties &
  DappShortcutsProperties
