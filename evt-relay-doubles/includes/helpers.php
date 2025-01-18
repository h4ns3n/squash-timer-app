<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// Get plugin settings.
function eflct_get_settings() {
    $settings = get_option( 'eflct_settings' );
    return $settings;
}