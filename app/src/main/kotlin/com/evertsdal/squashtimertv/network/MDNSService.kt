package com.evertsdal.squashtimertv.network

import android.content.Context
import android.net.wifi.WifiManager
import android.provider.Settings
import dagger.hilt.android.qualifiers.ApplicationContext
import timber.log.Timber
import java.net.InetAddress
import java.nio.ByteBuffer
import java.nio.ByteOrder
import javax.inject.Inject
import javax.inject.Singleton
import javax.jmdns.JmDNS
import javax.jmdns.ServiceInfo

/**
 * mDNS service for broadcasting device presence on local network
 */
@Singleton
class MDNSService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private var jmdns: JmDNS? = null
    private var serviceInfo: ServiceInfo? = null
    private var multicastLock: WifiManager.MulticastLock? = null
    
    companion object {
        private const val SERVICE_TYPE = "_squashtimer._tcp.local."
        private const val SERVICE_NAME_PREFIX = "Squash Timer - "
    }
    
    /**
     * Register the mDNS service
     */
    fun registerService(port: Int, deviceId: String, deviceName: String) {
        try {
            // Acquire multicast lock
            val wifiManager = context.getSystemService(Context.WIFI_SERVICE) as WifiManager
            multicastLock = wifiManager.createMulticastLock("squash_timer_mdns")
            multicastLock?.acquire()
            
            // Get local IP address
            val ipAddress = getLocalIpAddress(wifiManager)
            
            // Create JmDNS instance
            jmdns = JmDNS.create(ipAddress)
            
            // Create service info with TXT records
            val txtRecords = mapOf(
                "version" to "1.0",
                "deviceId" to deviceId,
                "deviceName" to deviceName,
                "wsPort" to port.toString(),
                "apiVersion" to "1"
            )
            
            serviceInfo = ServiceInfo.create(
                SERVICE_TYPE,
                "$SERVICE_NAME_PREFIX$deviceName",
                port,
                0,
                0,
                txtRecords
            )
            
            // Register service
            jmdns?.registerService(serviceInfo)
            
            Timber.i("mDNS service registered: $deviceName on port $port")
        } catch (e: Exception) {
            Timber.e(e, "Failed to register mDNS service")
        }
    }
    
    /**
     * Unregister the mDNS service
     */
    fun unregisterService() {
        try {
            jmdns?.unregisterAllServices()
            jmdns?.close()
            jmdns = null
            
            multicastLock?.release()
            multicastLock = null
            
            Timber.i("mDNS service unregistered")
        } catch (e: Exception) {
            Timber.e(e, "Failed to unregister mDNS service")
        }
    }
    
    /**
     * Get the local IP address from WiFi connection
     */
    private fun getLocalIpAddress(wifiManager: WifiManager): InetAddress {
        val ipInt = wifiManager.connectionInfo.ipAddress
        val ipBytes = ByteBuffer.allocate(4)
            .order(ByteOrder.LITTLE_ENDIAN)
            .putInt(ipInt)
            .array()
        return InetAddress.getByAddress(ipBytes)
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
