import {
  NativeModules,
  Platform,
  DeviceEventEmitter,
  EmitterSubscription,
} from 'react-native';

// Define types for the events data if they are known
export interface EventData {
  message: string; // Example type, adjust according to actual data
}

// Mapping of event names to their expected data types
export type EventMap = {
  verificationSuccess: EventData;
  verificationFailed: EventData;
  verificationInitiated: EventData;
  verificationNotInitialized: EventData;
  verificationEvent: EventData; // Example, adjust as needed
};

// Define the types for VerificationMethodType
export type VerificationMethodType = 'FLASHCALL' | 'SMS'; // Add other method types as needed

// Define the types for PermissionStatus
export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'unavailable'
  | 'blocked'
  | 'partial'
  | 'error';

export interface SinchFlashCallInterface {
  requestInternetPermission(): Promise<PermissionStatus>;
  requestReadCallLogPermission(): Promise<PermissionStatus>;
  requestChangeNetworkStatePermission(): Promise<PermissionStatus>;
  requestAccessNetworkStatePermission(): Promise<PermissionStatus>;
  requestReadPhoneStatePermission(): Promise<PermissionStatus>;
  requestEssentialPermissions(): Promise<PermissionStatus>;
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

const isDevEnvironment = __DEV__;

const SinchFlashCall: SinchFlashCallInterface = (() => {
  const activeListeners = new Map<string, EmitterSubscription>();

  // Helper function to validate E.164 phone number format
  const isValidE164 = (phoneNumber: string): boolean => {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  };

  const log = (...args: any[]) => {
    if (isDevEnvironment) {
      console.log(...args);
    }
  };

  const warn = (...args: any[]) => {
    if (isDevEnvironment) {
      console.warn(...args);
    }
  };

  const error = (...args: any[]) => {
    if (isDevEnvironment) {
      console.error(...args);
    }
  };

  return {
    /**
     * @description Request permission for Manifest.permission.INTERNET
     */
    requestInternetPermission: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const status =
            await NativeModules.AndroidSinchModule.requestInternetPermission();
          return status;
        } catch (err) {
          error('Internet Permission request error:', err);
          return 'error';
        }
      } else {
        warn('Sinch Flash Call is only available on Android');
        return 'unavailable';
      }
    },

    /**
     * @description Request permission for Manifest.permission.READ_CALL_LOG
     */
    requestReadCallLogPermission: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const status =
            await NativeModules.AndroidSinchModule.requestReadCallLogPermission();
          return status;
        } catch (err) {
          error('Read Call Log Permission request error:', err);
          return 'error';
        }
      } else {
        warn('Sinch Flash Call is only available on Android');
        return 'unavailable';
      }
    },

    /**
     * @description Request permission for Manifest.permission.CHANGE_NETWORK_STATE
     */
    requestChangeNetworkStatePermission: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const status =
            await NativeModules.AndroidSinchModule.requestChangeNetworkStatePermission();
          return status;
        } catch (err) {
          error('Change Network State Permission request error:', err);
          return 'error';
        }
      } else {
        warn('Sinch Flash Call is only available on Android');
        return 'unavailable';
      }
    },

    /**
     * @description Request permission for Manifest.permission.ACCESS_NETWORK_STATE
     */
    requestAccessNetworkStatePermission: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const status =
            await NativeModules.AndroidSinchModule.requestAccessNetworkStatePermission();
          return status;
        } catch (err) {
          error('Access Network State Permission request error:', err);
          return 'error';
        }
      } else {
        warn('Sinch Flash Call is only available on Android');
        return 'unavailable';
      }
    },

    /**
     * @description Request permission for Manifest.permission.READ_PHONE_STATE
     */
    requestReadPhoneStatePermission: async () => {
      if (Platform.OS === 'android' && NativeModules.AndroidSinchModule) {
        try {
          const status =
            await NativeModules.AndroidSinchModule.requestReadPhoneStatePermission();
          return status;
        } catch (err) {
          error('Read Phone State Permission request error:', err);
          return 'error';
        }
      } else {
        warn('Sinch Flash Call is only available on Android');
        return 'unavailable';
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
          const statuses =
            await NativeModules.AndroidSinchModule.requestEssentialPermissions();
          const statusValues = Object.values(statuses);
          log({ statuses, statusValues });

          if (statusValues.every((status) => status === 'granted')) {
            return 'granted';
          } else if (statusValues.every((status) => status === 'denied')) {
            warn('Essential Permissions denied:', statuses);
            return 'denied';
          } else if (statusValues.every((status) => status === 'unavailable')) {
            warn('Essential Permissions unavailable:', statuses);
            return 'unavailable';
          } else if (statusValues.every((status) => status === 'blocked')) {
            warn('Essential Permissions blocked:', statuses);
            return 'blocked';
          } else {
            warn('Essential Permissions partially granted:', statuses);
            return 'partial';
          }
        } catch (err) {
          error('Essential Permissions request error:', err);
          return 'error';
        }
      } else {
        warn('Sinch Flash Call is only available on Android');
        return 'unavailable';
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
        } catch (err) {
          return err;
        }
      } else {
        warn('Sinch Flash Call is only available on Android');
        return 'unavailable';
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
        } catch (err) {
          return err;
        }
      } else {
        warn('Sinch Flash Call is only available on Android');
        return null;
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
        } catch (err) {
          return err;
        }
      } else {
        warn('Sinch Flash Call is only available on Android');
        return 'unavailable';
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
        } catch (err) {
          return err;
        }
      } else {
        warn('Sinch Flash Call is only available on Android');
        return 'unavailable';
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
        warn('Sinch Flash Call is only available on Android');
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
        warn('Sinch Flash Call is only available on Android');
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
        warn('Sinch Flash Call is only available on Android');
      }
    },
  };
})();

export default SinchFlashCall;
