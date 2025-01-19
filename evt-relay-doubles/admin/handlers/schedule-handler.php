<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles clearing the existing match schedule.
 */
function erd_handle_clear_schedule() {
    // Verify user capability
    if (!current_user_can('manage_options')) {
        wp_die(__('Unauthorized user', 'erdct-textdomain'));
    }

    // Check nonce
    if (!isset($_POST['erdct_clear_schedule_nonce_field']) ||
        !wp_verify_nonce($_POST['erdct_clear_schedule_nonce_field'], 'erdct_clear_schedule_nonce')) {
        wp_die(__('Nonce verification failed', 'erdct-textdomain'));
    }

    // Check if the clear schedule checkbox is checked
    if (isset($_POST['erd_settings']['clear_schedule']) && $_POST['erd_settings']['clear_schedule'] == 1) {
        $settings = get_option('erd_settings', array());

        // Remove the match schedule from settings
        unset($settings['match_schedule']);

        // Update the settings without the match schedule
        if (update_option('erd_settings', $settings)) {
            add_settings_error(
                'erd_settings',
                'erdct_clear_schedule_success',
                __('Match schedule cleared successfully.', 'erdct-textdomain'),
                'updated'
            );
        } else {
            add_settings_error(
                'erd_settings',
                'erdct_clear_schedule_error',
                __('Failed to clear match schedule.', 'erdct-textdomain'),
                'error'
            );
        }
    }

    // Redirect back to the settings page
    wp_redirect(add_query_arg('settings-updated', 'true', admin_url('options-general.php?page=erd-settings')));
    exit;
}
add_action('admin_post_erdct_clear_schedule', 'erd_handle_clear_schedule');

/**
 * Handles saving individual match details.
 */
function erd_handle_match_save() {
    // Debug log
    error_log('Match save handler triggered');

    // Verify user capability
    if (!current_user_can('manage_options')) {
        error_log('User capability check failed');
        wp_send_json_error('Unauthorized user');
        return;
    }

    // Verify nonce
    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'erd_match_save_nonce')) {
        error_log('Nonce verification failed');
        wp_send_json_error('Invalid nonce');
        return;
    }

    // Get and validate input
    $match_number = isset($_POST['match_number']) ? absint($_POST['match_number']) : 0;
    $match_data = isset($_POST['match_data']) ? $_POST['match_data'] : array();

    if (!$match_number || empty($match_data)) {
        error_log('Invalid match data received: ' . print_r($_POST, true));
        wp_send_json_error('Invalid match data');
        return;
    }

    // Get current settings
    $settings = get_option('erd_settings', array());

    // Initialize match_schedule if it doesn't exist
    if (!isset($settings['match_schedule'])) {
        $settings['match_schedule'] = array();
    }

    // Sanitize match data
    $sanitized_match_data = array(
        'description' => sanitize_text_field($match_data['description']),
        'courts' => array()
    );

    // Sanitize court data
    if (isset($match_data['courts']) && is_array($match_data['courts'])) {
        foreach ($match_data['courts'] as $court_number => $court) {
            $sanitized_match_data['courts'][$court_number] = array(
                'team_name' => sanitize_text_field($court['team_name']),
                'player_desc' => sanitize_text_field($court['player_desc']),
                'player_name' => sanitize_text_field($court['player_name'])
            );
        }
    }

    // Add the match to the schedule
    $settings['match_schedule'][$match_number] = $sanitized_match_data;

    // Debug log
    error_log('Attempting to save settings: ' . print_r($settings, true));

    // Update settings
    $update_result = update_option('erd_settings', $settings);

    if ($update_result) {
        error_log('Settings updated successfully');
        wp_send_json_success(array(
            'message' => sprintf(
                __('Match %d saved successfully.', 'erdct-textdomain'),
                $match_number
            )
        ));
    } else {
        error_log('Failed to update settings');
        wp_send_json_error('Failed to update settings');
    }
}
add_action('wp_ajax_erd_save_match', 'erd_handle_match_save');

/**
 * Handles deleting a match
 */
function erd_handle_match_delete() {
    if (!current_user_can('manage_options')) {
        wp_send_json_error('Unauthorized user');
        return;
    }

    if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'erd_match_save_nonce')) {
        wp_send_json_error('Invalid nonce');
        return;
    }

    $match_number = isset($_POST['match_number']) ? absint($_POST['match_number']) : 0;
    if (!$match_number) {
        wp_send_json_error('Invalid match number');
        return;
    }

    $settings = get_option('erd_settings', array());
    if (isset($settings['match_schedule'][$match_number])) {
        unset($settings['match_schedule'][$match_number]);
        if (update_option('erd_settings', $settings)) {
            wp_send_json_success(array(
                'message' => sprintf(__('Match %d deleted successfully.', 'erdct-textdomain'), $match_number)
            ));
        } else {
            wp_send_json_error('Failed to update settings');
        }
    } else {
        wp_send_json_error('Match not found');
    }
}
add_action('wp_ajax_erd_delete_match', 'erd_handle_match_delete');