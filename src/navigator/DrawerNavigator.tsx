import {
  createDrawerNavigator,
  DrawerContentComponentProps,
  DrawerContentOptions,
  DrawerContentScrollView,
} from '@react-navigation/drawer'
import {
  DrawerDescriptorMap,
  DrawerNavigationHelpers,
} from '@react-navigation/drawer/lib/typescript/src/types'
import {
  CommonActions,
  DrawerActions,
  DrawerNavigationState,
  ParamListBase,
  useLinkBuilder,
} from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import { useDispatch } from 'react-redux'
import FiatExchange from 'src/account/FiatExchange'
import {
  backupCompletedSelector,
  defaultCountryCodeSelector,
  e164NumberSelector,
  nameSelector,
  shouldShowRecoveryPhraseInSettingsSelector,
} from 'src/account/selectors'
import SettingsScreen from 'src/account/Settings'
import Support from 'src/account/Support'
import { HomeEvents, RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import AccountNumber from 'src/components/AccountNumber'
import ContactCircleSelf from 'src/components/ContactCircleSelf'
import PhoneNumberWithFlag from 'src/components/PhoneNumberWithFlag'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import { dappsListApiUrlSelector } from 'src/dapps/selectors'
import DAppsExplorerScreenSearchFilter from 'src/dappsExplorer/DAppsExplorerScreenSearchFilter'
import { fetchExchangeRate } from 'src/exchange/actions'
import ExchangeHomeScreen from 'src/exchange/ExchangeHomeScreen'
import WalletHome from 'src/home/WalletHome'
import ExclamationCircleIcon from 'src/icons/ExclamationCircleIcon'
import { Home } from 'src/icons/Home'
import { AccountKey } from 'src/icons/navigator/AccountKey'
import { AddWithdraw } from 'src/icons/navigator/AddWithdraw'
import { DappsExplorer } from 'src/icons/navigator/DappsExplorer'
import { Gold } from 'src/icons/navigator/Gold'
import { Help } from 'src/icons/navigator/Help'
import { Invite as InviteIcon } from 'src/icons/navigator/Invite'
import { NFT } from 'src/icons/navigator/NFT'
import { Settings } from 'src/icons/navigator/Settings'
import { Swap } from 'src/icons/navigator/Swap'
import Invite from 'src/invite/Invite'
import WalletSecurityPrimer from 'src/keylessBackup/WalletSecurityPrimer'
import DrawerItem from 'src/navigator/DrawerItem'
import { ensurePincode } from 'src/navigator/NavigationService'
import { getActiveRouteName } from 'src/navigator/NavigatorWrapper'
import RewardsPill from 'src/navigator/RewardsPill'
import { Screens } from 'src/navigator/Screens'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { StackParamList } from 'src/navigator/types'
import NftGallery from 'src/nfts/NftGallery'
import { default as useSelector } from 'src/redux/useSelector'
import { getExperimentParams, getFeatureGate } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments, StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import SwapScreen from 'src/swap/SwapScreen'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'NavigationService'

const Drawer = createDrawerNavigator()

type CustomDrawerItemListProps = Omit<DrawerContentOptions, 'contentContainerStyle' | 'style'> & {
  state: DrawerNavigationState<ParamListBase>
  navigation: DrawerNavigationHelpers
  descriptors: DrawerDescriptorMap
  protectedRoutes: string[]
}

interface DrawerItemParams {
  onPress?: () => void
}

// This component has been taken from here:
// https://github.com/react-navigation/react-navigation/blob/1aadc79fb89177a2fff2dcd791d67a3c880009d0/packages/drawer/src/views/DrawerItemList.tsx
function CustomDrawerItemList({
  state,
  navigation,
  descriptors,
  itemStyle,
  protectedRoutes,
  ...passThroughProps
}: CustomDrawerItemListProps) {
  const buildLink = useLinkBuilder()

  return state.routes.map((route, i) => {
    const focused = i === state.index
    const { title, drawerLabel, drawerIcon } = descriptors[route.key].options
    const navigateToItem = () => {
      if (route.name === Screens.ConsumerIncentivesHomeScreen) {
        ValoraAnalytics.track(RewardsEvents.rewards_screen_opened, {
          origin: RewardsScreenOrigin.SideMenu,
        })
      }
      ValoraAnalytics.track(HomeEvents.drawer_navigation, {
        navigateTo: route.name,
      })
      navigation.dispatch({
        ...(focused ? DrawerActions.closeDrawer() : CommonActions.navigate(route.name)),
        target: state.key,
      })
    }
    const onPress = () => {
      const activeRouteName = getActiveRouteName(navigation.getState())
      if (protectedRoutes.includes(route.name) && activeRouteName !== route.name) {
        // Route should be protected by PIN code
        ensurePincode()
          .then((pinIsCorrect) => {
            if (pinIsCorrect) {
              navigateToItem()
            }
          })
          .catch((error) => {
            Logger.error(`${TAG}@onPress`, 'PIN ensure error', error)
          })
      } else if (route.params && (route.params as DrawerItemParams).onPress) {
        const drawerParams = route.params as DrawerItemParams
        drawerParams.onPress?.()
      } else {
        navigateToItem()
      }
    }

    return (
      <DrawerItem
        {...passThroughProps}
        testID={`DrawerItem/${title}`}
        key={route.key}
        label={drawerLabel !== undefined ? drawerLabel : title !== undefined ? title : route.name}
        icon={drawerIcon}
        focused={focused}
        style={itemStyle}
        to={buildLink(route.name, route.params)}
        onPress={onPress}
      />
    )
  }) as React.ReactNode as React.ReactElement
}

function CustomDrawerContent(props: DrawerContentComponentProps<DrawerContentOptions>) {
  const { t } = useTranslation()
  const displayName = useSelector(nameSelector)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const defaultCountryCode = useSelector(defaultCountryCodeSelector)
  const account = useSelector(currentAccountSelector)
  const appVersion = deviceInfoModule.getVersion()
  const phoneNumberVerified = useSelector(phoneNumberVerifiedSelector)

  const dispatch = useDispatch()
  useEffect(() => {
    // Needed for the local CELO balance display
    dispatch(fetchExchangeRate())
  }, [])

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerTop}>
        <View style={styles.drawerHeader} testID="Drawer/Header">
          <ContactCircleSelf size={64} />
          <RewardsPill />
        </View>
        {!!displayName && (
          <Text style={styles.nameLabel} testID="Drawer/Username">
            {displayName}
          </Text>
        )}
        {phoneNumberVerified && e164PhoneNumber && (
          <PhoneNumberWithFlag
            e164PhoneNumber={e164PhoneNumber}
            defaultCountryCode={defaultCountryCode ? defaultCountryCode : undefined}
          />
        )}
        <View style={styles.border} />
      </View>
      <CustomDrawerItemList {...props} protectedRoutes={[Screens.BackupIntroduction]} />
      <View style={styles.drawerBottom}>
        <Text style={fontStyles.label}>{t('address')}</Text>
        <AccountNumber address={account || ''} location={Screens.DrawerNavigator} />
        <Text style={styles.smallLabel}>{t('version', { appVersion })}</Text>
      </View>
    </DrawerContentScrollView>
  )
}

type Props = NativeStackScreenProps<StackParamList, Screens.DrawerNavigator>

// TODO(ACT-771): get from Statsig
function showKeylessBackup() {
  return false
}

export default function DrawerNavigator({ route }: Props) {
  const { t } = useTranslation()
  const initialScreen = route.params?.initialScreen ?? Screens.WalletHome
  const dappsListUrl = useSelector(dappsListApiUrlSelector)

  const shouldShowRecoveryPhraseInSettings = useSelector(shouldShowRecoveryPhraseInSettingsSelector)
  const backupCompleted = useSelector(backupCompletedSelector)
  const { showAddWithdrawOnMenu, showSwapOnMenu } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.HOME_SCREEN_ACTIONS]
  )
  const { discoverCopyEnabled } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.DAPP_MENU_ITEM_COPY]
  )

  const drawerContent = (props: DrawerContentComponentProps<DrawerContentOptions>) => (
    <CustomDrawerContent {...props} />
  )

  const shouldShowSwapMenuInDrawerMenu = useSelector(isAppSwapsEnabledSelector) && showSwapOnMenu

  const shouldShowNftGallery = getFeatureGate(StatsigFeatureGates.SHOW_IN_APP_NFT_GALLERY)

  // ExchangeHomeScreen
  const celoMenuItem = (
    <Drawer.Screen
      name={Screens.ExchangeHomeScreen}
      component={ExchangeHomeScreen}
      options={{ title: t('celoGold') ?? undefined, drawerIcon: Gold }}
    />
  )

  return (
    <Drawer.Navigator
      initialRouteName={initialScreen}
      drawerContent={drawerContent}
      backBehavior={'initialRoute'}
      drawerContentOptions={{
        labelStyle: [fontStyles.regular, { marginLeft: -20, fontWeight: 'normal' }],
        activeBackgroundColor: colors.gray2,
      }}
      // Reloads the screen when the user comes back to it - resetting navigation state
      screenOptions={{
        unmountOnBlur: true,
      }}
      // Whether inactive screens should be detached from the view hierarchy to save memory.
      // Defaults to true, but also explicitly set here.
      detachInactiveScreens={true}
    >
      <Drawer.Screen
        name={Screens.WalletHome}
        component={WalletHome}
        options={{ title: t('home') ?? undefined, drawerIcon: Home, unmountOnBlur: false }}
      />
      {shouldShowNftGallery && (
        <Drawer.Screen
          name={Screens.NftGallery}
          component={NftGallery}
          options={{ title: t('nftGallery.title') ?? undefined, drawerIcon: NFT }}
        />
      )}
      {shouldShowSwapMenuInDrawerMenu ? (
        <Drawer.Screen
          name={Screens.SwapScreen}
          component={SwapScreen}
          options={{ title: t('swapScreen.title') ?? undefined, drawerIcon: Swap }}
        />
      ) : (
        celoMenuItem
      )}

      {!!dappsListUrl && (
        <Drawer.Screen
          name={Screens.DAppsExplorerScreen}
          component={DAppsExplorerScreenSearchFilter}
          options={{
            title:
              (discoverCopyEnabled ? t('dappsScreen.titleDiscover') : t('dappsScreen.title')) ??
              undefined,
            drawerIcon: DappsExplorer,
            // Special case for the Dapps explorer,
            // so it reloads the list when the user comes back to it
            // Note: we generally want to avoid this as it resets the scroll position (and all other component state)
            // but here it's the right expectation
            unmountOnBlur: true,
          }}
        />
      )}

      {(!backupCompleted || !shouldShowRecoveryPhraseInSettings) &&
        (showKeylessBackup() ? (
          <Drawer.Screen
            // NOTE: this needs to be a different screen name from the screen
            // accessed from the settings which shows the back button instead of
            // the drawer. Otherwise the settings item will navigate to the
            // screen with the drawer. This wasn't needed for the
            // BackupIntroduction screen because it navigates to the pin screen
            // first.
            name={Screens.WalletSecurityPrimerDrawer}
            // @ts-expect-error component type in native-stack v6
            component={WalletSecurityPrimer}
            options={{
              drawerLabel: !backupCompleted
                ? () => (
                    <View style={styles.itemStyle}>
                      <Text style={styles.itemTitle}>{t('walletSecurity')}</Text>
                      <View style={styles.drawerItemIcon}>
                        <ExclamationCircleIcon />
                      </View>
                    </View>
                  )
                : t('walletSecurity') ?? undefined,
              title: t('walletSecurity') ?? undefined,
              drawerIcon: AccountKey,
            }}
            initialParams={{ showDrawerTopBar: true }}
          />
        ) : (
          <Drawer.Screen
            name={Screens.BackupIntroduction}
            // @ts-expect-error component type in native-stack v6
            component={BackupIntroduction}
            options={{
              drawerLabel: !backupCompleted
                ? () => (
                    <View style={styles.itemStyle}>
                      <Text style={styles.itemTitle}>{t('accountKey')}</Text>
                      <View style={styles.drawerItemIcon}>
                        <ExclamationCircleIcon />
                      </View>
                    </View>
                  )
                : t('accountKey') ?? undefined,
              title: t('accountKey') ?? undefined,
              drawerIcon: AccountKey,
            }}
            initialParams={{ showDrawerTopBar: true }}
          />
        ))}
      {showAddWithdrawOnMenu && (
        <Drawer.Screen
          name={Screens.FiatExchange}
          component={FiatExchange}
          options={{ title: t('addAndWithdraw') ?? undefined, drawerIcon: AddWithdraw }}
        />
      )}
      <Drawer.Screen
        name={Screens.Invite}
        component={Invite}
        options={{ title: t('invite') ?? undefined, drawerIcon: InviteIcon }}
      />

      {
        // When swap is enabled, the celo menu item is here
        shouldShowSwapMenuInDrawerMenu && celoMenuItem
      }

      <Drawer.Screen
        name={Screens.Settings}
        component={SettingsScreen}
        options={{ title: t('settings') ?? undefined, drawerIcon: Settings }}
      />
      <Drawer.Screen
        name={Screens.Support}
        component={Support}
        options={{ title: t('help') ?? undefined, drawerIcon: Help }}
      />
    </Drawer.Navigator>
  )
}

const styles = StyleSheet.create({
  drawerTop: {
    marginLeft: 16,
    marginTop: 16,
    alignItems: 'flex-start',
    marginRight: 16,
  },
  drawerHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.Smallest8,
  },
  nameLabel: {
    ...fontStyles.displayName,
    marginBottom: Spacing.Smallest8,
  },
  border: {
    marginTop: 20,
    marginBottom: 12,
    height: 1,
    backgroundColor: colors.gray2,
    alignSelf: 'stretch',
  },
  drawerBottom: {
    marginVertical: 32,
    marginHorizontal: 16,
  },
  smallLabel: {
    ...fontStyles.small,
    color: colors.gray4,
    marginTop: 32,
  },
  itemStyle: {
    marginLeft: -20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerItemIcon: {
    paddingLeft: 10,
  },
  itemTitle: {
    ...fontStyles.regular,
  },
})
