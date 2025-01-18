<?php
/*
Plugin Name: Relay Doubles Countdown Timer
Description: Displays a countdown timer for the Evertsdal Relay squash matches.
Version: 1.0
Author: Paul Hansen
License: GPL2
Text Domain: evertsdal-relay-doubles-league
*/

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

// Define plugin constants.
define( 'ERD_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'ERD_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Include necessary files.
require_once ERD_PLUGIN_DIR . 'includes/helpers.php';

// Admin settings.
if ( is_admin() ) {
    require_once ERD_PLUGIN_DIR . 'admin/settings-page.php';
}

// Enqueue scripts and styles.
function erd_enqueue_scripts_v2() {
    wp_enqueue_style(
        'erd-frontend-css',
        ERD_PLUGIN_URL . 'public/css/countdown-timer.css'
    );
    wp_enqueue_script(
        'erd-frontend-js',
        ERD_PLUGIN_URL . 'public/js/countdown-timer.js',
        array( 'jquery' ),
        false,
        true
    );
}
add_action( 'wp_enqueue_scripts', 'erd_enqueue_scripts_v2' );

// Enqueue admin scripts and styles.
function erd_admin_enqueue_scripts_v2( $hook ) {
    if ( 'settings_page_erd-settings' !== $hook ) {
        return;
    }
    // Enqueue color picker.
    wp_enqueue_style( 'wp-color-picker' );
    wp_enqueue_script( 'wp-color-picker' );

    // Enqueue custom admin scripts.
    wp_enqueue_script(
        'erd-admin-js',
        ERD_PLUGIN_URL . 'admin/admin.js',
        array( 'jquery', 'wp-color-picker' ),
        false,
        true
    );
}
add_action( 'admin_enqueue_scripts', 'erd_admin_enqueue_scripts_v2' );

// Shortcode to display the countdown timer.
function erd_display_timer_shortcode_v2() {
    ob_start();

    $settings = erd_get_settings_v2();
    include ERD_PLUGIN_DIR . 'public/shortcode-output.php';

    return ob_get_clean();
}
add_shortcode( 'relay_doubles_league_timer', 'erd_display_timer_shortcode_v2' );
