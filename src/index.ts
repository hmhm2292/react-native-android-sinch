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
  requestInternetPermission(): Promise<boolean>;
  requestReadCallLogPermission(): Promise<boolean>;
  requestChangeNetworkStatePermission(): Promise<boolean>;
  requestAccessNetworkStatePermission(): Promise<boolean>;
  requestReadPhoneStatePermission(): Promise<boolean>;
  requestEssentialPermissions(): Promise<boolean>;
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

  // Helper function to validate E.164 phone number format
  const isValidE164 = (phoneNumber: string): boolean => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  };

  return {
    /**
     * @description Request permission for Manifest.permission.INTERNET
     */
    requestInternetPermission: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const granted =
            await NativeModules.AndroidSinchModule.requestInternetPermission();
          return granted;
        } catch (error) {
          console.error('Internet Permission request error:', error);
          return false;
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description Request permission for Manifest.permission.READ_CALL_LOG
     */
    requestReadCallLogPermission: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const granted =
            await NativeModules.AndroidSinchModule.requestReadCallLogPermission();
          return granted;
        } catch (error) {
          console.error('Read Call Log Permission request error:', error);
          return false;
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description Request permission for Manifest.permission.CHANGE_NETWORK_STATE
     */
    requestChangeNetworkStatePermission: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const granted =
            await NativeModules.AndroidSinchModule.requestChangeNetworkStatePermission();
          return granted;
        } catch (error) {
          console.error(
            'Change Network State Permission request error:',
            error
          );
          return false;
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description Request permission for Manifest.permission.ACCESS_NETWORK_STATE
     */
    requestAccessNetworkStatePermission: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const granted =
            await NativeModules.AndroidSinchModule.requestAccessNetworkStatePermission();
          return granted;
        } catch (error) {
          console.error(
            'Access Network State Permission request error:',
            error
          );
          return false;
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description Request permission for Manifest.permission.READ_PHONE_STATE
     */
    requestReadPhoneStatePermission: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const granted =
            await NativeModules.AndroidSinchModule.requestReadPhoneStatePermission();
          return granted;
        } catch (error) {
          console.error('Read Phone State Permission request error:', error);
          return false;
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description Request essential permissions for the app to intercept the call.
     * This includes:
     * - Manifest.permission.READ_PHONE_STATE
     * - Manifest.permission.ACCESS_NETWORK_STATE
     * - Manifest.permission.READ_CALL_LOG
     * - Manifest.permission.INTERNET
     */
    requestEssentialPermissions: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const granted =
            await NativeModules.AndroidSinchModule.requestEssentialPermissions();
          return granted;
        } catch (error) {
          console.error('Essential Permissions request error:', error);
          return false;
        }
      } else {
        console.warn('Sinch Flash Call is only available on Android');
      }
    },

    /**
     * @description Initialize verification process with the given phone number, appKey, and appSecret.
     * The phone number must be in E.164 format. Make sure to request necessary permissions before calling this function.
     * @param phoneNumber Phone number to verify
     * @param appKey Sinch app key
     * @param appSecret Sinch app secret (optional)
     */
    initVerification: async (
      phoneNumber: string,
      appKey: string,
      appSecret = ''
    ) => {
      if (!isValidE164(phoneNumber)) {
        throw new Error('Phone number must be in E.164 format');
      }

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
     * @description Add event listeners to subscribe to events during the verification process in Sinch Flash Call module.
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
     * @description Use to remove the listeners added.
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
     * @description Use to remove all the listeners at once.
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
