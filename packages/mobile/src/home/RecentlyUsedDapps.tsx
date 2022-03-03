import Touchable from '@celo/react-components/components/Touchable'
import { Colors } from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import { range } from 'lodash'
import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dimensions,
  Image,
  NativeScrollEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { RecentlyUsedDappEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { recentDappsSelector } from 'src/app/selectors'
import { Dapp } from 'src/app/types'
import ProgressArrow from 'src/icons/ProgressArrow'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'

interface Props {
  onSelectDapp(dapp: Dapp): void
}

const DAPP_ICON_SIZE = 68
const DAPP_WIDTH = 100
const windowWidth = Dimensions.get('window').width

function RecentlyUsedDapps({ onSelectDapp }: Props) {
  const recentlyUsedDapps = useSelector(recentDappsSelector)
  const { t } = useTranslation()

  // keep track of the viewed dapps to ensure single analytics event for each
  // dapp impression, zero index
  const lastViewedDapp = useRef(-1)

  const trackDappImpression = (numDappsVisible: number) => {
    range(lastViewedDapp.current + 1, numDappsVisible).forEach((dappIndex) => {
      const dapp = recentlyUsedDapps[dappIndex]
      ValoraAnalytics.track(RecentlyUsedDappEvents.dapp_recently_used_impression, {
        categoryId: dapp.categoryId,
        dappId: dapp.id,
        dappName: dapp.name,
        section: dapp.isFeatured ? 'featured' : 'all',
        horizontalPosition: dappIndex,
      })
    })

    lastViewedDapp.current = numDappsVisible - 1
  }

  useEffect(() => {
    const numDappsVisible = Math.floor(windowWidth / DAPP_WIDTH)
    trackDappImpression(numDappsVisible)
  }, [])

  const onPressAllDapps = () => {
    ValoraAnalytics.track(RecentlyUsedDappEvents.dapp_view_all)
    navigate(Screens.DAppsExplorerScreen)
  }

  const handleScroll = (event: { nativeEvent: NativeScrollEvent }) => {
    const numDappsVisible = Math.floor(
      (windowWidth + event.nativeEvent.contentOffset.x) / DAPP_WIDTH
    )
    if (numDappsVisible > lastViewedDapp.current + 1) {
      trackDappImpression(numDappsVisible)
    }
  }

  if (!recentlyUsedDapps.length) {
    return null
  }

  return (
    <View style={styles.body} testID="RecentlyUsedDappsContainer">
      <View style={[styles.titleContainer, styles.row]}>
        <Text style={styles.title}>{t('recentlyUsedDapps')}</Text>
        <Touchable style={styles.row} onPress={onPressAllDapps} testID="AllDapps">
          <>
            <Text style={styles.allDapps}>{t('allDapps')}</Text>
            <ProgressArrow color={Colors.greenUI} />
          </>
        </Touchable>
      </View>

      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        testID="RecentlyUsedDapps/ScrollContainer"
        onScroll={handleScroll}
        scrollEventThrottle={50}
      >
        {recentlyUsedDapps.map((recentlyUsedDapp) => (
          <Touchable
            key={recentlyUsedDapp.id}
            onPress={() => onSelectDapp(recentlyUsedDapp)}
            style={styles.dappContainer}
            testID="RecentDapp"
          >
            <>
              <Image
                source={{ uri: recentlyUsedDapp.iconUrl }}
                style={styles.icon}
                resizeMode="cover"
                testID="RecentDapp-icon"
              />
              <Text style={styles.dappName} numberOfLines={1} ellipsizeMode="tail">
                {recentlyUsedDapp.name}
              </Text>
            </>
          </Touchable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    maxWidth: variables.width,
    width: variables.width,
    paddingTop: Spacing.Regular16,
    paddingBottom: Spacing.Thick24,
  },
  titleContainer: {
    paddingHorizontal: Spacing.Regular16,
    paddingBottom: Spacing.Regular16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.sectionHeader,
    color: Colors.gray4,
  },
  allDapps: {
    ...fontStyles.label,
    color: Colors.greenUI,
    marginRight: Spacing.Smallest8,
  },
  dappContainer: {
    alignItems: 'center',
    width: DAPP_WIDTH,
  },
  dappName: {
    ...fontStyles.small,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    maxWidth: DAPP_ICON_SIZE,
  },
  icon: {
    height: DAPP_ICON_SIZE,
    width: DAPP_ICON_SIZE,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.gray2,
    marginBottom: Spacing.Small12,
  },
})

export default RecentlyUsedDapps
