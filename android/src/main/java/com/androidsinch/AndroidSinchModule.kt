package com.androidsinch

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.core.PermissionListener
import com.facebook.react.modules.core.PermissionAwareActivity
import com.sinch.verification.core.auth.AppKeyAuthorizationMethod
import com.sinch.verification.core.auth.BasicAuthorizationMethod
import com.sinch.verification.core.config.general.SinchGlobalConfig
import com.sinch.verification.core.internal.Verification
import com.sinch.verification.core.internal.VerificationMethodType
import com.sinch.verification.core.verification.VerificationEvent
import com.sinch.verification.core.verification.response.VerificationListener
import com.sinch.verification.flashcall.FlashCallVerificationMethod
import com.sinch.verification.flashcall.config.FlashCallVerificationConfig
import com.sinch.verification.flashcall.initialization.FlashCallInitializationListener
import com.sinch.verification.flashcall.initialization.FlashCallInitializationResponseData
import android.provider.CallLog

class AndroidSinchModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), PermissionListener, VerificationListener, ActivityEventListener {

    companion object {
        private const val PERMISSION_REQUEST_CODE_INTERNET = 1
        private const val PERMISSION_REQUEST_CODE_READ_CALL_LOG = 2
        private const val PERMISSION_REQUEST_CODE_CHANGE_NETWORK_STATE = 3
        private const val PERMISSION_REQUEST_CODE_ACCESS_NETWORK_STATE = 4
        private const val PERMISSION_REQUEST_CODE_READ_PHONE_STATE = 5
        private const val PERMISSION_REQUEST_CODE_ESSENTIAL = 100
    }

    private var permissionPromises: MutableMap<Int, Promise> = mutableMapOf()
    private var verification: Verification? = null
    private var verificationPromise: Promise? = null

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "AndroidSinchModule"
    }

    @ReactMethod
    fun requestInternetPermission(promise: Promise) {
        requestPermission(Manifest.permission.INTERNET, PERMISSION_REQUEST_CODE_INTERNET, promise)
    }

    @ReactMethod
    fun requestReadCallLogPermission(promise: Promise) {
        requestPermission(Manifest.permission.READ_CALL_LOG, PERMISSION_REQUEST_CODE_READ_CALL_LOG, promise)
    }

    @ReactMethod
    fun requestChangeNetworkStatePermission(promise: Promise) {
        requestPermission(Manifest.permission.CHANGE_NETWORK_STATE, PERMISSION_REQUEST_CODE_CHANGE_NETWORK_STATE, promise)
    }

    @ReactMethod
    fun requestAccessNetworkStatePermission(promise: Promise) {
        requestPermission(Manifest.permission.ACCESS_NETWORK_STATE, PERMISSION_REQUEST_CODE_ACCESS_NETWORK_STATE, promise)
    }

    @ReactMethod
    fun requestReadPhoneStatePermission(promise: Promise) {
        requestPermission(Manifest.permission.READ_PHONE_STATE, PERMISSION_REQUEST_CODE_READ_PHONE_STATE, promise)
    }

    @ReactMethod
    fun requestEssentialPermissions(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist")
            return
        }

        val permissionsToRequest = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_PHONE_STATE) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.READ_PHONE_STATE)
        }
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.ACCESS_NETWORK_STATE) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.ACCESS_NETWORK_STATE)
        }
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_CALL_LOG) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.READ_CALL_LOG)
        }
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.INTERNET) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.INTERNET)
        }

        if (permissionsToRequest.isNotEmpty()) {
            val permissionAwareActivity = activity as PermissionAwareActivity
            permissionPromises[PERMISSION_REQUEST_CODE_ESSENTIAL] = promise
            permissionAwareActivity.requestPermissions(
                permissionsToRequest.toTypedArray(),
                PERMISSION_REQUEST_CODE_ESSENTIAL,
                this
            )
        } else {
            promise.resolve(true)
        }
    }

    private fun requestPermission(permission: String, requestCode: Int, promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist")
            return
        }

        this.permissionPromises[requestCode] = promise

        if (ContextCompat.checkSelfPermission(activity, permission) == PackageManager.PERMISSION_GRANTED) {
            promise.resolve(true)
        } else {
            val permissionAwareActivity = activity as PermissionAwareActivity
            permissionAwareActivity.requestPermissions(arrayOf(permission), requestCode, this)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ): Boolean {
        val promise = permissionPromises[requestCode]
        permissionPromises.remove(requestCode)

        if (requestCode == PERMISSION_REQUEST_CODE_ESSENTIAL) {
            val allGranted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            promise?.let {
                if (allGranted) {
                    it.resolve(true)
                } else {
                    it.reject("E_PERMISSIONS_DENIED", "Essential permissions were denied")
                }
            }
        } else {
            val granted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            promise?.let {
                if (granted) {
                    it.resolve(true)
                } else {
                    it.reject("E_PERMISSIONS_DENIED", "Permission was denied")
                }
            }
        }
        return true
    }

    @ReactMethod
    fun initVerification(phoneNumber: String, appKey: String, appSecret: String?, promise: Promise) {
        val context = reactApplicationContext
        val authorizationMethod = if (appSecret.isNullOrEmpty()) {
            AppKeyAuthorizationMethod(appKey)
        } else {
            BasicAuthorizationMethod(appKey, appSecret)
        }
        val globalConfig = SinchGlobalConfig.Builder.instance
            .applicationContext(context)
            .authorizationMethod(authorizationMethod)
            .build()

        val config = FlashCallVerificationConfig.Builder()
            .globalConfig(globalConfig)
            .number(phoneNumber)
            .build()

        this.verificationPromise = promise

        verification = FlashCallVerificationMethod.Builder()
            .config(config)
            .initializationListener(object : FlashCallInitializationListener {
                override fun onInitializationFailed(t: Throwable) {
                    verificationPromise?.reject(
                        "INITIALIZATION_FAILED",
                        "Failed to initialize verification: " + t.message
                    )
                    sendEvent("verificationFailed", "Failed to initialize")
                }

                override fun onInitiated(data: FlashCallInitializationResponseData) {
                    verificationPromise?.resolve("Verification initiated")
                    sendEvent("verificationInitiated", "Verification process started")
                }
            })
            .verificationListener(this)
            .build()

        verification?.initiate()
    }

    @ReactMethod
    fun stopVerification(promise: Promise) {
        if (verification != null) {
            verification?.stop()
            verification = null

            promise.resolve("Verification stopped")

            if (verificationPromise != null) {
                verificationPromise?.resolve("Verification stopped due to explicit stop call")
                verificationPromise = null
                sendEvent("verificationStopped", "Verification process stopped")
            }
        } else {
            promise.resolve("No active verification to stop")
        }
    }

    @ReactMethod
    fun verifyCode(code: String, methodType: String, promise: Promise) {
        val verificationMethodType = when (methodType) {
            "FLASHCALL" -> VerificationMethodType.FLASHCALL
            "SMS" -> VerificationMethodType.SMS
            else -> null
        }

        if (verificationMethodType == null) {
            promise.reject("INVALID_METHOD_TYPE", "Invalid verification method type")
            return
        }

        if (verification != null) {
            this.verificationPromise = promise
            verification?.verify(code, verificationMethodType)
        } else {
            promise.reject("NO_VERIFICATION", "No verification has been initialized")
            sendEvent("verificationNotInitialized", "Verification not initialized")
        }
    }

    @ReactMethod
    fun getLastCallNumber(promise: Promise) {
        val context = reactApplicationContext
        try {
            val cursor = context.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                null,
                null,
                null,
                CallLog.Calls.DATE + " DESC"
            )
            if (cursor != null && cursor.moveToFirst()) {
                val numberIndex = cursor.getColumnIndex(CallLog.Calls.NUMBER)
                if (numberIndex != -1) {
                    val number = cursor.getString(numberIndex)
                    cursor.close()
                    promise.resolve(number)
                } else {
                    cursor.close()
                    promise.reject("NO_CALL_NUMBER", "Could not find call number in the log.")
                }
            } else {
                cursor?.close()
                promise.reject("NO_CALL_LOG", "No calls found in the log.")
            }
        } catch (e: SecurityException) {
            promise.reject("PERMISSION_DENIED", "Call log permission not granted.")
        }
    }

    override fun onVerified() {
        if (verificationPromise != null) {
            verificationPromise?.resolve("Successfully verified")
            sendEvent("verificationSuccess", "Verification completed successfully")
        }
    }

    override fun onVerificationFailed(t: Throwable) {
        if (verificationPromise != null) {
            verificationPromise?.reject(
                "VERIFICATION_FAILED",
                "Verification failed: " + t.message
            )
            sendEvent("verificationFailed", "Verification failed")
        }
    }

    override fun onVerificationEvent(event: VerificationEvent) {
        val eventDetails = "Event received: ${event::class.java.simpleName}"
        sendEvent("verificationEvent", eventDetails)
    }

    private fun sendEvent(eventName: String, eventData: String) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, eventData)
    }

    override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {
        // Not used, but required for ActivityEventListener
    }

    override fun onNewIntent(intent: Intent?) {
        // Not used, but required for ActivityEventListener
    }
}
