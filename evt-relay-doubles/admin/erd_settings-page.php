<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

function erd_render_settings_page() {
    ?>
    <div class="wrap">
        <h1><?php esc_html_e('Relay Doubles Timer Settings', 'erdct-textdomain'); ?></h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('erd_settings_group');
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

            <?php submit_button(); ?>
        </form>
    </div>
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