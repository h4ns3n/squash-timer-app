<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Get plugin settings.
function erd_get_settings_v2() {
    $settings = get_option( 'erd_settings' );
    return $settings;
}
