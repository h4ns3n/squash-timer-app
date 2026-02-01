export interface AudioValidationResult {
  valid: boolean
  duration?: number
  error?: string
}

export interface AudioUploadResult {
  success: boolean
  message: string
  filePath?: string
  durationSeconds?: number
}

const MAX_DURATION_SECONDS = 20
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export class AudioUploadService {
  /**
   * Validate an audio file before upload
   * Checks: file type, file size, and duration
   */
  async validateAudioFile(file: File): Promise<AudioValidationResult> {
    // Check file type
    if (!file.type.includes('audio/mpeg') && !file.name.toLowerCase().endsWith('.mp3')) {
      return { valid: false, error: 'Only MP3 files are supported' }
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: 'File too large. Maximum size is 5MB' }
    }

    // Get audio duration using Web Audio API
    try {
      const duration = await this.getAudioDuration(file)
      
      if (duration > MAX_DURATION_SECONDS) {
        return { 
          valid: false, 
          error: `Audio too long. Maximum duration is ${MAX_DURATION_SECONDS} seconds (got ${Math.round(duration)}s)`,
          duration 
        }
      }

      return { valid: true, duration }
    } catch (error) {
      console.error('Failed to get audio duration:', error)
      return { valid: false, error: 'Failed to read audio file. Please ensure it is a valid MP3.' }
    }
  }

  /**
   * Get the duration of an audio file in seconds using Web Audio API
   */
  private async getAudioDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
          audioContext.close()
          resolve(audioBuffer.duration)
        } catch (error) {
          audioContext.close()
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsArrayBuffer(file)
    })
  }

  /**
   * Convert a file to base64 string
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data URL prefix (e.g., "data:audio/mpeg;base64,")
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsDataURL(file)
    })
  }

  /**
   * Upload an audio file to a device
   */
  async uploadAudioToDevice(
    deviceIp: string,
    devicePort: number,
    file: File,
    audioType: 'start' | 'end',
    onProgress?: (progress: number) => void
  ): Promise<AudioUploadResult> {
    try {
      // Validate first
      const validation = await this.validateAudioFile(file)
      if (!validation.valid) {
        return { success: false, message: validation.error || 'Validation failed' }
      }

      onProgress?.(10)

      // Convert to base64
      const fileData = await this.fileToBase64(file)
      onProgress?.(30)

      // Prepare request body
      const requestBody = {
        audioType,
        fileName: file.name,
        fileData,
        durationSeconds: Math.round(validation.duration || 0)
      }

      onProgress?.(50)

      // Send to device
      const response = await fetch(`http://${deviceIp}:${devicePort}/upload-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      onProgress?.(90)

      const result = await response.json() as AudioUploadResult

      onProgress?.(100)

      return result
    } catch (error) {
      console.error('Failed to upload audio:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to upload audio file'
      }
    }
  }

  /**
   * Delete an audio file from a device
   */
  async deleteAudioFromDevice(
    deviceIp: string,
    devicePort: number,
    audioType: 'start' | 'end'
  ): Promise<AudioUploadResult> {
    try {
      const response = await fetch(`http://${deviceIp}:${devicePort}/delete-audio/${audioType}`, {
        method: 'DELETE',
      })

      const result = await response.json() as AudioUploadResult
      return result
    } catch (error) {
      console.error('Failed to delete audio:', error)
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete audio file'
      }
    }
  }
}

// Export singleton instance
export const audioUploadService = new AudioUploadService()
