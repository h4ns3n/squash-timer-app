<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$settings = get_option('erd_settings', array());
?>

<!-- Timer Elements -->
<div id="erd-timer-display">00:00</div>
<button id="erd-start-button">Start Timer</button>
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