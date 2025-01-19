<?php
if (!defined('ABSPATH')) {
    exit;
}

function erd_render_match_schedule($settings) {
    $match_schedule = isset($settings['match_schedule']) ? $settings['match_schedule'] : array();
    ?>
    <h2><?php esc_html_e('Match Schedule', 'erdct-textdomain'); ?></h2>

    <!-- Add New Match Form -->
    <div class="erd-add-match-form">
        <h3><?php esc_html_e('Add New Match', 'erdct-textdomain'); ?></h3>
        <table class="form-table">
            <tr valign="top">
                <th scope="row"><?php esc_html_e('Match Number', 'erdct-textdomain'); ?></th>
                <td>
                    <input type="number" id="erd-new-match-number" name="erdct_new_match_number" min="1" required>
                </td>
            </tr>
            <tr valign="top">
                <th scope="row"><?php esc_html_e('Match Description', 'erdct-textdomain'); ?></th>
                <td>
                    <input type="text" id="erd-new-match-description" name="erdct_new_match_description" class="regular-text" required>
                </td>
            </tr>
            <!-- Court Details -->
            <?php for ($court = 1; $court <= 4; $court++): ?>
                <tr valign="top" class="court-details">
                    <th scope="row"><?php echo sprintf(__('Court %d', 'erdct-textdomain'), $court); ?></th>
                    <td>
                        <input type="text"
                               id="erd-new-court-<?php echo $court; ?>-team"
                               name="erdct_new_court[<?php echo $court; ?>][team_name]"
                               class="regular-text"
                               placeholder="Team Name">
                        <br>
                        <input type="text"
                               id="erd-new-court-<?php echo $court; ?>-desc"
                               name="erdct_new_court[<?php echo $court; ?>][player_desc]"
                               class="regular-text"
                               placeholder="Player Description">
                        <br>
                        <input type="text"
                               id="erd-new-court-<?php echo $court; ?>-name"
                               name="erdct_new_court[<?php echo $court; ?>][player_name]"
                               class="regular-text"
                               placeholder="Player Name">
                    </td>
                </tr>
            <?php endfor; ?>
        </table>
        <button type="button" id="erd-add-match" class="button button-secondary">
            <?php esc_html_e('Add Match', 'erdct-textdomain'); ?>
        </button>
    </div>

    <!-- Existing Matches -->
    <div class="erd-match-schedule-list">
        <h3><?php esc_html_e('Existing Matches', 'erdct-textdomain'); ?></h3>
        <table class="wp-list-table widefat fixed striped" id="erd-match-schedule">
            <thead>
                <tr>
                    <th><?php esc_html_e('Match #', 'erdct-textdomain'); ?></th>
                    <th><?php esc_html_e('Description', 'erdct-textdomain'); ?></th>
                    <th><?php esc_html_e('Courts', 'erdct-textdomain'); ?></th>
                    <th><?php esc_html_e('Actions', 'erdct-textdomain'); ?></th>
                </tr>
            </thead>
            <tbody>
                <?php
                if (!empty($match_schedule)) {
                    foreach ($match_schedule as $match_number => $match) {
                        ?>
                        <tr class="erd-match-row" data-match-number="<?php echo esc_attr($match_number); ?>">
                            <td><?php echo esc_html($match_number); ?></td>
                            <td>
                                <span class="erd-match-display"><?php echo esc_html($match['description']); ?></span>
                                <div class="erd-match-edit" style="display: none;">
                                    <input type="text" class="erd-match-description" value="<?php echo esc_attr($match['description']); ?>">
                                    <?php for ($court = 1; $court <= 4; $court++): ?>
                                        <div class="erd-court-data" data-court-number="<?php echo $court; ?>">
                                            <h4><?php echo sprintf(__('Court %d', 'erdct-textdomain'), $court); ?></h4>
                                            <input type="text"
                                                   class="erd-team-name"
                                                   value="<?php echo esc_attr(isset($match['courts'][$court]['team_name']) ? $match['courts'][$court]['team_name'] : ''); ?>"
                                                   placeholder="Team Name">
                                            <input type="text"
                                                   class="erd-player-desc"
                                                   value="<?php echo esc_attr(isset($match['courts'][$court]['player_desc']) ? $match['courts'][$court]['player_desc'] : ''); ?>"
                                                   placeholder="Player Description">
                                            <input type="text"
                                                   class="erd-player-name"
                                                   value="<?php echo esc_attr(isset($match['courts'][$court]['player_name']) ? $match['courts'][$court]['player_name'] : ''); ?>"
                                                   placeholder="Player Name">
                                        </div>
                                    <?php endfor; ?>
                                    <button type="button" class="button erd-save-match"><?php esc_html_e('Save', 'erdct-textdomain'); ?></button>
                                    <button type="button" class="button erd-cancel-edit"><?php esc_html_e('Cancel', 'erdct-textdomain'); ?></button>
                                </div>
                            </td>
                            <td>
                                <?php
                                if (isset($match['courts'])) {
                                    foreach ($match['courts'] as $court_number => $court) {
                                        echo sprintf(
                                            '<div>Court %d: %s - %s (%s)</div>',
                                            esc_html($court_number),
                                            esc_html($court['team_name']),
                                            esc_html($court['player_desc']),
                                            esc_html($court['player_name'])
                                        );
                                    }
                                }
                                ?>
                            </td>
                            <td>
                                <button type="button" class="button button-small erd-edit-match">
                                    <?php esc_html_e('Edit', 'erdct-textdomain'); ?>
                                </button>
                                <button type="button" class="button button-small button-link-delete erd-delete-match">
                                    <?php esc_html_e('Delete', 'erdct-textdomain'); ?>
                                </button>
                            </td>
                        </tr>
                        <?php
                    }
                } else {
                    ?>
                    <tr>
                        <td colspan="4"><?php esc_html_e('No matches scheduled yet.', 'erdct-textdomain'); ?></td>
                    </tr>
                    <?php
                }
                ?>
            </tbody>
        </table>
    </div>
    <?php
}