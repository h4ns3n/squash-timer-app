<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$settings = get_option('erd_settings', array());
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

<script type="text/javascript">
    var erdTimerSettings = {
        warmupTime: <?php echo esc_js($settings['warmup_time'] ?? 5); ?>,
        matchTime: <?php echo esc_js($settings['match_time'] ?? 85); ?>,
        breakTime: <?php echo esc_js($settings['break_time'] ?? 5); ?>
    };
</script>

<?php
// Match schedule section removed for now
?>