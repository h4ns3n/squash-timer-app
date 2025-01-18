<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$settings = eflct_get_settings();

// Get settings values.
$font_sizes = isset( $settings['font_sizes'] ) ? $settings['font_sizes'] : array();
$colors = isset( $settings['colors'] ) ? $settings['colors'] : array();

$logo_url = isset( $settings['logo'] ) ? wp_get_attachment_url( $settings['logo'] ) : '';
$start_sound_url = isset( $settings['start_sound'] ) ? wp_get_attachment_url( $settings['start_sound'] ) : '';
$end_sound_url = isset( $settings['end_sound'] ) ? wp_get_attachment_url( $settings['end_sound'] ) : '';

// Fetch match schedule.
$match_schedule = isset( $settings['match_schedule'] ) ? $settings['match_schedule'] : array();

// Total number of matches
$total_matches = count( $match_schedule );

// Get timer settings
$singles_warmup_time = ( isset( $settings['singles_warmup_minutes'] ) ? absint( $settings['singles_warmup_minutes'] ) * 60 : 120 ) + ( isset( $settings['singles_warmup_seconds'] ) ? absint( $settings['singles_warmup_seconds'] ) : 0 );
$singles_match_time = ( isset( $settings['singles_match_minutes'] ) ? absint( $settings['singles_match_minutes'] ) * 60 : 1080 ) + ( isset( $settings['singles_match_seconds'] ) ? absint( $settings['singles_match_seconds'] ) : 0 );
$doubles_warmup_time = ( isset( $settings['doubles_warmup_minutes'] ) ? absint( $settings['doubles_warmup_minutes'] ) * 60 : 300 ) + ( isset( $settings['doubles_warmup_seconds'] ) ? absint( $settings['doubles_warmup_seconds'] ) : 0 );
$doubles_match_time = ( isset( $settings['doubles_match_minutes'] ) ? absint( $settings['doubles_match_minutes'] ) * 60 : 1800 ) + ( isset( $settings['doubles_match_seconds'] ) ? absint( $settings['doubles_match_seconds'] ) : 0 );

// Prepare match durations array
$match_durations = array();
for ( $i = 1; $i <= $total_matches; $i++ ) {
    $is_doubles = $i > 6;
    $warmup_duration = $is_doubles ? $doubles_warmup_time : $singles_warmup_time;
    $match_duration = $is_doubles ? $doubles_match_time : $singles_match_time;
    $match_durations[ $i ] = array(
        'warmup' => $warmup_duration,
        'match'  => $match_duration,
    );
}

// Start from specific match and time
$start_from_match = isset( $settings['start_from_match'] ) ? absint( $settings['start_from_match'] ) : 1;
$start_from_time = ( isset( $settings['start_from_minutes'] ) ? absint( $settings['start_from_minutes'] ) * 60 : 0 ) + ( isset( $settings['start_from_seconds'] ) ? absint( $settings['start_from_seconds'] ) : 0 );

// Determine starting phase and time left
$current_match_index = $start_from_match;
$current_match = isset( $match_schedule[ $current_match_index ] ) ? $match_schedule[ $current_match_index ] : null;

if ( ! $current_match ) {
    echo '<p>No match schedule available.</p>';
    return;
}

$is_doubles = $current_match_index > 6;
$warmup_duration = $match_durations[ $current_match_index ]['warmup'];
$match_duration = $match_durations[ $current_match_index ]['match'];

if ( $start_from_time <= $warmup_duration ) {
    $phase = 'warmup';
    $time_left = $warmup_duration - $start_from_time;
} else {
    $phase = 'match';
    $time_left = $match_duration - ( $start_from_time - $warmup_duration );
    if ( $time_left < 0 ) {
        $time_left = 0;
    }
}
?>
<div class="eflct-container">
    <?php if ( $logo_url ) : ?>
        <div class="eflct-logo">
            <img src="<?php echo esc_url( $logo_url ); ?>" alt="League Logo" />
        </div>
    <?php else : ?>
        <h1 class="eflct-league-title" style="font-size: <?php echo isset( $font_sizes['league_title'] ) ? esc_attr( $font_sizes['league_title'] ) . 'px' : '48px'; ?>; color: <?php echo isset( $colors['league_title'] ) ? esc_attr( $colors['league_title'] ) : '#000000'; ?>;">
            EVERTSDAL <span class="eflct-fantasy">RELAY DOUBLES</span> LEAGUE
        </h1>
    <?php endif; ?>

    <div class="eflct-main-timer" style="font-size: <?php echo isset( $font_sizes['timer'] ) ? esc_attr( $font_sizes['timer'] ) . 'px' : '72px'; ?>; color: <?php echo isset( $colors['timer'] ) ? esc_attr( $colors['timer'] ) : '#000000'; ?>;">
        <span id="eflct-timer-display">00:00</span>
    </div>

    <div class="eflct-match-number" style="font-size: <?php echo isset( $font_sizes['match_number'] ) ? esc_attr( $font_sizes['match_number'] ) . 'px' : '24px'; ?>; color: <?php echo isset( $colors['match_number'] ) ? esc_attr( $colors['match_number'] ) : '#000000'; ?>;">
        Match <span id="eflct-current-match-index"><?php echo $current_match_index; ?></span>
    </div>

    <!-- Start Timer Button -->
    <button id="eflct-start-button" style="font-size: 24px; padding: 10px 20px; margin-top: 20px;">Start Timer</button>

    <div id="eflct-match-details">
        <?php include 'match-details.php'; ?>
    </div>

    <!-- Audio Elements -->
    <?php if ( $start_sound_url ) : ?>
        <audio id="eflct-start-sound" src="<?php echo esc_url( $start_sound_url ); ?>"></audio>
    <?php endif; ?>
    <?php if ( $end_sound_url ) : ?>
        <audio id="eflct-end-sound" src="<?php echo esc_url( $end_sound_url ); ?>"></audio>
    <?php endif; ?>
</div>

<!-- Hidden inputs to pass data to JavaScript -->
<input type="hidden" id="eflct-total-matches" value="<?php echo esc_attr( $total_matches ); ?>" />
<input type="hidden" id="eflct-start-from-match" value="<?php echo esc_attr( $start_from_match ); ?>" />
<input type="hidden" id="eflct-start-from-time" value="<?php echo esc_attr( $start_from_time ); ?>" />

<!-- Pass PHP variables to JavaScript -->
<script>
var eflct_match_durations = <?php echo json_encode( $match_durations ); ?>;
var eflct_match_schedule = <?php echo json_encode( $match_schedule ); ?>;
var eflct_settings = <?php echo json_encode( array(
    'font_sizes' => $font_sizes,
    'colors'     => $colors,
) ); ?>;
</script>