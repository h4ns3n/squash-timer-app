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

<?php
// Match schedule section removed for now
?>