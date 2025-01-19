<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Renders the audio settings section of the admin page.
 *
 * @param array $settings The current plugin settings.
 */
function erd_render_audio_settings($settings) {
    ?>
    <h2><?php esc_html_e('Audio Settings', 'erdct-textdomain'); ?></h2>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data">
        <input type="hidden" name="action" value="erdct_upload_audio" />
        <?php wp_nonce_field('erdct_upload_audio_nonce', 'erdct_upload_audio_nonce_field'); ?>

        <table class="form-table">
            <!-- Start Sound -->
            <tr valign="top">
                <th scope="row"><?php esc_html_e('Start Sound', 'erdct-textdomain'); ?></th>
                <td>
                    <input type="file" name="erdct_start_sound" accept="audio/*" />
                    <?php if (!empty($settings['start_sound'])): ?>
                        <div class="audio-preview">
                            <audio controls>
                                <source src="<?php echo esc_url(wp_get_attachment_url($settings['start_sound'])); ?>" type="audio/mpeg">
                            </audio>
                        </div>
                    <?php endif; ?>
                </td>
            </tr>

            <!-- End Sound -->
            <tr valign="top">
                <th scope="row"><?php esc_html_e('End Sound', 'erdct-textdomain'); ?></th>
                <td>
                    <input type="file" name="erdct_end_sound" accept="audio/*" />
                    <?php if (!empty($settings['end_sound'])): ?>
                        <div class="audio-preview">
                            <audio controls>
                                <source src="<?php echo esc_url(wp_get_attachment_url($settings['end_sound'])); ?>" type="audio/mpeg">
                            </audio>
                        </div>
                    <?php endif; ?>
                </td>
            </tr>

            <!-- Volume -->
            <tr valign="top">
                <th scope="row"><?php esc_html_e('Sound Volume', 'erdct-textdomain'); ?></th>
                <td>
                    <input type="range"
                           class="erd-volume-slider"
                           name="erd_settings[volume]"
                           min="0"
                           max="100"
                           value="<?php echo esc_attr(isset($settings['volume']) ? $settings['volume'] : '100'); ?>">
                    <span class="erd-volume-value"><?php echo esc_html(isset($settings['volume']) ? $settings['volume'] : '100'); ?>%</span>
                </td>
            </tr>
        </table>

        <?php submit_button(__('Save Audio Settings', 'erdct-textdomain')); ?>
    </form>
    <?php
}