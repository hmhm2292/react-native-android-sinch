# react-native-android-sinch

react native android module for sinch flash call

## Installation

```sh
npm install react-native-android-sinch

yarn add react-native-android-sinch
```

## Sinch version

```sh
com.sinch.android.sdk.verification:verification-flashcall:2.1.14
```



## Usage

```js
import SinchFlashCall from 'react-native-android-sinch';

/**
  * @description Request permissions for Manifest.permission.READ_PHONE_STATE, Manifest.permission.ACCESS_NETWORK_STATE, Manifest.permission.READ_CALL_LOG for the app to intercept the call
*/
const permissionStatus = SinchFlashCall.requestPermission().then((permission) => {
  console.log(permission)
})

/**
  * @description For testing purposes provide appSecret, for production it is not required,
  * Manifest.permission.READ_PHONE_STATE, Manifest.permission.ACCESS_NETWORK_STATE, Manifest.permission.READ_CALL_LOG is needed for verification to work.
*/
const verify = SinchFlashCall.initVerification('+12051111111', 'appKeyValue', 'appSecrete').then((result) => {
  console.log({result})
})

/**
  * @description add event listeners to subscribe to events during the verification process in Sinch Flash Call module.
*/
const listener = SinchFlashCall.addListener("verificationSuccess", (data) => {console.log("verificationSuccess", data)})

```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
