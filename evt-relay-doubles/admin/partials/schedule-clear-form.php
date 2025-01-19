<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Renders the form for clearing the match schedule.
 */
function erd_render_schedule_clear_form() {
    ?>
    <div class="erd-clear-schedule-section">
        <h2><?php esc_html_e('Clear Existing Schedule', 'erdct-textdomain'); ?></h2>
        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
            <input type="hidden" name="action" value="erdct_clear_schedule" />
            <?php wp_nonce_field('erdct_clear_schedule_nonce', 'erdct_clear_schedule_nonce_field'); ?>

            <div class="notice notice-warning">
                <p><strong><?php esc_html_e('Warning:', 'erdct-textdomain'); ?></strong>
                <?php esc_html_e('This action will permanently remove all matches from the schedule.', 'erdct-textdomain'); ?></p>
            </div>

            <label>
                <input type="checkbox"
                       name="erd_settings[clear_schedule]"
                       value="1"
                       required
                       onclick="document.getElementById('clear-schedule-submit').disabled = !this.checked">
                <?php esc_html_e('I understand this will delete all matches', 'erdct-textdomain'); ?>
            </label>

            <?php submit_button(
                __('Clear Schedule', 'erdct-textdomain'),
                'delete',
                'clear-schedule-submit',
                false,
                array('disabled' => 'disabled')
            ); ?>
        </form>
    </div>
    <?php
}