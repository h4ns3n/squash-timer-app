<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$settings = get_option('erd_settings', array());

// Enqueue the countdown timer script
wp_enqueue_script('erd-countdown-timer');

// Pass all settings to JavaScript
wp_localize_script('erd-countdown-timer', 'erdTimerSettings', array(
    'warmupTime' => intval($settings['warmup_time'] ?? 5),
    'matchTime' => intval($settings['match_time'] ?? 85),
    'breakTime' => intval($settings['break_time'] ?? 5),
    'startTimeMinutes' => intval($settings['start_time_minutes'] ?? 0),
    'startTimeSeconds' => intval($settings['start_time_seconds'] ?? 0),
    'startSoundUrl' => !empty($settings['start_sound_id']) ? wp_get_attachment_url($settings['start_sound_id']) : '',
    'endSoundUrl' => !empty($settings['end_sound_id']) ? wp_get_attachment_url($settings['end_sound_id']) : '',
    'startSoundDuration' => intval($settings['start_sound_duration'] ?? 0),
    'endSoundDuration' => intval($settings['end_sound_duration'] ?? 0)
));
?>

<!-- Timer Elements -->
<div style="text-align: center;">
    <div id="erd-timer-message" style="
        font-size: <?php echo esc_attr($settings['message_font_size'] ?? 16); ?>pt;
        color: <?php echo esc_attr($settings['message_font_color'] ?? '#000000'); ?>;
        margin-bottom: <?php echo esc_attr($settings['label_timer_gap'] ?? 10); ?>px;">
    </div>
    <div id="erd-timer-display" style="
        font-size: <?php echo esc_attr($settings['timer_font_size'] ?? 20); ?>pt;
        color: <?php echo esc_attr($settings['timer_font_color'] ?? '#000000'); ?>;">
        00:00
    </div>
    <button id="erd-start-button">Start Timer</button>
</div>
<div id="erd-current-match-index"></div>
<div id="erd-match-details"></div>

<?php
// Match schedule section removed for now
?>