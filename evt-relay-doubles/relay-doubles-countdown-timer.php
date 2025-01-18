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
define( 'EFLCT_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'EFLCT_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Include necessary files.
require_once EFLCT_PLUGIN_DIR . 'includes/helpers.php';

// Admin settings.
if ( is_admin() ) {
    require_once EFLCT_PLUGIN_DIR . 'admin/settings-page.php';
}

// Enqueue scripts and styles.
function eflct_enqueue_scripts() {
    wp_enqueue_style(
        'eflct-frontend-css',
        EFLCT_PLUGIN_URL . 'public/css/countdown-timer.css'
    );
    wp_enqueue_script(
        'eflct-frontend-js',
        EFLCT_PLUGIN_URL . 'public/js/countdown-timer.js',
        array( 'jquery' ),
        false,
        true
    );
}
add_action( 'wp_enqueue_scripts', 'eflct_enqueue_scripts' );

// Enqueue admin scripts and styles.
function eflct_admin_enqueue_scripts( $hook ) {
    if ( 'settings_page_eflct-settings' !== $hook ) {
        return;
    }
    // Enqueue color picker.
    wp_enqueue_style( 'wp-color-picker' );
    wp_enqueue_script( 'wp-color-picker' );

    // Enqueue custom admin scripts.
    wp_enqueue_script(
        'eflct-admin-js',
        EFLCT_PLUGIN_URL . 'admin/admin.js',
        array( 'jquery', 'wp-color-picker' ),
        false,
        true
    );
}
add_action( 'admin_enqueue_scripts', 'eflct_admin_enqueue_scripts' );

// Shortcode to display the countdown timer.
function eflct_display_timer_shortcode() {
    ob_start();

    $settings = eflct_get_settings();
    include EFLCT_PLUGIN_DIR . 'public/shortcode-output.php';

    return ob_get_clean();
}
add_shortcode( 'relay_doubles_league_timer', 'eflct_display_timer_shortcode' );