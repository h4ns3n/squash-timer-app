<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class ERD_Audio_Handler
 * Handles all audio-related functionality for the plugin.
 */
class ERD_Audio_Handler {
    /**
     * Allowed audio MIME types
     */
    private static $allowed_audio_types = array(
        'audio/mpeg' => 'mp3',
        'audio/wav'  => 'wav',
        'audio/ogg'  => 'ogg'
    );

    /**
     * Maximum file size for audio files (10MB)
     */
    private static $max_audio_size = 10485760;

    /**
     * Handles the audio file upload process
     *
     * @param string $file_key The $_FILES key for the uploaded file
     * @param int $existing_id Existing attachment ID if updating
     * @return array Response array with status and message/ID
     */
    public static function handle_audio_upload($file_key, $existing_id = 0) {
        if (!isset($_FILES[$file_key]) || empty($_FILES[$file_key]['name'])) {
            return array(
                'success' => false,
                'message' => __('No audio file provided.', 'erdct-textdomain')
            );
        }

        // Check file size
        if ($_FILES[$file_key]['size'] > self::$max_audio_size) {
            return array(
                'success' => false,
                'message' => __('Audio file exceeds maximum size limit of 10MB.', 'erdct-textdomain')
            );
        }

        // Verify file type
        $filetype = wp_check_filetype($_FILES[$file_key]['name'], self::$allowed_audio_types);
        if (!$filetype['type'] || !in_array($filetype['type'], array_keys(self::$allowed_audio_types))) {
            return array(
                'success' => false,
                'message' => __('Invalid audio file type. Please upload MP3, WAV, or OGG files only.', 'erdct-textdomain')
            );
        }

        // Include required files for media handling
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        // Upload the file
        $upload = wp_handle_upload(
            $_FILES[$file_key],
            array('test_form' => false, 'mimes' => self::$allowed_audio_types)
        );

        if (isset($upload['error'])) {
            return array(
                'success' => false,
                'message' => $upload['error']
            );
        }

        // Create attachment
        $attachment = array(
            'post_mime_type' => $filetype['type'],
            'post_title'     => preg_replace('/\.[^.]+$/', '', basename($upload['file'])),
            'post_content'   => '',
            'post_status'    => 'inherit'
        );

        $attach_id = wp_insert_attachment($attachment, $upload['file']);

        if (is_wp_error($attach_id)) {
            return array(
                'success' => false,
                'message' => $attach_id->get_error_message()
            );
        }

        // Generate metadata and update attachment
        $attach_data = wp_generate_attachment_metadata($attach_id, $upload['file']);
        wp_update_attachment_metadata($attach_id, $attach_data);

        // Delete old attachment if exists
        if ($existing_id) {
            wp_delete_attachment($existing_id, true);
        }

        return array(
            'success' => true,
            'id'      => $attach_id,
            'url'     => wp_get_attachment_url($attach_id)
        );
    }

    /**
     * Deletes an audio file
     *
     * @param int $attachment_id The attachment ID to delete
     * @return array Response array with status and message
     */
    public static function delete_audio($attachment_id) {
        if (!$attachment_id) {
            return array(
                'success' => false,
                'message' => __('No audio file specified.', 'erdct-textdomain')
            );
        }

        $result = wp_delete_attachment($attachment_id, true);

        if (!$result) {
            return array(
                'success' => false,
                'message' => __('Failed to delete audio file.', 'erdct-textdomain')
            );
        }

        return array(
            'success' => true,
            'message' => __('Audio file deleted successfully.', 'erdct-textdomain')
        );
    }

    /**
     * Validates audio settings before save
     *
     * @param array $audio_settings Array of audio settings
     * @return array Sanitized audio settings
     */
    public static function sanitize_audio_settings($audio_settings) {
        $sanitized = array();

        if (isset($audio_settings['start_sound'])) {
            $sanitized['start_sound'] = absint($audio_settings['start_sound']);
        }

        if (isset($audio_settings['end_sound'])) {
            $sanitized['end_sound'] = absint($audio_settings['end_sound']);
        }

        if (isset($audio_settings['volume'])) {
            $sanitized['volume'] = min(100, max(0, absint($audio_settings['volume'])));
        }

        return $sanitized;
    }
}