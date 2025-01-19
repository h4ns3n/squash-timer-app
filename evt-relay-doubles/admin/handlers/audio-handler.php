<?php
if (!defined('ABSPATH')) {
    exit;
}

function erd_handle_audio_upload() {
    check_ajax_referer('erd_audio_nonce', 'nonce');

    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
    }

    if (!empty($_FILES['erd_audio_file']['name'])) {
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');

        $attachment_id = media_handle_upload('erd_audio_file', 0);

        if (is_wp_error($attachment_id)) {
            wp_send_json_error($attachment_id->get_error_message());
        }

        $file_url = wp_get_attachment_url($attachment_id);

        wp_send_json_success([
            'id' => $attachment_id,
            'url' => $file_url
        ]);
    }

    wp_send_json_error('No file uploaded');
}

add_action('wp_ajax_erd_handle_audio', 'erd_handle_audio_upload');

function erd_delete_audio() {
    check_ajax_referer('erd_delete_audio', 'nonce');

    if (!current_user_can('manage_options')) {
        wp_send_json_error('Insufficient permissions');
    }

    $settings = get_option('erd_settings', array());
    if (!empty($settings['audio_attachment_id'])) {
        wp_delete_attachment($settings['audio_attachment_id'], true);
        unset($settings['audio_attachment_id']);
        unset($settings['audio_url']);
        update_option('erd_settings', $settings);
        wp_send_json_success();
    }

    wp_send_json_error('No audio file to delete');
}

add_action('wp_ajax_erd_delete_audio', 'erd_delete_audio');