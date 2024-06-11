# react-native-android-sinch

React Native Android module for Sinch Flash Call

## Installation

```sh
npm install react-native-android-sinch
yarn add react-native-android-sinch
```

## Sinch version

```sh
com.sinch.android.sdk.verification:verification-flashcall:2.1.14
```

## Note

```
The android.permission.INTERNET permission is required for the Verification SDK to work. 
To handle flash call verification automatically android.permission.READ_CALL_LOG is needed.
In case of seamless method SDK needs android.permission.
CHANGE_NETWORK_STATE to be able to automatically switch to mobile data for API calls connected with the verification process. 
Additionally, SDK collects phone metadata information connected with sim cards or phone software version, 
which are then used to handle early verification rejection rules. 
For this module to be fully functional android.permission.ACCESS_NETWORK_STATE and android.permission.READ_PHONE_STATE should be granted. 
These permissions however are not essential.
```

## Usage

### Importing the Module

```js
import SinchFlashCall from 'react-native-android-sinch';
```

### Requesting Permissions

You need to request necessary permissions for the module to function properly. Here are the methods to request individual permissions and essential permissions.

```js
// Request individual permissions
const requestInternetPermission = async () => {
  const status = await SinchFlashCall.requestInternetPermission();
  console.log('Internet Permission:', status);
};

const requestReadCallLogPermission = async () => {
  const status = await SinchFlashCall.requestReadCallLogPermission();
  console.log('Read Call Log Permission:', status);
};

const requestChangeNetworkStatePermission = async () => {
  const status = await SinchFlashCall.requestChangeNetworkStatePermission();
  console.log('Change Network State Permission:', status);
};

const requestAccessNetworkStatePermission = async () => {
  const status = await SinchFlashCall.requestAccessNetworkStatePermission();
  console.log('Access Network State Permission:', status);
};

const requestReadPhoneStatePermission = async () => {
  const status = await SinchFlashCall.requestReadPhoneStatePermission();
  console.log('Read Phone State Permission:', status);
};

// Request essential permissions
/**
 * @description Request essential permissions for the app to function properly.
 * This includes:
 * - Manifest.permission.READ_PHONE_STATE
 * - Manifest.permission.ACCESS_NETWORK_STATE
 * - Manifest.permission.READ_CALL_LOG
 * - Manifest.permission.INTERNET
 */
const requestEssentialPermissions = async () => {
  const status = await SinchFlashCall.requestEssentialPermissions();
  console.log('Essential Permissions:', status);
};

// Example usage
requestInternetPermission();
requestReadCallLogPermission();
requestChangeNetworkStatePermission();
requestAccessNetworkStatePermission();
requestReadPhoneStatePermission();
requestEssentialPermissions();
```

### Initializing Verification

Ensure that the phone number is in E.164 format. The essential permissions should be requested before calling this function.

```js
const initVerification = async () => {
  try {
    const result = await SinchFlashCall.initVerification('+12051111111', 'appKeyValue', 'appSecret');
    console.log('Verification initiated:', result);
  } catch (error) {
    console.error('Verification initiation error:', error);
  }
};

// Example usage
initVerification();
```

### Verifying Code

If the SDK fails to intercept the call automatically, you can verify the code manually using the received call number.

```js
const verifyCode = async (code, methodType) => {
  try {
    const result = await SinchFlashCall.verifyCode(code, methodType);
    console.log('Code verified:', result);
  } catch (error) {
    console.error('Verify code error:', error);
  }
};

// Example usage
verifyCode('12345', 'FLASHCALL');
```

### Stopping Verification

Stop the ongoing verification process if needed.

```js
const stopVerification = async () => {
  try {
    const result = await SinchFlashCall.stopVerification();
    console.log('Verification stopped:', result);
  } catch (error) {
    console.error('Stop verification error:', error);
  }
};

// Example usage
stopVerification();
```

### Getting the Last Call Number from Call Log

Retrieve the last call number from the call log to use in manual verification.

```js
const getLastCallNumberFromCallLog = async () => {
  try {
    const number = await SinchFlashCall.getLastCallNumberFromCallLog();
    console.log('Last call number:', number);
  } catch (error) {
    console.error('Get last call number error:', error);
  }
};

// Example usage
getLastCallNumberFromCallLog();
```

### Adding Event Listeners

Subscribe to events during the verification process.

```js
const addListener = () => {
  SinchFlashCall.addListener("verificationSuccess", (data) => {
    console.log("verificationSuccess", data);
  });
  
  SinchFlashCall.addListener("verificationFailed", (data) => {
    console.log("verificationFailed", data);
  });
};

// Example usage
addListener();
```

### Removing Event Listeners

Remove event listeners when they are no longer needed.

```js
const removeListener = () => {
  SinchFlashCall.removeListener("verificationSuccess");
  SinchFlashCall.removeListener("verificationFailed");
};

// Example usage
removeListener();
```

### Removing All Event Listeners

Remove all event listeners at once.

```js
const removeAllListeners = () => {
  SinchFlashCall.removeAllListeners();
};

// Example usage
removeAllListeners();
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)

---


