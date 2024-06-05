package com.androidsinch

import android.Manifest
import android.app.Activity
import android.content.pm.PackageManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.modules.core.PermissionListener
import com.sinch.verification.core.verification.VerificationEvent
import com.sinch.verification.core.auth.AppKeyAuthorizationMethod
import com.sinch.verification.core.auth.BasicAuthorizationMethod
import com.sinch.verification.core.config.general.SinchGlobalConfig
import com.sinch.verification.core.internal.Verification
import com.sinch.verification.core.verification.response.VerificationListener
import com.sinch.verification.flashcall.FlashCallVerificationMethod
import com.sinch.verification.flashcall.config.FlashCallVerificationConfig
import com.sinch.verification.flashcall.initialization.FlashCallInitializationListener
import com.sinch.verification.flashcall.initialization.FlashCallInitializationResponseData
import com.facebook.react.bridge.Arguments
import android.provider.CallLog
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.sinch.verification.core.internal.VerificationMethodType

class AndroidSinchModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), PermissionListener, VerificationListener {

    companion object {
        private const val PERMISSION_REQUEST_CODE = 5
    }

    private var permissionPromise: Promise? = null
    private var verification: Verification? = null
    private var verificationPromise: Promise? = null

    override fun getName(): String {
        return "AndroidSinchModule"
    }

    @ReactMethod
    fun requestPermissions(promise: Promise) {
        val activity = currentActivity
        if (activity == null) {
            promise.reject("E_ACTIVITY_DOES_NOT_EXIST", "Activity doesn't exist")
            return
        }
        this.permissionPromise = promise

        if (checkPermissions(activity)) {
            promise.resolve(true)
        } else {
            ActivityCompat.requestPermissions(
                activity,
                arrayOf(
                    Manifest.permission.READ_PHONE_STATE,
                    Manifest.permission.ACCESS_NETWORK_STATE,
                    Manifest.permission.READ_CALL_LOG
                ),
                PERMISSION_REQUEST_CODE
            )
        }
    }

    private fun checkPermissions(activity: Activity): Boolean {
        return ContextCompat.checkSelfPermission(
            activity,
            Manifest.permission.READ_PHONE_STATE
        ) == PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(
                    activity,
                    Manifest.permission.ACCESS_NETWORK_STATE
                ) == PackageManager.PERMISSION_GRANTED &&
                ContextCompat.checkSelfPermission(
                    activity,
                    Manifest.permission.READ_CALL_LOG
                ) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ): Boolean {
        if (requestCode == PERMISSION_REQUEST_CODE) {
            val allPermissionsGranted = grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }
            permissionPromise?.let {
                if (allPermissionsGranted) {
                    it.resolve(true)
                } else {
                    it.reject("E_PERMISSIONS_DENIED", "Permissions were denied")
                }
                permissionPromise = null
            }
            return allPermissionsGranted
        }
        return false
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
            // Stop the ongoing verification process
            verification?.stop()
            verification = null

            // Resolve the promise passed in with this stop request
            promise.resolve("Verification stopped")

            // If there was an ongoing verification process, also resolve its promise
            if (verificationPromise != null) {
                verificationPromise?.resolve("Verification stopped due to explicit stop call")
                verificationPromise = null
                sendEvent("verificationStopped", "Verification process stopped")
            }
        } else {
            // If there is no active verification, still resolve the incoming promise
            promise.resolve("No active verification to stop")
        }
    }

    @ReactMethod
    // if verification does not work automatically, use verify code method,
    // for FLASHCALL the code is the number that the call was made with
    fun verifyCode(code: String, methodType: String, promise: Promise) {
        val verificationMethodType = when (methodType) {
            "FLASHCALL" -> VerificationMethodType.FLASHCALL
            "SMS" -> VerificationMethodType.SMS
            // Add other method types as needed
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

    // sends event to JS side
    private fun sendEvent(eventName: String, eventData: String) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, eventData)
    }
}
