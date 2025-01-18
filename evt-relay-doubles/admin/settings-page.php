<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

/**
 * Adds the settings page to the WordPress admin menu.
 */
function eflct_add_settings_page() {
    add_options_page(
        __( 'Evertsdal Relay Doubles Timer Settings', 'eflct-textdomain' ), // Page title
        __( 'Relay Doubles Countdown Timer', 'eflct-textdomain' ),                      // Menu title
        'manage_options',                                                       // Capability
        'eflct-settings',                                                       // Menu slug
        'eflct_render_settings_page'                                            // Callback function
    );
}
add_action( 'admin_menu', 'eflct_add_settings_page' );

/**
 * Registers the plugin settings.
 */
function eflct_register_settings() {
    register_setting(
        'eflct_settings_group', // Option group
        'eflct_settings',      // Option name
        'eflct_sanitize_settings' // Sanitize callback
    );

    // Add settings sections and fields if needed in the future
    // Currently, fields are handled manually in the settings page
}
add_action( 'admin_init', 'eflct_register_settings' );

/**
 * Sanitizes and validates the plugin settings.
 *
 * @param array $input The input array from the settings form.
 * @return array The sanitized settings array.
 */
function eflct_sanitize_settings( $input ) {
    // Initialize the sanitized array.
    $sanitized = array();

    // Sanitize timer values (minutes and seconds).
    $sanitized['singles_warmup_minutes'] = isset( $input['singles_warmup_minutes'] ) ? absint( $input['singles_warmup_minutes'] ) : 0;
    $sanitized['singles_warmup_seconds'] = isset( $input['singles_warmup_seconds'] ) ? absint( $input['singles_warmup_seconds'] ) : 0;
    $sanitized['singles_match_minutes'] = isset( $input['singles_match_minutes'] ) ? absint( $input['singles_match_minutes'] ) : 0;
    $sanitized['singles_match_seconds'] = isset( $input['singles_match_seconds'] ) ? absint( $input['singles_match_seconds'] ) : 0;

    $sanitized['doubles_warmup_minutes'] = isset( $input['doubles_warmup_minutes'] ) ? absint( $input['doubles_warmup_minutes'] ) : 0;
    $sanitized['doubles_warmup_seconds'] = isset( $input['doubles_warmup_seconds'] ) ? absint( $input['doubles_warmup_seconds'] ) : 0;
    $sanitized['doubles_match_minutes'] = isset( $input['doubles_match_minutes'] ) ? absint( $input['doubles_match_minutes'] ) : 0;
    $sanitized['doubles_match_seconds'] = isset( $input['doubles_match_seconds'] ) ? absint( $input['doubles_match_seconds'] ) : 0;

    // Sanitize start from specific match and time.
    $sanitized['start_from_match'] = isset( $input['start_from_match'] ) ? absint( $input['start_from_match'] ) : 1;
    $sanitized['start_from_minutes'] = isset( $input['start_from_minutes'] ) ? absint( $input['start_from_minutes'] ) : 0;
    $sanitized['start_from_seconds'] = isset( $input['start_from_seconds'] ) ? absint( $input['start_from_seconds'] ) : 0;

    // Sanitize font sizes.
    if ( isset( $input['font_sizes'] ) && is_array( $input['font_sizes'] ) ) {
        foreach ( $input['font_sizes'] as $key => $size ) {
            $sanitized['font_sizes'][ sanitize_key( $key ) ] = absint( $size );
        }
    }

    // Sanitize colors.
    if ( isset( $input['colors'] ) && is_array( $input['colors'] ) ) {
        foreach ( $input['colors'] as $key => $color ) {
            $sanitized['colors'][ sanitize_key( $key ) ] = sanitize_hex_color( $color );
        }
    }

    // Handle file uploads for logo and audio files with allowed MIME types.
    $sanitized['logo'] = eflct_handle_file_upload( 'eflct_logo', isset( $input['logo'] ) ? $input['logo'] : '', array( 'jpg|jpeg|png|gif' ) );
    $sanitized['start_sound'] = eflct_handle_file_upload( 'eflct_start_sound', isset( $input['start_sound'] ) ? $input['start_sound'] : '', array( 'mp3|wav|ogg' ) );
    $sanitized['end_sound'] = eflct_handle_file_upload( 'eflct_end_sound', isset( $input['end_sound'] ) ? $input['end_sound'] : '', array( 'mp3|wav|ogg' ) );

    // **Removed handling of 'clear_schedule' here to prevent interference with main settings.**

    // Sanitize match schedule.
    if ( isset( $input['match_schedule'] ) && is_array( $input['match_schedule'] ) ) {
        foreach ( $input['match_schedule'] as $match_index => $match ) {
            // Sanitize match description.
            if ( isset( $match['description'] ) ) {
                $sanitized['match_schedule'][ $match_index ]['description'] = sanitize_text_field( $match['description'] );
            }

            // Sanitize court details.
            if ( isset( $match['court'] ) && is_array( $match['court'] ) ) {
                foreach ( $match['court'] as $court_index => $court ) {
                    if ( isset( $court['team_name'] ) ) {
                        $sanitized['match_schedule'][ $match_index ]['court'][ $court_index ]['team_name'] = sanitize_text_field( $court['team_name'] );
                    }
                    if ( isset( $court['player_desc'] ) ) {
                        $sanitized['match_schedule'][ $match_index ]['court'][ $court_index ]['player_desc'] = sanitize_text_field( $court['player_desc'] );
                    }
                    if ( isset( $court['player_name'] ) ) {
                        $sanitized['match_schedule'][ $match_index ]['court'][ $court_index ]['player_name'] = sanitize_text_field( $court['player_name'] );
                    }
                }
            }
        }
    }

    return $sanitized;
}

/**
 * Handles file uploads and deletions for logo and audio files.
 *
 * @param string $file_input_name The name attribute of the file input.
 * @param int    $existing_attachment_id The existing attachment ID, if any.
 * @param array  $allowed_mime_types Allowed MIME types (e.g., array('jpg|jpeg|png|gif')).
 * @return int|string The new attachment ID or existing ID if no upload occurs.
 */
function eflct_handle_file_upload( $file_input_name, $existing_attachment_id, $allowed_mime_types = array() ) {
    // Check for deletion.
    if ( isset( $_POST[ $file_input_name . '_delete' ] ) && $_POST[ $file_input_name . '_delete' ] === '1' ) {
        if ( $existing_attachment_id ) {
            wp_delete_attachment( $existing_attachment_id, true );
        }
        return ''; // Remove the attachment ID from settings.
    }

    // Handle file upload.
    if ( isset( $_FILES[ $file_input_name ] ) && ! empty( $_FILES[ $file_input_name ]['name'] ) ) {
        // Check file size (e.g., max 5MB for images, 10MB for audio)
        $max_file_size = ( strpos( $file_input_name, 'sound' ) !== false ) ? 10485760 : 5242880; // 10MB or 5MB
        if ( $_FILES[ $file_input_name ]['size'] > $max_file_size ) {
            add_settings_error(
                'eflct_settings',
                'eflct_file_upload_size_error',
                sprintf( __( 'The file size for %s exceeds the maximum allowed size.', 'eflct-textdomain' ), ucfirst( str_replace( '_', ' ', $file_input_name ) ) ),
                'error'
            );
            return $existing_attachment_id;
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $uploaded = wp_handle_upload( $_FILES[ $file_input_name ], array(
            'test_form' => false,
            'mimes'     => $allowed_mime_types,
        ) );

        if ( isset( $uploaded['error'] ) && ! empty( $uploaded['error'] ) ) {
            add_settings_error(
                'eflct_settings',
                'eflct_file_upload_error',
                sprintf( __( 'File upload error for %s: %s', 'eflct-textdomain' ), ucfirst( str_replace( '_', ' ', $file_input_name ) ), esc_html( $uploaded['error'] ) ),
                'error'
            );
            return $existing_attachment_id;
        }

        if ( isset( $uploaded['file'] ) ) {
            $filetype = wp_check_filetype( $uploaded['file'], null );
            $attachment = array(
                'post_mime_type' => $filetype['type'],
                'post_title'     => sanitize_file_name( $_FILES[ $file_input_name ]['name'] ),
                'post_content'   => '',
                'post_status'    => 'inherit'
            );
            $attach_id = wp_insert_attachment( $attachment, $uploaded['file'] );
            if ( ! is_wp_error( $attach_id ) ) {
                $attach_data = wp_generate_attachment_metadata( $attach_id, $uploaded['file'] );
                wp_update_attachment_metadata( $attach_id, $attach_data );

                // Delete old attachment if a new one is uploaded.
                if ( $existing_attachment_id ) {
                    wp_delete_attachment( $existing_attachment_id, true );
                }

                return $attach_id;
            } else {
                add_settings_error(
                    'eflct_settings',
                    'eflct_attachment_error',
                    sprintf( __( 'Attachment error for %s.', 'eflct-textdomain' ), ucfirst( str_replace( '_', ' ', $file_input_name ) ) ),
                    'error'
                );
            }
        }
    }

    return $existing_attachment_id;
}

/**
 * Handles the CSV file upload to populate the match schedule.
 */
function eflct_handle_csv_upload() {
    // Verify user capability.
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( __( 'Unauthorized user', 'eflct-textdomain' ) );
    }

    // Check nonce.
    if ( ! isset( $_POST['eflct_upload_csv_nonce_field'] ) || ! wp_verify_nonce( $_POST['eflct_upload_csv_nonce_field'], 'eflct_upload_csv_nonce' ) ) {
        wp_die( __( 'Nonce verification failed', 'eflct-textdomain' ) );
    }

    // Check if a file is uploaded.
    if ( ! empty( $_FILES['match_schedule_csv']['tmp_name'] ) ) {
        $file_info = pathinfo( $_FILES['match_schedule_csv']['name'] );
        $extension = strtolower( isset( $file_info['extension'] ) ? $file_info['extension'] : '' );

        if ( $extension !== 'csv' ) {
            add_settings_error(
                'eflct_settings',
                'eflct_csv_upload_invalid_extension',
                __( 'Please upload a valid CSV file with a .csv extension.', 'eflct-textdomain' ),
                'error'
            );
            wp_redirect( add_query_arg( 'settings-updated', 'false', admin_url( 'options-general.php?page=eflct-settings' ) ) );
            exit;
        }

        // Further validate MIME type using finfo
        $finfo = finfo_open( FILEINFO_MIME_TYPE );
        $mime_type = finfo_file( $finfo, $_FILES['match_schedule_csv']['tmp_name'] );
        finfo_close( $finfo );

        $allowed_mime_types = array( 'text/plain', 'text/csv', 'application/vnd.ms-excel', 'text/comma-separated-values' );
        if ( ! in_array( $mime_type, $allowed_mime_types, true ) ) {
            add_settings_error(
                'eflct_settings',
                'eflct_csv_upload_invalid_mime',
                __( 'Please upload a valid CSV file.', 'eflct-textdomain' ),
                'error'
            );
            wp_redirect( add_query_arg( 'settings-updated', 'false', admin_url( 'options-general.php?page=eflct-settings' ) ) );
            exit;
        }

        // Check file size (e.g., max 2MB)
        $max_csv_size = 2097152; // 2MB
        if ( $_FILES['match_schedule_csv']['size'] > $max_csv_size ) {
            add_settings_error(
                'eflct_settings',
                'eflct_csv_upload_size',
                __( 'CSV file size exceeds the maximum allowed size of 2MB.', 'eflct-textdomain' ),
                'error'
            );
            wp_redirect( add_query_arg( 'settings-updated', 'false', admin_url( 'options-general.php?page=eflct-settings' ) ) );
            exit;
        }

        // Proceed with processing the CSV
        $csv_file = fopen( $_FILES['match_schedule_csv']['tmp_name'], 'r' );

        if ( $csv_file !== false ) {
            // Get the header row
            $header = fgetcsv( $csv_file );

            // Initialize match schedule array
            $match_schedule = array();

            // Loop through the file rows and map data
            $match_number = 1;
            while ( ( $row = fgetcsv( $csv_file ) ) !== false ) {
                // Ensure the CSV has at least 13 columns
                if ( count( $row ) < 13 ) {
                    continue; // Skip incomplete rows
                }

                $match_schedule[ $match_number ] = array(
                    'description' => sanitize_text_field( $row[0] ),
                    'court'       => array(
                        1 => array(
                            'team_name'   => sanitize_text_field( $row[1] ),
                            'player_desc' => sanitize_text_field( $row[2] ),
                            'player_name' => sanitize_text_field( $row[3] ),
                        ),
                        2 => array(
                            'team_name'   => sanitize_text_field( $row[4] ),
                            'player_desc' => sanitize_text_field( $row[5] ),
                            'player_name' => sanitize_text_field( $row[6] ),
                        ),
                        3 => array(
                            'team_name'   => sanitize_text_field( $row[7] ),
                            'player_desc' => sanitize_text_field( $row[8] ),
                            'player_name' => sanitize_text_field( $row[9] ),
                        ),
                        4 => array(
                            'team_name'   => sanitize_text_field( $row[10] ),
                            'player_desc' => sanitize_text_field( $row[11] ),
                            'player_name' => sanitize_text_field( $row[12] ),
                        ),
                    ),
                );

                $match_number++;
            }

            // Update the settings with the new match schedule from the CSV
            $settings = get_option( 'eflct_settings', array() );
            $settings['match_schedule'] = $match_schedule;
            update_option( 'eflct_settings', $settings );

            fclose( $csv_file );

            // Add a success message.
            add_settings_error(
                'eflct_settings',
                'eflct_csv_upload_success',
                __( 'Match schedule successfully populated from CSV file.', 'eflct-textdomain' ),
                'updated'
            );
        } else {
            // Add an error message if the file couldn't be opened.
            add_settings_error(
                'eflct_settings',
                'eflct_csv_upload_error',
                __( 'Unable to read the uploaded CSV file.', 'eflct-textdomain' ),
                'error'
            );
        }
    } else {
        // Add an error message for invalid file types.
        add_settings_error(
            'eflct_settings',
            'eflct_csv_upload_invalid',
            __( 'Please upload a valid CSV file.', 'eflct-textdomain' ),
            'error'
        );
    }

    // Redirect back to the settings page with messages.
    wp_redirect( add_query_arg( 'settings-updated', 'true', admin_url( 'options-general.php?page=eflct-settings' ) ) );
    exit;
}
add_action( 'admin_post_eflct_upload_csv', 'eflct_handle_csv_upload' );

/**
 * Handles clearing the existing match schedule.
 */
function eflct_handle_clear_schedule() {
    // Verify user capability.
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_die( __( 'Unauthorized user', 'eflct-textdomain' ) );
    }

    // Check nonce.
    if ( ! isset( $_POST['eflct_clear_schedule_nonce_field'] ) || ! wp_verify_nonce( $_POST['eflct_clear_schedule_nonce_field'], 'eflct_clear_schedule_nonce' ) ) {
        wp_die( __( 'Nonce verification failed', 'eflct-textdomain' ) );
    }

    // Check if the clear schedule checkbox is checked.
    if ( isset( $_POST['eflct_settings']['clear_schedule'] ) && $_POST['eflct_settings']['clear_schedule'] == 1 ) {
        $settings = get_option( 'eflct_settings', array() );
        unset( $settings['match_schedule'] );
        update_option( 'eflct_settings', $settings );

        // Add a success message.
        add_settings_error(
            'eflct_settings',
            'eflct_clear_schedule_success',
            __( 'Match schedule cleared successfully.', 'eflct-textdomain' ),
            'updated'
        );
    }

    // Redirect back to the settings page with messages.
    wp_redirect( add_query_arg( 'settings-updated', 'true', admin_url( 'options-general.php?page=eflct-settings' ) ) );
    exit;
}
add_action( 'admin_post_eflct_clear_schedule', 'eflct_handle_clear_schedule' );

/**
 * Renders the settings page in the WordPress admin.
 */
function eflct_render_settings_page() {
    // Display settings errors (for success or error messages).
    settings_errors( 'eflct_settings' );

    // Retrieve existing settings from the database.
    $settings = get_option( 'eflct_settings', array() );

    // Retrieve individual settings or set defaults.
    $logo_id        = isset( $settings['logo'] ) ? $settings['logo'] : '';
    $start_sound_id = isset( $settings['start_sound'] ) ? $settings['start_sound'] : '';
    $end_sound_id   = isset( $settings['end_sound'] ) ? $settings['end_sound'] : '';

    $font_sizes = isset( $settings['font_sizes'] ) ? $settings['font_sizes'] : array(
        'league_title' => 48,
        'timer'        => 72,
        'match_number' => 24,
        'court_label'  => 24,
        'team_name'    => 18,
        'player_desc'  => 18,
        'player_name'  => 18,
    );

    $colors = isset( $settings['colors'] ) ? $settings['colors'] : array(
        'league_title' => '#000000',
        'timer'        => '#000000',
        'match_number' => '#000000',
        'court_label'  => '#000000',
        'team_name'    => '#000000',
        'player_desc'  => '#000000',
        'player_name'  => '#000000',
    );

    $match_schedule = isset( $settings['match_schedule'] ) ? $settings['match_schedule'] : array();
    ?>
    <div class="wrap">
        <h1><?php esc_html_e( 'Evertsdal Fantasy League Timer Settings', 'eflct-textdomain' ); ?></h1>

        <!-- Main Settings Form -->
        <form method="post" action="options.php" enctype="multipart/form-data">
            <?php
            settings_fields( 'eflct_settings_group' );
            do_settings_sections( 'eflct_settings_group' );
            ?>

            <!-- Logo Upload -->
            <h2><?php esc_html_e( 'Logo Upload', 'eflct-textdomain' ); ?></h2>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Logo', 'eflct-textdomain' ); ?></th>
                    <td>
                        <?php
                        $logo_url = $logo_id ? wp_get_attachment_url( $logo_id ) : '';
                        ?>
                        <input type="file" name="eflct_logo" accept="image/*" />
                        <?php if ( $logo_url ) : ?>
                            <div><img src="<?php echo esc_url( $logo_url ); ?>" style="max-width: 200px; margin-top: 10px;" alt="<?php esc_attr_e( 'Logo', 'eflct-textdomain' ); ?>" /></div>
                            <label><input type="checkbox" name="eflct_logo_delete" value="1" /> <?php esc_html_e( 'Delete Logo', 'eflct-textdomain' ); ?></label>
                        <?php endif; ?>
                        <input type="hidden" name="eflct_settings[logo]" value="<?php echo esc_attr( $logo_id ); ?>" />
                    </td>
                </tr>
            </table>

            <!-- Audio Settings -->
            <h2><?php esc_html_e( 'Audio Settings', 'eflct-textdomain' ); ?></h2>
            <table class="form-table">
                <!-- Start Sound -->
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Start Sound', 'eflct-textdomain' ); ?></th>
                    <td>
                        <?php
                        $start_sound_url = $start_sound_id ? wp_get_attachment_url( $start_sound_id ) : '';
                        ?>
                        <input type="file" name="eflct_start_sound" accept="audio/*" />
                        <?php if ( $start_sound_url ) : ?>
                            <div><?php printf( __( 'Current File: %s', 'eflct-textdomain' ), esc_html( basename( $start_sound_url ) ) ); ?></div>
                            <label><input type="checkbox" name="eflct_start_sound_delete" value="1" /> <?php esc_html_e( 'Delete Start Sound', 'eflct-textdomain' ); ?></label>
                        <?php endif; ?>
                        <input type="hidden" name="eflct_settings[start_sound]" value="<?php echo esc_attr( $start_sound_id ); ?>" />
                    </td>
                </tr>

                <!-- End Sound -->
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'End Sound', 'eflct-textdomain' ); ?></th>
                    <td>
                        <?php
                        $end_sound_url = $end_sound_id ? wp_get_attachment_url( $end_sound_id ) : '';
                        ?>
                        <input type="file" name="eflct_end_sound" accept="audio/*" />
                        <?php if ( $end_sound_url ) : ?>
                            <div><?php printf( __( 'Current File: %s', 'eflct-textdomain' ), esc_html( basename( $end_sound_url ) ) ); ?></div>
                            <label><input type="checkbox" name="eflct_end_sound_delete" value="1" /> <?php esc_html_e( 'Delete End Sound', 'eflct-textdomain' ); ?></label>
                        <?php endif; ?>
                        <input type="hidden" name="eflct_settings[end_sound]" value="<?php echo esc_attr( $end_sound_id ); ?>" />
                    </td>
                </tr>
            </table>

            <!-- Timer Settings -->
            <h2><?php esc_html_e( 'Timer Settings', 'eflct-textdomain' ); ?></h2>
            <table class="form-table">
                <!-- Singles Settings -->
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Singles Warm-up Time', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[singles_warmup_minutes]" value="<?php echo isset( $settings['singles_warmup_minutes'] ) ? esc_attr( $settings['singles_warmup_minutes'] ) : '2'; ?>" min="0" /> <?php esc_html_e( 'minutes', 'eflct-textdomain' ); ?>
                        <input type="number" name="eflct_settings[singles_warmup_seconds]" value="<?php echo isset( $settings['singles_warmup_seconds'] ) ? esc_attr( $settings['singles_warmup_seconds'] ) : '0'; ?>" min="0" max="59" /> <?php esc_html_e( 'seconds', 'eflct-textdomain' ); ?>
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Singles Match Time', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[singles_match_minutes]" value="<?php echo isset( $settings['singles_match_minutes'] ) ? esc_attr( $settings['singles_match_minutes'] ) : '18'; ?>" min="0" /> <?php esc_html_e( 'minutes', 'eflct-textdomain' ); ?>
                        <input type="number" name="eflct_settings[singles_match_seconds]" value="<?php echo isset( $settings['singles_match_seconds'] ) ? esc_attr( $settings['singles_match_seconds'] ) : '0'; ?>" min="0" max="59" /> <?php esc_html_e( 'seconds', 'eflct-textdomain' ); ?>
                    </td>
                </tr>

                <!-- Doubles Settings -->
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Doubles Warm-up Time', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[doubles_warmup_minutes]" value="<?php echo isset( $settings['doubles_warmup_minutes'] ) ? esc_attr( $settings['doubles_warmup_minutes'] ) : '5'; ?>" min="0" /> <?php esc_html_e( 'minutes', 'eflct-textdomain' ); ?>
                        <input type="number" name="eflct_settings[doubles_warmup_seconds]" value="<?php echo isset( $settings['doubles_warmup_seconds'] ) ? esc_attr( $settings['doubles_warmup_seconds'] ) : '0'; ?>" min="0" max="59" /> <?php esc_html_e( 'seconds', 'eflct-textdomain' ); ?>
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Doubles Match Time', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[doubles_match_minutes]" value="<?php echo isset( $settings['doubles_match_minutes'] ) ? esc_attr( $settings['doubles_match_minutes'] ) : '30'; ?>" min="0" /> <?php esc_html_e( 'minutes', 'eflct-textdomain' ); ?>
                        <input type="number" name="eflct_settings[doubles_match_seconds]" value="<?php echo isset( $settings['doubles_match_seconds'] ) ? esc_attr( $settings['doubles_match_seconds'] ) : '0'; ?>" min="0" max="59" /> <?php esc_html_e( 'seconds', 'eflct-textdomain' ); ?>
                    </td>
                </tr>
            </table>

            <!-- Start from Specific Match and Time -->
            <h2><?php esc_html_e( 'Start Timer from Specific Match and Time', 'eflct-textdomain' ); ?></h2>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Start from Match Number', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[start_from_match]" value="<?php echo isset( $settings['start_from_match'] ) ? esc_attr( $settings['start_from_match'] ) : '1'; ?>" min="1" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Start from Time', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[start_from_minutes]" value="<?php echo isset( $settings['start_from_minutes'] ) ? esc_attr( $settings['start_from_minutes'] ) : '0'; ?>" min="0" /> <?php esc_html_e( 'minutes', 'eflct-textdomain' ); ?>
                        <input type="number" name="eflct_settings[start_from_seconds]" value="<?php echo isset( $settings['start_from_seconds'] ) ? esc_attr( $settings['start_from_seconds'] ) : '0'; ?>" min="0" max="59" /> <?php esc_html_e( 'seconds', 'eflct-textdomain' ); ?>
                    </td>
                </tr>
            </table>

            <!-- Appearance Settings -->
            <h2><?php esc_html_e( 'Appearance Settings', 'eflct-textdomain' ); ?></h2>
            <table class="form-table">
                <!-- League Title -->
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'League Title Font Size (px)', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[font_sizes][league_title]" value="<?php echo isset( $font_sizes['league_title'] ) ? esc_attr( $font_sizes['league_title'] ) : '48'; ?>" min="1" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'League Title Color', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="text" class="eflct-color-picker" name="eflct_settings[colors][league_title]" value="<?php echo isset( $colors['league_title'] ) ? esc_attr( $colors['league_title'] ) : '#000000'; ?>" />
                    </td>
                </tr>

                <!-- Timer -->
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Timer Font Size (px)', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[font_sizes][timer]" value="<?php echo isset( $font_sizes['timer'] ) ? esc_attr( $font_sizes['timer'] ) : '72'; ?>" min="1" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Timer Color', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="text" class="eflct-color-picker" name="eflct_settings[colors][timer]" value="<?php echo isset( $colors['timer'] ) ? esc_attr( $colors['timer'] ) : '#000000'; ?>" />
                    </td>
                </tr>

                <!-- Match Number -->
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Match Number Font Size (px)', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[font_sizes][match_number]" value="<?php echo isset( $font_sizes['match_number'] ) ? esc_attr( $font_sizes['match_number'] ) : '24'; ?>" min="1" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Match Number Color', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="text" class="eflct-color-picker" name="eflct_settings[colors][match_number]" value="<?php echo isset( $colors['match_number'] ) ? esc_attr( $colors['match_number'] ) : '#000000'; ?>" />
                    </td>
                </tr>

                <!-- Court Labels -->
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Court Labels Font Size (px)', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[font_sizes][court_label]" value="<?php echo isset( $font_sizes['court_label'] ) ? esc_attr( $font_sizes['court_label'] ) : '24'; ?>" min="1" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Court Labels Color', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="text" class="eflct-color-picker" name="eflct_settings[colors][court_label]" value="<?php echo isset( $colors['court_label'] ) ? esc_attr( $colors['court_label'] ) : '#000000'; ?>" />
                    </td>
                </tr>

                <!-- Team Names -->
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Team Names Font Size (px)', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[font_sizes][team_name]" value="<?php echo isset( $font_sizes['team_name'] ) ? esc_attr( $font_sizes['team_name'] ) : '18'; ?>" min="1" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Team Names Color', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="text" class="eflct-color-picker" name="eflct_settings[colors][team_name]" value="<?php echo isset( $colors['team_name'] ) ? esc_attr( $colors['team_name'] ) : '#000000'; ?>" />
                    </td>
                </tr>

                <!-- Player Descriptions -->
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Player Descriptions Font Size (px)', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[font_sizes][player_desc]" value="<?php echo isset( $font_sizes['player_desc'] ) ? esc_attr( $font_sizes['player_desc'] ) : '18'; ?>" min="1" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Player Descriptions Color', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="text" class="eflct-color-picker" name="eflct_settings[colors][player_desc]" value="<?php echo isset( $colors['player_desc'] ) ? esc_attr( $colors['player_desc'] ) : '#000000'; ?>" />
                    </td>
                </tr>

                <!-- Player Names -->
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Player Names Font Size (px)', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="number" name="eflct_settings[font_sizes][player_name]" value="<?php echo isset( $font_sizes['player_name'] ) ? esc_attr( $font_sizes['player_name'] ) : '18'; ?>" min="1" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Player Names Color', 'eflct-textdomain' ); ?></th>
                    <td>
                        <input type="text" class="eflct-color-picker" name="eflct_settings[colors][player_name]" value="<?php echo isset( $colors['player_name'] ) ? esc_attr( $colors['player_name'] ) : '#000000'; ?>" />
                    </td>
                </tr>
            </table>

            <!-- Match Schedule Management -->
            <h2><?php esc_html_e( 'Match Schedule', 'eflct-textdomain' ); ?></h2>
            <?php
            if ( ! empty( $match_schedule ) ) :
                foreach ( $match_schedule as $match_num => $match ) :
                    ?>
                    <h3><?php printf( __( 'Match %s: %s', 'eflct-textdomain' ), esc_html( $match_num ), esc_html( $match['description'] ) ); ?></h3>
                    <table class="form-table">
                        <tr valign="top">
                            <th scope="row"><?php esc_html_e( 'Court', 'eflct-textdomain' ); ?></th>
                            <?php for ( $court = 1; $court <= 4; $court++ ) : ?>
                                <th><?php printf( __( 'Court %s', 'eflct-textdomain' ), esc_html( $court ) ); ?></th>
                            <?php endfor; ?>
                        </tr>
                        <tr valign="top">
                            <th scope="row"><?php esc_html_e( 'Team Name', 'eflct-textdomain' ); ?></th>
                            <?php for ( $court = 1; $court <= 4; $court++ ) :
                                $team_name = isset( $match['court'][ $court ]['team_name'] ) ? $match['court'][ $court ]['team_name'] : '';
                                ?>
                                <td><input type="text" name="eflct_settings[match_schedule][<?php echo esc_attr( $match_num ); ?>][court][<?php echo esc_attr( $court ); ?>][team_name]" value="<?php echo esc_attr( $team_name ); ?>" /></td>
                            <?php endfor; ?>
                        </tr>
                        <tr valign="top">
                            <th scope="row"><?php esc_html_e( 'Player Description', 'eflct-textdomain' ); ?></th>
                            <?php for ( $court = 1; $court <= 4; $court++ ) :
                                $player_desc = isset( $match['court'][ $court ]['player_desc'] ) ? $match['court'][ $court ]['player_desc'] : '';
                                ?>
                                <td><input type="text" name="eflct_settings[match_schedule][<?php echo esc_attr( $match_num ); ?>][court][<?php echo esc_attr( $court ); ?>][player_desc]" value="<?php echo esc_attr( $player_desc ); ?>" /></td>
                            <?php endfor; ?>
                        </tr>
                        <tr valign="top">
                            <th scope="row"><?php esc_html_e( 'Player Name', 'eflct-textdomain' ); ?></th>
                            <?php for ( $court = 1; $court <= 4; $court++ ) :
                                $player_name = isset( $match['court'][ $court ]['player_name'] ) ? $match['court'][ $court ]['player_name'] : '';
                                ?>
                                <td><input type="text" name="eflct_settings[match_schedule][<?php echo esc_attr( $match_num ); ?>][court][<?php echo esc_attr( $court ); ?>][player_name]" value="<?php echo esc_attr( $player_name ); ?>" /></td>
                            <?php endfor; ?>
                        </tr>
                    </table>
                    <?php
                endforeach;
            else :
                echo '<p>' . esc_html__( 'No match schedule available. Please upload a CSV file or manually add matches below.', 'eflct-textdomain' ) . '</p>';
            endif;
            ?>

            <!-- Add New Match Manually -->
            <h3><?php esc_html_e( 'Add New Match Manually', 'eflct-textdomain' ); ?></h3>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Match Number', 'eflct-textdomain' ); ?></th>
                    <td><input type="number" name="eflct_new_match_number" min="1" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e( 'Match Description', 'eflct-textdomain' ); ?></th>
                    <td><input type="text" name="eflct_new_match_description" /></td>
                </tr>
            </table>
            <button type="button" class="button" id="eflct_add_new_match"><?php esc_html_e( 'Add Match', 'eflct-textdomain' ); ?></button>
            <p class="description"><?php esc_html_e( 'Fill in the match number and description, then click "Add Match" to add it to the schedule.', 'eflct-textdomain' ); ?></p>

            <!-- Save Settings Button -->
            <?php submit_button(); ?>
        </form>

        <!-- CSV Upload Section -->
        <h2><?php esc_html_e( 'Upload CSV to Populate Match Schedule', 'eflct-textdomain' ); ?></h2>
        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" enctype="multipart/form-data">
            <input type="hidden" name="action" value="eflct_upload_csv" />
            <?php wp_nonce_field( 'eflct_upload_csv_nonce', 'eflct_upload_csv_nonce_field' ); ?>
            <input type="file" name="match_schedule_csv" accept=".csv" required />
            <p class="description"><?php esc_html_e( 'Upload a CSV file to populate the match schedule. This will overwrite the current settings.', 'eflct-textdomain' ); ?></p>
            <?php submit_button( __( 'Upload CSV', 'eflct-textdomain' ), 'primary', 'submit', false ); ?>
        </form>

        <!-- Option to Clear the Existing Match Schedule -->
        <h3><?php esc_html_e( 'Clear Existing Schedule', 'eflct-textdomain' ); ?></h3>
        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
            <input type="hidden" name="action" value="eflct_clear_schedule" />
            <?php wp_nonce_field( 'eflct_clear_schedule_nonce', 'eflct_clear_schedule_nonce_field' ); ?>
            <label>
                <input type="checkbox" name="eflct_settings[clear_schedule]" value="1"> <?php esc_html_e( 'Clear existing match schedule', 'eflct-textdomain' ); ?>
            </label>
            <?php
            submit_button( __( 'Clear Schedule', 'eflct-textdomain' ), 'secondary', 'submit', false, array(
                'onclick' => 'return confirm("' . esc_js( __( 'Are you sure you want to clear the match schedule? This action cannot be undone.', 'eflct-textdomain' ) ) . '");',
            ) );
            ?>
        </form>

    </div>

    <!-- Include WordPress Color Picker Script and Custom JS -->
    <script>
    jQuery(document).ready(function($){
        // Initialize WordPress Color Picker
        $('.eflct-color-picker').wpColorPicker();

        // Handle adding new match via JavaScript
        $('#eflct_add_new_match').on('click', function(e){
            e.preventDefault();
            var matchNumber = $('input[name="eflct_new_match_number"]').val();
            var matchDescription = $('input[name="eflct_new_match_description"]').val();

            // Trim inputs to remove unnecessary whitespace
            matchNumber = $.trim(matchNumber);
            matchDescription = $.trim(matchDescription);

            if ( matchNumber === '' || matchDescription === '' ) {
                alert('<?php echo esc_js( __( 'Please enter both Match Number and Description.', 'eflct-textdomain' ) ); ?>');
                return;
            }

            if ( isNaN(matchNumber) || parseInt(matchNumber) <= 0 ) {
                alert('<?php echo esc_js( __( 'Please enter a valid positive number for Match Number.', 'eflct-textdomain' ) ); ?>');
                return;
            }

            // Check if match number already exists
            var exists = false;
            $('h3').each(function(){
                var existingMatchNum = $(this).text().split(':')[0].split(' ')[1];
                if ( parseInt(existingMatchNum) === parseInt(matchNumber) ) {
                    exists = true;
                    return false; // Exit loop
                }
            });

            if ( exists ) {
                alert('<?php echo esc_js( __( 'Match number already exists.', 'eflct-textdomain' ) ); ?>');
                return;
            }

            // Escape HTML to prevent XSS
            var escapedMatchDescription = $('<div>').text(matchDescription).html();

            // Create new match section
            var newMatchHtml = '<h3><?php echo esc_js( __( 'Match ', 'eflct-textdomain' ) ); ?>' + matchNumber + ': ' + escapedMatchDescription + '</h3>' +
                '<table class="form-table">' +
                    '<tr valign="top">' +
                        '<th scope="row"><?php echo esc_js( __( 'Court', 'eflct-textdomain' ) ); ?></th>' +
                        '<th><?php echo esc_js( __( 'Court 1', 'eflct-textdomain' ) ); ?></th>' +
                        '<th><?php echo esc_js( __( 'Court 2', 'eflct-textdomain' ) ); ?></th>' +
                        '<th><?php echo esc_js( __( 'Court 3', 'eflct-textdomain' ) ); ?></th>' +
                        '<th><?php echo esc_js( __( 'Court 4', 'eflct-textdomain' ) ); ?></th>' +
                    '</tr>' +
                    '<tr valign="top">' +
                        '<th scope="row"><?php echo esc_js( __( 'Team Name', 'eflct-textdomain' ) ); ?></th>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][1][team_name]" value="" /></td>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][2][team_name]" value="" /></td>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][3][team_name]" value="" /></td>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][4][team_name]" value="" /></td>' +
                    '</tr>' +
                    '<tr valign="top">' +
                        '<th scope="row"><?php echo esc_js( __( 'Player Description', 'eflct-textdomain' ) ); ?></th>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][1][player_desc]" value="" /></td>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][2][player_desc]" value="" /></td>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][3][player_desc]" value="" /></td>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][4][player_desc]" value="" /></td>' +
                    '</tr>' +
                    '<tr valign="top">' +
                        '<th scope="row"><?php echo esc_js( __( 'Player Name', 'eflct-textdomain' ) ); ?></th>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][1][player_name]" value="" /></td>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][2][player_name]" value="" /></td>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][3][player_name]" value="" /></td>' +
                        '<td><input type="text" name="eflct_settings[match_schedule][' + matchNumber + '][court][4][player_name]" value="" /></td>' +
                    '</tr>' +
                '</table>';

            // Append the new match to the form
            $('form').first().append(newMatchHtml);

            // Clear the input fields
            $('input[name="eflct_new_match_number"]').val('');
            $('input[name="eflct_new_match_description"]').val('');
        });
    });
    </script>
    <?php
}
?>