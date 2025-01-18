<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// $current_match_index and $match_schedule should be available in scope
$current_match = isset( $match_schedule[ $current_match_index ] ) ? $match_schedule[ $current_match_index ] : null;

if ( ! $current_match ) {
    echo '<p>No match schedule available.</p>';
    return;
}
?>
<div class="erd-courts">
    <?php for ( $court = 1; $court <= 4; $court++ ) :
        $court_info = isset( $current_match['court'][ $court ] ) ? $current_match['court'][ $court ] : array();
        $team_name = isset( $court_info['team_name'] ) ? $court_info['team_name'] : '';
        $player_desc = isset( $court_info['player_desc'] ) ? $court_info['player_desc'] : '';
        $player_name = isset( $court_info['player_name'] ) ? $court_info['player_name'] : '';
        ?>
        <div class="erd-court">
            <h2 style="font-size: <?php echo isset( $font_sizes['court_label'] ) ? esc_attr( $font_sizes['court_label'] ) . 'px' : '24px'; ?>; color: <?php echo isset( $colors['court_label'] ) ? esc_attr( $colors['court_label'] ) : '#000000'; ?>;">Court <?php echo $court; ?></h2>
            <p class="erd-team-name" style="font-size: <?php echo isset( $font_sizes['team_name'] ) ? esc_attr( $font_sizes['team_name'] ) . 'px' : '18px'; ?>; color: <?php echo isset( $colors['team_name'] ) ? esc_attr( $colors['team_name'] ) : '#000000'; ?>;"><?php echo esc_html( $team_name ); ?></p>
            <p class="erd-player-desc" style="font-size: <?php echo isset( $font_sizes['player_desc'] ) ? esc_attr( $font_sizes['player_desc'] ) . 'px' : '18px'; ?>; color: <?php echo isset( $colors['player_desc'] ) ? esc_attr( $colors['player_desc'] ) : '#000000'; ?>;"><?php echo esc_html( $player_desc ); ?></p>
            <p class="erd-player-name" style="font-size: <?php echo isset( $font_sizes['player_name'] ) ? esc_attr( $font_sizes['player_name'] ) . 'px' : '18px'; ?>; color: <?php echo isset( $colors['player_name'] ) ? esc_attr( $colors['player_name'] ) : '#000000'; ?>;"><?php echo esc_html( $player_name ); ?></p>
        </div>
    <?php endfor; ?>
</div>
