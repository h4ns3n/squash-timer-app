package com.evertsdal.squashtimertv.network.models

/**
 * Synchronization mode for timer control
 */
enum class SyncMode {
    /**
     * Each TV operates independently
     */
    INDEPENDENT,
    
    /**
     * All TVs synchronized to central controller
     */
    CENTRALIZED
}
