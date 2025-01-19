<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Displays the match details for the current match
 *
 * @param array $settings Plugin settings
 * @param int $current_match Current match number
 */
function erd_display_match_details($settings, $current_match) {
    if (!isset($settings['match_schedule']) || !isset($settings['match_schedule'][$current_match])) {
        return;
    }

    $match = $settings['match_schedule'][$current_match];
    $font_sizes = isset($settings['font_sizes']) ? $settings['font_sizes'] : array();
    $colors = isset($settings['colors']) ? $settings['colors'] : array();
    ?>
    <div class="erd-match-details">
        <h3 style="font-size: <?php echo isset($font_sizes['match_title']) ? esc_attr($font_sizes['match_title']) . 'px' : '24px'; ?>;
                   color: <?php echo isset($colors['match_title']) ? esc_attr($colors['match_title']) : '#000000'; ?>;">
            <?php echo esc_html(sprintf(__('Match %d', 'erdct-textdomain'), $current_match)); ?>
        </h3>

        <?php if (isset($match['description'])): ?>
            <p class="erd-match-description" style="font-size: <?php echo isset($font_sizes['match_desc']) ? esc_attr($font_sizes['match_desc']) . 'px' : '18px'; ?>;
                                                   color: <?php echo isset($colors['match_desc']) ? esc_attr($colors['match_desc']) : '#000000'; ?>;">
                <?php echo esc_html($match['description']); ?>
            </p>
        <?php endif; ?>

        <?php if (isset($match['courts']) && is_array($match['courts'])): ?>
            <div class="erd-courts">
                <?php foreach ($match['courts'] as $court_number => $court): ?>
                    <div class="erd-court">
                        <h4 style="font-size: <?php echo isset($font_sizes['court_label']) ? esc_attr($font_sizes['court_label']) . 'px' : '20px'; ?>;
                                   color: <?php echo isset($colors['court_label']) ? esc_attr($colors['court_label']) : '#000000'; ?>;">
                            <?php echo esc_html(sprintf(__('Court %d', 'erdct-textdomain'), $court_number)); ?>
                        </h4>

                        <?php if (isset($court['team_name'])): ?>
                            <p class="erd-team-name" style="font-size: <?php echo isset($font_sizes['team_name']) ? esc_attr($font_sizes['team_name']) . 'px' : '18px'; ?>;
                                                         color: <?php echo isset($colors['team_name']) ? esc_attr($colors['team_name']) : '#000000'; ?>;">
                                <?php echo esc_html($court['team_name']); ?>
                            </p>
                        <?php endif; ?>

                        <?php if (isset($court['player_desc']) || isset($court['player_name'])): ?>
                            <p class="erd-player-info">
                                <?php if (isset($court['player_desc'])): ?>
                                    <span class="erd-player-desc" style="font-size: <?php echo isset($font_sizes['player_desc']) ? esc_attr($font_sizes['player_desc']) . 'px' : '16px'; ?>;
                                                                      color: <?php echo isset($colors['player_desc']) ? esc_attr($colors['player_desc']) : '#000000'; ?>;">
                                        <?php echo esc_html($court['player_desc']); ?>
                                    </span>
                                <?php endif; ?>

                                <?php if (isset($court['player_name'])): ?>
                                    <span class="erd-player-name" style="font-size: <?php echo isset($font_sizes['player_name']) ? esc_attr($font_sizes['player_name']) . 'px' : '16px'; ?>;
                                                                      color: <?php echo isset($colors['player_name']) ? esc_attr($colors['player_name']) : '#000000'; ?>;">
                                        <?php echo esc_html($court['player_name']); ?>
                                    </span>
                                <?php endif; ?>
                            </p>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
    <?php
}