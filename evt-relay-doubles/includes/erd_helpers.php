<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Get plugin settings.
function erd_get_settings() {
    $settings = get_option( 'erd_settings' );
    return $settings;
}

/**
 * Verify that all required functions are available
 */
function erd_verify_required_functions() {
    $required_functions = array(
        'erd_render_logo_settings',
        'erd_render_audio_settings',
        'erd_render_timer_settings',
        'erd_render_appearance_settings',
        'erd_render_match_schedule',
        'erd_render_csv_upload_form',
        'erd_render_schedule_clear_form'
    );

    $missing_functions = array();
    foreach ($required_functions as $function) {
        if (!function_exists($function)) {
            $missing_functions[] = $function;
        }
    }

    if (!empty($missing_functions)) {
        add_settings_error(
            'erd_settings',
            'missing_functions',
            'Missing required functions: ' . implode(', ', $missing_functions),
            'error'
        );
        return false;
    }

    return true;
}