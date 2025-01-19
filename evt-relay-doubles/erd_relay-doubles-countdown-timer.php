<?php
/*
Plugin Name: Relay Doubles Countdown Timer
Description: Displays a countdown timer for the Evertsdal Relay squash matches.
Version: 1.0
Author: Paul Hansen
License: GPL2
Text Domain: evertsdal-relay-doubles-league
*/

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly.
}

// Define plugin constants.
define('ERD_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('ERD_PLUGIN_URL', plugin_dir_url(__FILE__));
define('ERD_VERSION', '1.0.0');

// Include necessary files.
require_once ERD_PLUGIN_DIR . 'includes/erd_helpers.php';
require_once ERD_PLUGIN_DIR . 'public/erd_match-details.php';

// Admin settings.
if (is_admin()) {
    require_once ERD_PLUGIN_DIR . 'admin/erd_settings-page.php';
}

// Enqueue scripts and styles.
function erd_enqueue_scripts() {
    wp_enqueue_style(
        'erd-frontend-css',
        ERD_PLUGIN_URL . 'public/css/erd_countdown-timer.css',
        array(),
        ERD_VERSION
    );

    $settings = get_option('erd_settings', array());
    $font_size = isset($settings['timer_font_size']) ? absint($settings['timer_font_size']) : 20;

    // Add inline style for font size
    wp_add_inline_style('erd-frontend-css', ":root { --timer-font-size: {$font_size}pt; }");

    wp_enqueue_script(
        'erd-frontend-js',
        ERD_PLUGIN_URL . 'public/js/erd_countdown-timer.js',
        array('jquery'),
        ERD_VERSION,
        true
    );

    wp_localize_script('erd-frontend-js', 'erdSettings', array(
        'startSoundUrl' => '',
        'endSoundUrl' => '',
        'volume' => 100
    ));
}
add_action('wp_enqueue_scripts', 'erd_enqueue_scripts');

// Shortcode to display the countdown timer.
function erd_display_timer_shortcode() {
    ob_start();

    $settings = get_option('erd_settings', array());
    include ERD_PLUGIN_DIR . 'public/erd_shortcode-output.php';

    return ob_get_clean();
}
add_shortcode('relay_doubles_league_timer', 'erd_display_timer_shortcode');
