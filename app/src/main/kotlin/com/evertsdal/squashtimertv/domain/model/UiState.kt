package com.evertsdal.squashtimertv.domain.model

/**
 * Wrapper for UI state that includes error handling and loading states.
 * 
 * @param T The type of data being wrapped
 */
sealed class UiState<out T> {
    /**
     * Successful state with data
     */
    data class Success<T>(val value: T) : UiState<T>()
    
    /**
     * Error state with data and error message
     */
    data class Error<T>(val value: T, val message: String) : UiState<T>()
    
    /**
     * Loading state with current data
     */
    data class Loading<T>(val value: T) : UiState<T>()
    
    /**
     * Get the data regardless of state
     */
    fun getData(): T = when (this) {
        is Success -> value
        is Error -> value
        is Loading -> value
    }
    
    /**
     * Get error message if in error state
     */
    fun getErrorMessage(): String? = when (this) {
        is Error -> message
        else -> null
    }
    
    /**
     * Check if in error state
     */
    fun isError(): Boolean = this is Error
    
    /**
     * Check if loading
     */
    fun isLoading(): Boolean = this is Loading
}
