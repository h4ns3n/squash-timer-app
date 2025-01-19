<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles file uploads and deletions for logo and audio files.
 *
 * @param string $file_input_name The name attribute of the file input.
 * @param int    $existing_attachment_id The existing attachment ID, if any.
 * @param array  $allowed_mime_types Allowed MIME types.
 * @return int|string The new attachment ID or existing ID if no upload occurs.
 */
function erd_handle_file_upload($file_input_name, $existing_attachment_id, $allowed_mime_types = array()) {
    // Check for deletion
    if (isset($_POST[$file_input_name . '_delete']) && $_POST[$file_input_name . '_delete'] === '1') {
        if ($existing_attachment_id) {
            wp_delete_attachment($existing_attachment_id, true);
        }
        return '';
    }

    // Handle file upload
    if (isset($_FILES[$file_input_name]) && !empty($_FILES[$file_input_name]['name'])) {
        // Check file size (e.g., max 5MB for images, 10MB for audio)
        $max_file_size = (strpos($file_input_name, 'sound') !== false) ? 10485760 : 5242880; // 10MB or 5MB

        if ($_FILES[$file_input_name]['size'] > $max_file_size) {
            add_settings_error(
                'erd_settings',
                'erdct_file_upload_size_error',
                sprintf(__('The file size for %s exceeds the maximum allowed size.', 'erdct-textdomain'),
                    ucfirst(str_replace('_', ' ', $file_input_name))),
                'error'
            );
            return $existing_attachment_id;
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $uploaded = wp_handle_upload($_FILES[$file_input_name], array(
            'test_form' => false,
            'mimes'     => $allowed_mime_types,
        ));

        if (isset($uploaded['error']) && !empty($uploaded['error'])) {
            add_settings_error(
                'erd_settings',
                'erdct_file_upload_error',
                sprintf(__('File upload error for %s: %s', 'erdct-textdomain'),
                    ucfirst(str_replace('_', ' ', $file_input_name)),
                    esc_html($uploaded['error'])),
                'error'
            );
            return $existing_attachment_id;
        }

        if (isset($uploaded['file'])) {
            $filetype = wp_check_filetype($uploaded['file'], null);
            $attachment = array(
                'post_mime_type' => $filetype['type'],
                'post_title'     => sanitize_file_name($_FILES[$file_input_name]['name']),
                'post_content'   => '',
                'post_status'    => 'inherit'
            );

            $attach_id = wp_insert_attachment($attachment, $uploaded['file']);

            if (!is_wp_error($attach_id)) {
                $attach_data = wp_generate_attachment_metadata($attach_id, $uploaded['file']);
                wp_update_attachment_metadata($attach_id, $attach_data);

                // Delete old attachment if a new one is uploaded
                if ($existing_attachment_id) {
                    wp_delete_attachment($existing_attachment_id, true);
                }

                return $attach_id;
            } else {
                add_settings_error(
                    'erd_settings',
                    'erdct_attachment_error',
                    sprintf(__('Attachment error for %s.', 'erdct-textdomain'),
                        ucfirst(str_replace('_', ' ', $file_input_name))),
                    'error'
                );
            }
        }
    }

    return $existing_attachment_id;
}