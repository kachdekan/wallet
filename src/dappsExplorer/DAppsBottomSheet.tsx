import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import BottomSheetLegacy from 'src/components/BottomSheetLegacy'
import Button from 'src/components/Button'
import { Dapp } from 'src/dapps/types'
import QuitIcon from 'src/icons/QuitIcon'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  selectedDapp: Dapp | null
  isVisible: boolean
  onClose(): void
  onConfirmOpenDapp(): void
}

export function DAppsBottomSheet({ selectedDapp, isVisible, onClose, onConfirmOpenDapp }: Props) {
  const { t } = useTranslation()

  return (
    <BottomSheetLegacy isVisible={isVisible} onBackgroundPress={onClose}>
      <View>
        <TopBarIconButton
          icon={<QuitIcon />}
          style={styles.bottomSheetCloseButton}
          onPress={onClose}
        />
        <View style={styles.centerContainer}>
          <Text testID="ConfirmDappTitle" style={styles.bottomSheetTitleText}>
            {t('dappsScreenBottomSheet.title', { dappName: selectedDapp?.name })}
          </Text>
          <Text style={styles.bottomSheetMessageText}>{t('dappsScreenBottomSheet.message')}</Text>
          <Button
            style={styles.bottomSheetButton}
            onPress={onConfirmOpenDapp}
            text={t('dappsScreenBottomSheet.button', { dappName: selectedDapp?.name })}
            testID="ConfirmDappButton"
          />
        </View>
      </View>
    </BottomSheetLegacy>
  )
}

const styles = StyleSheet.create({
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  bottomSheetTitleText: {
    ...fontStyles.h2,
    textAlign: 'center',
    paddingVertical: Spacing.Regular16,
  },
  bottomSheetMessageText: {
    ...fontStyles.regular,
    textAlign: 'center',
    flex: 1,
  },
  bottomSheetCloseButton: {
    alignSelf: 'flex-end',
  },
  bottomSheetButton: {
    marginVertical: Spacing.Regular16,
  },
})

export default DAppsBottomSheet
