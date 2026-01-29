package com.evertsdal.squashtimertv.network

import android.content.Context
import android.net.nsd.NsdManager
import android.net.nsd.NsdServiceInfo
import android.provider.Settings
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Network Service Discovery (NSD) for broadcasting device presence on local network
 * Uses Android's built-in NSD API (mDNS/DNS-SD)
 */
@Singleton
class NSDService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private var nsdManager: NsdManager? = null
    private var registrationListener: NsdManager.RegistrationListener? = null
    private var serviceName: String? = null
    
    companion object {
        private const val SERVICE_TYPE = "_squashtimer._tcp."
        private const val SERVICE_NAME_PREFIX = "Squash Timer - "
    }
    
    /**
     * Register the NSD service
     */
    fun registerService(port: Int, deviceId: String, deviceName: String) {
        try {
            nsdManager = context.getSystemService(Context.NSD_SERVICE) as NsdManager
            
            val serviceInfo = NsdServiceInfo().apply {
                serviceName = "$SERVICE_NAME_PREFIX$deviceName"
                serviceType = SERVICE_TYPE
                setPort(port)
                
                // Add TXT records for additional metadata
                setAttribute("version", "1.0")
                setAttribute("deviceId", deviceId)
                setAttribute("deviceName", deviceName)
                setAttribute("wsPort", port.toString())
                setAttribute("apiVersion", "1")
            }
            
            registrationListener = object : NsdManager.RegistrationListener {
                override fun onRegistrationFailed(serviceInfo: NsdServiceInfo?, errorCode: Int) {
                    Timber.e("NSD registration failed: errorCode=$errorCode")
                }
                
                override fun onUnregistrationFailed(serviceInfo: NsdServiceInfo?, errorCode: Int) {
                    Timber.e("NSD unregistration failed: errorCode=$errorCode")
                }
                
                override fun onServiceRegistered(serviceInfo: NsdServiceInfo?) {
                    this@NSDService.serviceName = serviceInfo?.serviceName
                    Timber.i("NSD service registered: ${serviceInfo?.serviceName}")
                }
                
                override fun onServiceUnregistered(serviceInfo: NsdServiceInfo?) {
                    Timber.i("NSD service unregistered: ${serviceInfo?.serviceName}")
                }
            }
            
            nsdManager?.registerService(
                serviceInfo,
                NsdManager.PROTOCOL_DNS_SD,
                registrationListener
            )
            
            Timber.i("NSD service registration initiated: $SERVICE_NAME_PREFIX$deviceName on port $port")
        } catch (e: Exception) {
            Timber.e(e, "Failed to register NSD service")
        }
    }
    
    /**
     * Unregister the NSD service
     */
    fun unregisterService() {
        try {
            registrationListener?.let { listener ->
                nsdManager?.unregisterService(listener)
            }
            registrationListener = null
            nsdManager = null
            serviceName = null
            
            Timber.i("NSD service unregistered")
        } catch (e: Exception) {
            Timber.e(e, "Failed to unregister NSD service")
        }
    }
    
    /**
     * Get device name from system settings
     */
    fun getDeviceName(): String {
        return try {
            Settings.Global.getString(context.contentResolver, "device_name")
                ?: android.os.Build.MODEL
                ?: "Android TV"
        } catch (e: Exception) {
            Timber.e(e, "Failed to get device name")
            "Android TV"
        }
    }
    
    /**
     * Get or create a unique device ID
     */
    fun getDeviceId(): String {
        val prefs = context.getSharedPreferences("network_config", Context.MODE_PRIVATE)
        return prefs.getString("device_id", null) ?: run {
            val id = java.util.UUID.randomUUID().toString()
            prefs.edit().putString("device_id", id).apply()
            Timber.d("Generated new device ID: $id")
            id
        }
    }
}
