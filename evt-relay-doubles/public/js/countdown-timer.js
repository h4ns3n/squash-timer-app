jQuery(document).ready(function ($) {
    // Parse initial values with default fallbacks
    var totalMatches = parseInt($('#erd-total-matches').val()) || 0;
    var currentMatchIndex = parseInt($('#erd-start-from-match').val()) || 1;
    var startFromTime = parseInt($('#erd-start-from-time').val()) || 0;
    var matchDurations = erd_match_durations;
    var matchSchedule = erd_match_schedule;

    var phase = 'warmup'; // 'warmup' or 'match'
    var timeLeft;
    var warmupDuration;
    var matchDuration;

    // Flag to ensure the warning sound plays only once per match
    var warningSoundPlayed = false;

    var timerDisplay = $('#erd-timer-display');
    var matchNumberDisplay = $('#erd-current-match-index');

    // Audio elements
    var startSound = document.getElementById('erd-start-sound');
    var endSound = document.getElementById('erd-end-sound');

    // Timer interval variable
    var countdownInterval;

    // Function to format time as MM:SS
    function formatTime(seconds) {
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    // Initialize match settings
    function initializeMatch() {
        if (currentMatchIndex > totalMatches) {
            // All matches completed
            timerDisplay.text('00:00');
            $('#erd-match-details').html('<p>All matches are complete.</p>');
            return;
        }

        // Validate match data
        if (!matchDurations[currentMatchIndex] || !matchSchedule[currentMatchIndex]) {
            console.error(`Missing data for match index ${currentMatchIndex}`);
            timerDisplay.text('00:00');
            $('#erd-match-details').html('<p>Error loading match details.</p>');
            return;
        }

        warmupDuration = matchDurations[currentMatchIndex]['warmup'];
        matchDuration = matchDurations[currentMatchIndex]['match'];

        // Determine starting phase and time left
        if (startFromTime <= warmupDuration) {
            phase = 'warmup';
            timeLeft = warmupDuration - startFromTime;
        } else {
            phase = 'match';
            timeLeft = matchDuration - (startFromTime - warmupDuration);
            if (timeLeft < 0) {
                timeLeft = 0;
            }
        }

        // Reset the warning sound flag for the new match
        warningSoundPlayed = false;

        // Update match number display
        matchNumberDisplay.text(currentMatchIndex);

        // Update match details
        updateMatchDetails();

        // Update the timer display initially
        timerDisplay.text(formatTime(timeLeft));

        // Start the countdown
        startTimer();
    }

    // Update match details
    function updateMatchDetails() {
        var currentMatch = matchSchedule[currentMatchIndex];
        var html = '';

        html += '<div class="erd-courts">';
        for (var court = 1; court <= 4; court++) {
            var courtInfo = currentMatch['court'][court] || {};
            var teamName = courtInfo['team_name'] || '';
            var playerDesc = courtInfo['player_desc'] || '';
            var playerName = courtInfo['player_name'] || '';

            html += '<div class="erd-court">';
            html += '<h2 style="font-size: ' + (erd_settings.font_sizes.court_label || '24') + 'px; color: ' + (erd_settings.colors.court_label || '#000000') + ';">Court ' + court + '</h2>';
            html += '<p class="erd-team-name" style="font-size: ' + (erd_settings.font_sizes.team_name || '18') + 'px; color: ' + (erd_settings.colors.team_name || '#000000') + ';">' + teamName + '</p>';
            html += '<p class="erd-player-desc" style="font-size: ' + (erd_settings.font_sizes.player_desc || '18') + 'px; color: ' + (erd_settings.colors.player_desc || '#000000') + ';">' + playerDesc + '</p>';
            html += '<p class="erd-player-name" style="font-size: ' + (erd_settings.font_sizes.player_name || '18') + 'px; color: ' + (erd_settings.colors.player_name || '#000000') + ';">' + playerName + '</p>';
            html += '</div>';
        }
        html += '</div>';

        $('#erd-match-details').html(html);
    }

    // Function to play a sound with error handling
    function playSound(soundElement, soundName) {
        if (soundElement) {
            var playPromise = soundElement.play();
            if (playPromise !== undefined) {
                playPromise.catch(function (error) {
                    console.log(`${soundName} playback prevented:`, error);
                });
            }
        }
    }

    // Function to start the timer
    function startTimer() {
        // Hide the start button and disable it to prevent multiple clicks
        $('#erd-start-button').hide().prop('disabled', true);

        countdownInterval = setInterval(function () {
            timeLeft--;
            timerDisplay.text(formatTime(timeLeft));

            // Check for 5 seconds remaining in warmup phase
            if (phase === 'warmup' && timeLeft === 4 && !warningSoundPlayed) {
                // Play start sound as a warning
                playSound(startSound, 'Start sound');

                // Set the flag to true to prevent multiple plays
                warningSoundPlayed = true;
            }

            if (timeLeft <= 0) {
                if (phase === 'warmup') {
                    // Transition to match phase
                    phase = 'match';
                    timeLeft = matchDuration;

                    // Update the timer display for the new phase
                    timerDisplay.text(formatTime(timeLeft));
                } else if (phase === 'match') {
                    // End of match
                    // Play end sound
                    playSound(endSound, 'End sound');

                    clearInterval(countdownInterval);
                    // Proceed to next match if available
                    currentMatchIndex++;
                    startFromTime = 0;
                    initializeMatch();
                }
            }
        }, 1000);
    }

    // Start Timer Button Click Event
    $('#erd-start-button').on('click', function () {
        initializeMatch();
    });
});
