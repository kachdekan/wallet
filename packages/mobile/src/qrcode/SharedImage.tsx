import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { shallowEqual, useSelector } from 'react-redux'
import { AvatarSelf } from 'src/components/AvatarSelf'
import QRCode from 'src/qrcode/QRGen'
import { UriData, urlFromUriData } from 'src/qrcode/schema'
import { RootState } from 'src/redux/reducers'
import { SVG } from 'src/send/actions'
import { currentAccountSelector } from 'src/web3/selectors'

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
}

const mapStateToProps = (state: RootState): Partial<UriData> => ({
  address: currentAccountSelector(state)!,
  displayName: state.account.name || undefined,
  e164PhoneNumber: state.account.e164PhoneNumber || undefined,
})

// TODO: mutate the qrSvgRef to the new svg when user presses 'share' on QRTabBar
export default function SharedQRImage({ qrSvgRef }: Props) {
  const data = useSelector(mapStateToProps, shallowEqual)
  const qrContent = useMemo(() => urlFromUriData(data), [
    data.address,
    data.displayName,
    data.e164PhoneNumber,
  ])
  return (
    <SafeAreaView style={styles.container}>
      <AvatarSelf iconSize={64} displayNameStyle={fontStyles.h2} />
      <View style={styles.qrContainer}>
        <QRCode value={qrContent} size={240} svgRef={qrSvgRef} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light,
    width: 320,
  },
  qrContainer: {},
})
