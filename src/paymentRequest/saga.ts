import firebase from '@react-native-firebase/app'
import { FirebaseDatabaseTypes } from '@react-native-firebase/database'
import { eventChannel } from 'redux-saga'
import { showError } from 'src/alert/actions'
import { RequestEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { waitForFirebaseAuth } from 'src/firebase/saga'
import { navigateHome } from 'src/navigator/NavigationService'
import {
  Actions,
  CancelPaymentRequestAction,
  CompletePaymentRequestAction,
  DeclinePaymentRequestAction,
  UpdateIncomingPaymentRequestsAction,
  UpdateOutgoingPaymentRequestsAction,
  UpdatePaymentRequestNotifiedAction,
  WritePaymentRequestAction,
  updateIncomingPaymentRequests,
  updateOutgoingPaymentRequests,
} from 'src/paymentRequest/actions'
import { PaymentRequest, PaymentRequestStatus } from 'src/paymentRequest/types'
import { decryptPaymentRequest, encryptPaymentRequest } from 'src/paymentRequest/utils'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { safely } from 'src/utils/safely'
import { getAccount } from 'src/web3/saga'
import { currentAccountSelector, dataEncryptionKeySelector } from 'src/web3/selectors'
import {
  all,
  call,
  cancelled,
  put,
  select,
  spawn,
  take,
  takeEvery,
  takeLeading,
} from 'typed-redux-saga'

const TAG = 'paymentRequests/saga'
const VALUE_CHANGE_HOOK = 'value'
const REQUEST_DB = 'pendingRequests'

enum ADDRESS_KEY_FIELD {
  REQUESTEE_ADDRESS = 'requesteeAddress',
  REQUESTER_ADDRESS = 'requesterAddress',
}

function createPaymentRequestChannel(address: string, addressKeyField: ADDRESS_KEY_FIELD) {
  const errorCallback = (error: Error) => {
    Logger.error(TAG, 'Error getting payment requests from firebase', error)
  }

  return eventChannel((emit: any) => {
    const emitter = (data: FirebaseDatabaseTypes.DataSnapshot) => {
      if (data.toJSON()) {
        emit(data.toJSON())
      }
    }

    const onValueChange = firebase
      .database()
      .ref(REQUEST_DB)
      .orderByChild(addressKeyField)
      .equalTo(address)
      .on(VALUE_CHANGE_HOOK, emitter, errorCallback)

    const cancel = () => {
      firebase
        .database()
        .ref(REQUEST_DB)
        .orderByChild(addressKeyField)
        .equalTo(address)
        .off(VALUE_CHANGE_HOOK, onValueChange)
    }

    return cancel
  })
}

const compareTimestamps = (a: PaymentRequest, b: PaymentRequest) => {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
}

const onlyRequested = (pr: PaymentRequest) => pr.status === PaymentRequestStatus.REQUESTED

function* subscribeToPaymentRequests(
  addressKeyField: ADDRESS_KEY_FIELD,
  updatePaymentRequestsActionCreator: (
    paymentRequests: PaymentRequest[]
  ) => UpdateIncomingPaymentRequestsAction | UpdateOutgoingPaymentRequestsAction,
  isOutgoingRequest: boolean
) {
  yield* all([call(waitForFirebaseAuth), call(getAccount)])
  const address = yield* select(currentAccountSelector)
  if (!address) {
    // This should never happen
    throw Error(`Currentaccount not set set`)
  }
  const dataEncryptionKey: string | null = yield* select(dataEncryptionKeySelector)
  const paymentRequestChannel = yield* call(createPaymentRequestChannel, address, addressKeyField)
  while (true) {
    try {
      const paymentRequestsObject = (yield* take(paymentRequestChannel)) as {
        [key: string]: PaymentRequest
      }
      Logger.debug(`${TAG}@subscribeToPaymentRequests`, 'New payment request object from channel')
      const paymentRequests: PaymentRequest[] = Object.keys(paymentRequestsObject)
        .map((key) => ({
          uid: key,
          ...paymentRequestsObject[key],
        }))
        .sort(compareTimestamps)
        .filter(onlyRequested)
        .map((pr) => decryptPaymentRequest(pr, dataEncryptionKey, isOutgoingRequest))

      yield* put(updatePaymentRequestsActionCreator(paymentRequests))
    } catch (error) {
      Logger.error(
        `${TAG}@subscribeToPaymentRequests`,
        'Failed to subscribe to payment requests',
        error
      )
    } finally {
      if (yield* cancelled()) {
        paymentRequestChannel.close()
      }
    }
  }
}

function* paymentRequestWriter({ paymentRequest }: WritePaymentRequestAction) {
  try {
    Logger.info(TAG, `Writing pending request to database`)

    const encryptedPaymentRequest = yield* call(encryptPaymentRequest, paymentRequest)

    const pendingRequestRef = firebase.database().ref(`pendingRequests`)
    yield* call(() => pendingRequestRef.push(encryptedPaymentRequest))

    navigateHome()
  } catch (err) {
    const error = ensureError(err)
    Logger.error(TAG, 'Failed to write payment request to Firebase DB', error)
    ValoraAnalytics.track(RequestEvents.request_error, { error: error.message })
    yield* put(showError(ErrorMessages.PAYMENT_REQUEST_FAILED))
  }
}

function* updatePaymentRequestNotified({ id, notified }: UpdatePaymentRequestNotifiedAction) {
  try {
    Logger.debug(TAG, 'Updating payment request', id, `notified: ${notified}`)
    yield* call(() => firebase.database().ref(`${REQUEST_DB}/${id}`).update({ notified }))
    Logger.debug(TAG, 'Payment request notified updated', id)
  } catch (error) {
    yield* put(showError(ErrorMessages.PAYMENT_REQUEST_UPDATE_FAILED))
    Logger.error(TAG, `Error while updating payment request ${id} status`, error)
  }
}

function* updatePaymentRequestStatus({
  id,
  status,
}: (DeclinePaymentRequestAction | CompletePaymentRequestAction) | CancelPaymentRequestAction) {
  try {
    Logger.debug(TAG, 'Updating payment request', id, `status: ${status}`)
    yield* call(() => firebase.database().ref(`${REQUEST_DB}/${id}`).update({ status }))
    Logger.debug(TAG, 'Payment request status updated', id)
  } catch (error) {
    yield* put(showError(ErrorMessages.PAYMENT_REQUEST_UPDATE_FAILED))
    Logger.error(TAG, `Error while updating payment request ${id} status`, error)
  }
}

function* subscribeToIncomingPaymentRequests() {
  yield* call(
    subscribeToPaymentRequests,
    ADDRESS_KEY_FIELD.REQUESTEE_ADDRESS,
    updateIncomingPaymentRequests,
    false
  )
}

function* subscribeToOutgoingPaymentRequests() {
  yield* call(
    subscribeToPaymentRequests,
    ADDRESS_KEY_FIELD.REQUESTER_ADDRESS,
    updateOutgoingPaymentRequests,
    true
  )
}

function* watchPaymentRequestStatusUpdates() {
  yield* takeLeading(Actions.UPDATE_REQUEST_STATUS, safely(updatePaymentRequestStatus))
}

function* watchPaymentRequestNotifiedUpdates() {
  yield* takeLeading(Actions.UPDATE_REQUEST_NOTIFIED, safely(updatePaymentRequestNotified))
}

function* watchWritePaymentRequest() {
  yield* takeEvery(Actions.WRITE_PAYMENT_REQUEST, safely(paymentRequestWriter))
}

export function* paymentRequestSaga() {
  yield* spawn(subscribeToIncomingPaymentRequests)
  yield* spawn(subscribeToOutgoingPaymentRequests)
  yield* spawn(watchPaymentRequestStatusUpdates)
  yield* spawn(watchPaymentRequestNotifiedUpdates)
  yield* spawn(watchWritePaymentRequest)
}
