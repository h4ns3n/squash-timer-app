<?php
if (!defined('ABSPATH')) {
    exit;
}

function erd_render_timer_settings($settings) {
    ?>
    <h2><?php esc_html_e('Timer Settings', 'erdct-textdomain'); ?></h2>
    <table class="form-table">
        <!-- Singles Match Settings -->
        <tr valign="top">
            <th scope="row"><?php esc_html_e('Singles Match Duration', 'erdct-textdomain'); ?></th>
            <td>
                <label>
                    <?php esc_html_e('Warmup:', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[singles_warmup_minutes]"
                           value="<?php echo esc_attr(isset($settings['singles_warmup_minutes']) ? $settings['singles_warmup_minutes'] : '5'); ?>"
                           min="0"
                           max="60"
                           style="width: 60px;"> <?php esc_html_e('minutes', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[singles_warmup_seconds]"
                           value="<?php echo esc_attr(isset($settings['singles_warmup_seconds']) ? $settings['singles_warmup_seconds'] : '0'); ?>"
                           min="0"
                           max="59"
                           style="width: 60px;"> <?php esc_html_e('seconds', 'erdct-textdomain'); ?>
                </label>
                <br>
                <label>
                    <?php esc_html_e('Match:', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[singles_match_minutes]"
                           value="<?php echo esc_attr(isset($settings['singles_match_minutes']) ? $settings['singles_match_minutes'] : '15'); ?>"
                           min="0"
                           max="60"
                           style="width: 60px;"> <?php esc_html_e('minutes', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[singles_match_seconds]"
                           value="<?php echo esc_attr(isset($settings['singles_match_seconds']) ? $settings['singles_match_seconds'] : '0'); ?>"
                           min="0"
                           max="59"
                           style="width: 60px;"> <?php esc_html_e('seconds', 'erdct-textdomain'); ?>
                </label>
            </td>
        </tr>

        <!-- Doubles Match Settings -->
        <tr valign="top">
            <th scope="row"><?php esc_html_e('Doubles Match Duration', 'erdct-textdomain'); ?></th>
            <td>
                <label>
                    <?php esc_html_e('Warmup:', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[doubles_warmup_minutes]"
                           value="<?php echo esc_attr(isset($settings['doubles_warmup_minutes']) ? $settings['doubles_warmup_minutes'] : '5'); ?>"
                           min="0"
                           max="60"
                           style="width: 60px;"> <?php esc_html_e('minutes', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[doubles_warmup_seconds]"
                           value="<?php echo esc_attr(isset($settings['doubles_warmup_seconds']) ? $settings['doubles_warmup_seconds'] : '0'); ?>"
                           min="0"
                           max="59"
                           style="width: 60px;"> <?php esc_html_e('seconds', 'erdct-textdomain'); ?>
                </label>
                <br>
                <label>
                    <?php esc_html_e('Match:', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[doubles_match_minutes]"
                           value="<?php echo esc_attr(isset($settings['doubles_match_minutes']) ? $settings['doubles_match_minutes'] : '15'); ?>"
                           min="0"
                           max="60"
                           style="width: 60px;"> <?php esc_html_e('minutes', 'erdct-textdomain'); ?>
                    <input type="number"
                           name="erd_settings[doubles_match_seconds]"
                           value="<?php echo esc_attr(isset($settings['doubles_match_seconds']) ? $settings['doubles_match_seconds'] : '0'); ?>"
                           min="0"
                           max="59"
                           style="width: 60px;"> <?php esc_html_e('seconds', 'erdct-textdomain'); ?>
                </label>
            </td>
        </tr>
    </table>
    <?php
}