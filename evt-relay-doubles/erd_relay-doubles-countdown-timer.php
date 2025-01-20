<?php
/*
Plugin Name: Relay Doubles Countdown Timer
Description: Displays a countdown timer for the Evertsdal Relay squash matches.
Version: 1.1
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
define('ERD_VERSION', '1.1.0');

// Include necessary files.
require_once ERD_PLUGIN_DIR . 'includes/erd_helpers.php';
require_once ERD_PLUGIN_DIR . 'public/erd_match-details.php';

// Admin settings.
if (is_admin()) {
    require_once ERD_PLUGIN_DIR . 'admin/erd_settings-page.php';
}

// Enqueue scripts and styles.
function erd_enqueue_scripts() {
    wp_enqueue_style('erd-countdown-timer', plugins_url('public/css/erd_countdown-timer.css', __FILE__));

    wp_register_script(
        'erd-countdown-timer',
        plugins_url('public/js/erd_countdown-timer.js', __FILE__),
        array('jquery'),
        '1.1.0',
        true
    );
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
