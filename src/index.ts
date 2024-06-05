import {
  NativeModules,
  Platform,
  DeviceEventEmitter,
  EmitterSubscription,
} from 'react-native';

// Define types for the events data if they are known
interface EventData {
  message: string; // Example type, adjust according to actual data
}

// Mapping of event names to their expected data types
type EventMap = {
  verificationSuccess: EventData;
  verificationFailed: EventData;
  verificationInitiated: EventData;
  verificationNotInitialized: EventData;
  verificationEvent: EventData; // Example, adjust as needed
};

// Define the types for VerificationMethodType
type VerificationMethodType = 'FLASHCALL' | 'SMS'; // Add other method types as needed

interface SinchFlashCallInterface {
  requestPermissions: () => Promise<boolean>;
  initVerification: (
    phoneNumber: string,
    appKey: string,
    appSecret?: string
  ) => Promise<string>;
  getLastCallNumberFromCallLog: () => Promise<string | null>;
  verifyCode: (
    code: string,
    methodType: VerificationMethodType
  ) => Promise<string>;
  stopVerification: () => Promise<string>;
  addListener: <K extends keyof EventMap>(
    event: K,
    callback: (data: EventMap[K]) => void
  ) => void;
  removeListener: <K extends keyof EventMap>(event: K) => void;
  removeAllListeners: () => void;
}

const SinchFlashCall: SinchFlashCallInterface = (() => {
  const activeListeners = new Map<string, EmitterSubscription>();

  return {
    /**
     * @description Request permissions for  Manifest.permission.READ_PHONE_STATE, Manifest.permission.ACCESS_NETWORK_STATE, Manifest.permission.READ_CALL_LOG for the app to intercept the call
     */
    requestPermissions: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const granted =
            await NativeModules.AndroidSinchModule.requestPermissions();
          return granted;
        } catch (error) {
          console.error('Permission request error:', error);
          return false;
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description For testing purposes provide appSecret, for production it is not required,
     */
    initVerification: async (
      phoneNumber: string,
      appKey: string,
      appSecret = ''
    ) => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const result =
            await NativeModules.AndroidSinchModule.initVerification(
              phoneNumber,
              appKey,
              appSecret
            );

          return result;
        } catch (error) {
          return error;
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description Get the last call number from the call log
     */
    getLastCallNumberFromCallLog: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const number =
            await NativeModules.AndroidSinchModule.getLastCallNumber();
          return number;
        } catch (error) {
          return error;
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description Due to the permissions being granted to the app initially,
     * the SDK was able to intercept the call automatically and pass the verification code
     * (which in case of flashcall verification is the number that you’re receiving the call from)
     * back to the framework. If for some reason that fails, the verification code can be reported manually
     * by calling verification.verify method and passing the number you’re receiving the call from as an argument.
     * Use getLastCallNumberFromCallLog to get the number.
     */
    verifyCode: async (code: string, methodType: VerificationMethodType) => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const result = await NativeModules.AndroidSinchModule.verifyCode(
            code,
            methodType
          );
          return result;
        } catch (error) {
          return error;
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description To stop verification process
     */
    stopVerification: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const result =
            await NativeModules.AndroidSinchModule.stopVerification();
          return result;
        } catch (error) {
          return error;
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description add event listeners to subscribe to events during the verification process in Sinch Flash Call module.
     */
    addListener: <K extends keyof EventMap>(
      event: K,
      callback: (data: EventMap[K]) => void
    ) => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        const subscription = DeviceEventEmitter.addListener(
          event,
          callback as any
        );
        activeListeners.set(event, subscription);
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description use to when remove the listeners added.
     */
    removeListener: <K extends keyof EventMap>(event: K) => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        if (activeListeners.has(event)) {
          const subscription = activeListeners.get(event);
          if (subscription) {
            subscription.remove();
            activeListeners.delete(event);
          }
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description use to when remove all the listeners at once.
     */
    removeAllListeners: () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        activeListeners.forEach((subscription) => {
          subscription.remove();
        });
        activeListeners.clear();
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },
  };
})();

export default SinchFlashCall;
