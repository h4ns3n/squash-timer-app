<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

include_once 'partials/audio-settings.php';

function erd_render_settings_page() {
    ?>
    <div class="wrap">
        <h1><?php esc_html_e('Relay Doubles Timer Settings', 'erdct-textdomain'); ?></h1>

        <!-- Warning Banner -->
        <div style="background-color: #ffcc00; padding: 10px; margin-bottom: 20px;">
            <strong><?php esc_html_e('Warning:', 'erdct-textdomain'); ?></strong>
            <?php esc_html_e('The start time is set if Start Time (minutes) or Start Time (seconds) is set to any value other than 0 or null.', 'erdct-textdomain'); ?>
        </div>

        <form method="post"
              action="options.php"
              enctype="multipart/form-data"
              id="erd-settings-form">
            <?php
            settings_fields('erd_settings_group');
            do_settings_sections('erd_settings_group');
            $settings = get_option('erd_settings', array());
            ?>

            <h2><?php esc_html_e('Timer Display Settings', 'erdct-textdomain'); ?></h2>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row"><?php esc_html_e('Timer Font Size (pt)', 'erdct-textdomain'); ?></th>
                    <td>
                        <input type="number" name="erd_settings[timer_font_size]" value="<?php echo esc_attr($settings['timer_font_size'] ?? 20); ?>" min="10" max="200" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e('Timer Font Color', 'erdct-textdomain'); ?></th>
                    <td>
                        <input type="text" name="erd_settings[timer_font_color]" value="<?php echo esc_attr($settings['timer_font_color'] ?? '#000000'); ?>" class="erd-color-picker" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e('Message Font Size (pt)', 'erdct-textdomain'); ?></th>
                    <td>
                        <input type="number" name="erd_settings[message_font_size]" value="<?php echo esc_attr($settings['message_font_size'] ?? 16); ?>" min="10" max="100" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e('Message Font Color', 'erdct-textdomain'); ?></th>
                    <td>
                        <input type="text" name="erd_settings[message_font_color]" value="<?php echo esc_attr($settings['message_font_color'] ?? '#000000'); ?>" class="erd-color-picker" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e('Gap Between Label and Timer (px)', 'erdct-textdomain'); ?></th>
                    <td>
                        <input type="number" name="erd_settings[label_timer_gap]" value="<?php echo esc_attr($settings['label_timer_gap'] ?? 10); ?>" min="-50" max="50" />
                    </td>
                </tr>
            </table>

            <h2><?php esc_html_e('Timer Settings', 'erdct-textdomain'); ?></h2>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row"><?php esc_html_e('Warm-up Time (minutes)', 'erdct-textdomain'); ?></th>
                    <td>
                        <input type="number" name="erd_settings[warmup_time]" value="<?php echo esc_attr($settings['warmup_time'] ?? 5); ?>" min="1" max="60" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e('Match Time (minutes)', 'erdct-textdomain'); ?></th>
                    <td>
                        <input type="number" name="erd_settings[match_time]" value="<?php echo esc_attr($settings['match_time'] ?? 85); ?>" min="1" max="120" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e('Break Time (minutes)', 'erdct-textdomain'); ?></th>
                    <td>
                        <input type="number" name="erd_settings[break_time]" value="<?php echo esc_attr($settings['break_time'] ?? 5); ?>" min="1" max="60" />
                    </td>
                </tr>
            </table>

            <h2><?php esc_html_e('Emergency Timer Restart', 'erdct-textdomain'); ?></h2>
            <p><?php esc_html_e('Set the start time in minutes and seconds to resume the timer from a specific point in case of disruption.', 'erdct-textdomain'); ?></p>
            <table class="form-table">
                <tr valign="top">
                    <th scope="row"><?php esc_html_e('Start Time (minutes)', 'erdct-textdomain'); ?></th>
                    <td>
                        <input type="number" name="erd_settings[start_time_minutes]" value="<?php echo esc_attr($settings['start_time_minutes'] ?? 0); ?>" min="0" max="120" />
                    </td>
                </tr>
                <tr valign="top">
                    <th scope="row"><?php esc_html_e('Start Time (seconds)', 'erdct-textdomain'); ?></th>
                    <td>
                        <input type="number" name="erd_settings[start_time_seconds]" value="<?php echo esc_attr($settings['start_time_seconds'] ?? 0); ?>" min="0" max="59" />
                    </td>
                </tr>
            </table>

            <?php erd_render_audio_settings($settings); ?>

            <?php submit_button(); ?>
        </form>
    </div>
    <?php include 'partials/color-picker-settings.php'; ?>
    <?php
}

function erd_register_settings() {
    register_setting('erd_settings_group', 'erd_settings');
}

add_action('admin_init', 'erd_register_settings');

function erd_add_settings_page() {
    add_options_page(
        __('Relay Doubles Timer Settings', 'erdct-textdomain'), // Page title
        __('Relay Doubles Timer', 'erdct-textdomain'),           // Menu title
        'manage_options',                                        // Capability
        'erd-settings',                                          // Menu slug
        'erd_render_settings_page'                               // Callback function
    );
}

add_action('admin_menu', 'erd_add_settings_page');
?>