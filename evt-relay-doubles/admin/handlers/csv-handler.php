<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles the CSV file upload to populate the match schedule.
 */
function erd_handle_csv_upload() {
    // Verify user capability
    if (!current_user_can('manage_options')) {
        wp_die(__('Unauthorized user', 'erdct-textdomain'));
    }

    // Check nonce
    if (!isset($_POST['erdct_upload_csv_nonce_field']) ||
        !wp_verify_nonce($_POST['erdct_upload_csv_nonce_field'], 'erdct_upload_csv_nonce')) {
        wp_die(__('Nonce verification failed', 'erdct-textdomain'));
    }

    // Check if a file is uploaded
    if (!empty($_FILES['match_schedule_csv']['tmp_name'])) {
        $file_info = pathinfo($_FILES['match_schedule_csv']['name']);
        $extension = strtolower(isset($file_info['extension']) ? $file_info['extension'] : '');

        if ($extension !== 'csv') {
            add_settings_error(
                'erd_settings',
                'erdct_csv_upload_invalid_extension',
                __('Please upload a valid CSV file with a .csv extension.', 'erdct-textdomain'),
                'error'
            );
            wp_redirect(add_query_arg('settings-updated', 'false', admin_url('options-general.php?page=erd-settings')));
            exit;
        }

        // Validate MIME type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $_FILES['match_schedule_csv']['tmp_name']);
        finfo_close($finfo);

        $allowed_mime_types = array(
            'text/plain',
            'text/csv',
            'application/vnd.ms-excel',
            'text/comma-separated-values'
        );

        if (!in_array($mime_type, $allowed_mime_types, true)) {
            add_settings_error(
                'erd_settings',
                'erdct_csv_upload_invalid_mime',
                __('Please upload a valid CSV file.', 'erdct-textdomain'),
                'error'
            );
            wp_redirect(add_query_arg('settings-updated', 'false', admin_url('options-general.php?page=erd-settings')));
            exit;
        }

        // Check file size (max 2MB)
        $max_csv_size = 2097152;
        if ($_FILES['match_schedule_csv']['size'] > $max_csv_size) {
            add_settings_error(
                'erd_settings',
                'erdct_csv_upload_size',
                __('CSV file size exceeds the maximum allowed size of 2MB.', 'erdct-textdomain'),
                'error'
            );
            wp_redirect(add_query_arg('settings-updated', 'false', admin_url('options-general.php?page=erd-settings')));
            exit;
        }

        // Process the CSV
        $csv_file = fopen($_FILES['match_schedule_csv']['tmp_name'], 'r');

        if ($csv_file !== false) {
            // Get the header row
            $header = fgetcsv($csv_file);

            // Initialize match schedule array
            $match_schedule = array();

            // Loop through the file rows and map data
            $match_number = 1;
            while (($row = fgetcsv($csv_file)) !== false) {
                // Ensure the CSV has at least 13 columns
                if (count($row) < 13) {
                    continue; // Skip incomplete rows
                }

                $match_schedule[$match_number] = array(
                    'description' => sanitize_text_field($row[0]),
                    'court' => array(
                        1 => array(
                            'team_name'   => sanitize_text_field($row[1]),
                            'player_desc' => sanitize_text_field($row[2]),
                            'player_name' => sanitize_text_field($row[3]),
                        ),
                        2 => array(
                            'team_name'   => sanitize_text_field($row[4]),
                            'player_desc' => sanitize_text_field($row[5]),
                            'player_name' => sanitize_text_field($row[6]),
                        ),
                        3 => array(
                            'team_name'   => sanitize_text_field($row[7]),
                            'player_desc' => sanitize_text_field($row[8]),
                            'player_name' => sanitize_text_field($row[9]),
                        ),
                        4 => array(
                            'team_name'   => sanitize_text_field($row[10]),
                            'player_desc' => sanitize_text_field($row[11]),
                            'player_name' => sanitize_text_field($row[12]),
                        ),
                    ),
                );

                $match_number++;
            }

            fclose($csv_file);

            // Update the settings with the new match schedule
            $settings = get_option('erd_settings', array());
            $settings['match_schedule'] = $match_schedule;
            update_option('erd_settings', $settings);

            add_settings_error(
                'erd_settings',
                'erdct_csv_upload_success',
                __('Match schedule successfully populated from CSV file.', 'erdct-textdomain'),
                'updated'
            );
        } else {
            add_settings_error(
                'erd_settings',
                'erdct_csv_upload_error',
                __('Unable to read the uploaded CSV file.', 'erdct-textdomain'),
                'error'
            );
        }
    } else {
        add_settings_error(
            'erd_settings',
            'erdct_csv_upload_invalid',
            __('Please upload a valid CSV file.', 'erdct-textdomain'),
            'error'
        );
    }

    // Redirect back to the settings page
    wp_redirect(add_query_arg('settings-updated', 'true', admin_url('options-general.php?page=erd-settings')));
    exit;
}
add_action('admin_post_erdct_upload_csv', 'erd_handle_csv_upload');