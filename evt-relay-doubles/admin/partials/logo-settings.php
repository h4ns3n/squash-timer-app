<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Renders the logo settings section of the admin page.
 *
 * @param array $settings The current plugin settings.
 */
function erd_render_logo_settings($settings) {
    ?>
    <h2><?php esc_html_e('Logo Upload', 'erdct-textdomain'); ?></h2>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data">
        <input type="hidden" name="action" value="erdct_upload_logo" />
        <?php wp_nonce_field('erdct_upload_logo_nonce', 'erdct_upload_logo_nonce_field'); ?>

        <table class="form-table">
            <tr valign="top">
                <th scope="row"><?php esc_html_e('Logo', 'erdct-textdomain'); ?></th>
                <td>
                    <input type="file" name="erdct_logo" accept="image/*" />
                    <?php if (!empty($settings['logo'])): ?>
                        <div class="logo-preview">
                            <?php echo wp_get_attachment_image($settings['logo'], 'medium'); ?>
                        </div>
                    <?php endif; ?>
                </td>
            </tr>
        </table>

        <?php submit_button(__('Save Logo', 'erdct-textdomain')); ?>
    </form>
    <?php
}