<?php
if (!defined('ABSPATH')) {
    exit;
}

function erd_render_appearance_settings($settings) {
    $font_sizes = isset($settings['font_sizes']) ? $settings['font_sizes'] : array();
    $colors = isset($settings['colors']) ? $settings['colors'] : array();
    ?>
    <h2><?php esc_html_e('Appearance Settings', 'erdct-textdomain'); ?></h2>
    <table class="form-table">
        <!-- Font Sizes -->
        <tr valign="top">
            <th scope="row"><?php esc_html_e('Font Sizes', 'erdct-textdomain'); ?></th>
            <td>
                <label>
                    <?php esc_html_e('Timer Display:', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[font_sizes][timer]"
                           value="<?php echo esc_attr(isset($font_sizes['timer']) ? $font_sizes['timer'] : '48'); ?>"
                           min="12"
                           max="96"> px
                </label>
                <br>
                <label>
                    <?php esc_html_e('Court Label:', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[font_sizes][court_label]"
                           value="<?php echo esc_attr(isset($font_sizes['court_label']) ? $font_sizes['court_label'] : '24'); ?>"
                           min="12"
                           max="48"> px
                </label>
                <br>
                <label>
                    <?php esc_html_e('Team Name:', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[font_sizes][team_name]"
                           value="<?php echo esc_attr(isset($font_sizes['team_name']) ? $font_sizes['team_name'] : '18'); ?>"
                           min="12"
                           max="36"> px
                </label>
                <br>
                <label>
                    <?php esc_html_e('Player Description:', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[font_sizes][player_desc]"
                           value="<?php echo esc_attr(isset($font_sizes['player_desc']) ? $font_sizes['player_desc'] : '18'); ?>"
                           min="12"
                           max="36"> px
                </label>
                <br>
                <label>
                    <?php esc_html_e('Player Name:', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[font_sizes][player_name]"
                           value="<?php echo esc_attr(isset($font_sizes['player_name']) ? $font_sizes['player_name'] : '18'); ?>"
                           min="12"
                           max="36"> px
                </label>
            </td>
        </tr>

        <!-- Colors -->
        <tr valign="top">
            <th scope="row"><?php esc_html_e('Colors', 'erdct-textdomain'); ?></th>
            <td>
                <label>
                    <?php esc_html_e('Timer Display:', 'erdct-textdomain'); ?>
                    <input type="text"
                           class="erd-color-picker"
                           name="erd_settings[colors][timer]"
                           value="<?php echo esc_attr(isset($colors['timer']) ? $colors['timer'] : '#000000'); ?>">
                </label>
                <br>
                <label>
                    <?php esc_html_e('Court Label:', 'erdct-textdomain'); ?>
                    <input type="text"
                           class="erd-color-picker"
                           name="erd_settings[colors][court_label]"
                           value="<?php echo esc_attr(isset($colors['court_label']) ? $colors['court_label'] : '#000000'); ?>">
                </label>
                <br>
                <label>
                    <?php esc_html_e('Team Name:', 'erdct-textdomain'); ?>
                    <input type="text"
                           class="erd-color-picker"
                           name="erd_settings[colors][team_name]"
                           value="<?php echo esc_attr(isset($colors['team_name']) ? $colors['team_name'] : '#000000'); ?>">
                </label>
                <br>
                <label>
                    <?php esc_html_e('Player Description:', 'erdct-textdomain'); ?>
                    <input type="text"
                           class="erd-color-picker"
                           name="erd_settings[colors][player_desc]"
                           value="<?php echo esc_attr(isset($colors['player_desc']) ? $colors['player_desc'] : '#000000'); ?>">
                </label>
                <br>
                <label>
                    <?php esc_html_e('Player Name:', 'erdct-textdomain'); ?>
                    <input type="text"
                           class="erd-color-picker"
                           name="erd_settings[colors][player_name]"
                           value="<?php echo esc_attr(isset($colors['player_name']) ? $colors['player_name'] : '#000000'); ?>">
                </label>
            </td>
        </tr>
    </table>
    <?php
}