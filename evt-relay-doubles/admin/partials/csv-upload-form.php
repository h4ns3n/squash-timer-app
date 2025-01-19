<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Renders the CSV upload form.
 */
function erd_render_csv_upload_form() {
    ?>
    <h2><?php esc_html_e('Upload CSV to Populate Match Schedule', 'erdct-textdomain'); ?></h2>
    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data">
        <input type="hidden" name="action" value="erdct_upload_csv" />
        <?php wp_nonce_field('erdct_upload_csv_nonce', 'erdct_upload_csv_nonce_field'); ?>

        <table class="form-table">
            <tr valign="top">
                <th scope="row"><?php esc_html_e('CSV File', 'erdct-textdomain'); ?></th>
                <td>
                    <input type="file" name="match_schedule_csv" accept=".csv" required />
                    <p class="description">
                        <?php esc_html_e('Upload a CSV file to populate the match schedule. This will overwrite the current schedule.', 'erdct-textdomain'); ?>
                    </p>
                    <p class="description">
                        <?php esc_html_e('CSV Format: Match Description, Court 1 Team, Court 1 Player Description, Court 1 Player Name, Court 2...', 'erdct-textdomain'); ?>
                    </p>
                </td>
            </tr>
        </table>

        <?php submit_button(__('Upload CSV', 'erdct-textdomain'), 'primary', 'submit', false); ?>
    </form>
    <?php
}