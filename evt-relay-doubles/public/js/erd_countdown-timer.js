jQuery(document).ready(function ($) {
    // Get audio settings
    var startSound = new Audio(erdTimerSettings.startSoundUrl);
    var endSound = new Audio(erdTimerSettings.endSoundUrl);
    var startSoundDuration = parseInt(erdTimerSettings.startSoundDuration) || 0;
    var endSoundDuration = parseInt(erdTimerSettings.endSoundDuration) || 0;

    // Initialize timer settings
    var warmupTime = erdTimerSettings.warmupTime * 60;
    var matchTime = erdTimerSettings.matchTime * 60;
    var breakTime = erdTimerSettings.breakTime * 60;

    var startTimeMinutes = erdTimerSettings.startTimeMinutes || 0;
    var startTimeSeconds = erdTimerSettings.startTimeSeconds || 0;
    var startTime = (startTimeMinutes * 60) + startTimeSeconds;

    var currentPhase = startTime > 0 ? 'match' : 'warmup';
    var timeLeft = startTime > 0 ? startTime : warmupTime;

    // Debug logging
    console.log('Audio Settings:', {
        startSoundUrl: erdTimerSettings.startSoundUrl,
        endSoundUrl: erdTimerSettings.endSoundUrl,
        startSoundDuration: startSoundDuration,
        endSoundDuration: endSoundDuration
    });

    function updateTimerDisplay() {
        var minutes = Math.floor(timeLeft / 60);
        var seconds = timeLeft % 60;
        $('#erd-timer-display').text(minutes + ':' + (seconds < 10 ? '0' : '') + seconds);
    }

    function updateMessageDisplay() {
        if (currentPhase === 'warmup') {
            $('#erd-timer-message').text('Match Warm Up');
        } else if (currentPhase === 'match') {
            $('#erd-timer-message').text('Relay Doubles Match In Progress');
        } else if (currentPhase === 'break') {
            $('#erd-timer-message').text('Break Between Schedules');
        }
    }

    function startTimer() {
        $('#erd-start-button').hide();
        updateMessageDisplay();
        var timerInterval = setInterval(function () {
            if (timeLeft > 0) {
                // Debug logging for audio triggers
                console.log('Current Phase:', currentPhase, 'Time Left:', timeLeft);

                // Check if we need to play start sound
                if (currentPhase === 'warmup' && timeLeft === startSoundDuration) {
                    console.log('Playing start sound');
                    startSound.play().catch(function (error) {
                        console.error('Error playing start sound:', error);
                    });
                }
                // Check if we need to play end sound
                else if (currentPhase === 'match' && timeLeft === endSoundDuration) {
                    console.log('Playing end sound');
                    endSound.play().catch(function (error) {
                        console.error('Error playing end sound:', error);
                    });
                }

                timeLeft--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                switchPhase();
            }
        }, 1000);
    }

    function switchPhase() {
        if (currentPhase === 'warmup') {
            currentPhase = 'match';
            timeLeft = matchTime;
        } else if (currentPhase === 'match') {
            currentPhase = 'break';
            timeLeft = breakTime;
        } else {
            currentPhase = 'warmup';
            timeLeft = warmupTime;
        }
        updateMessageDisplay();
        startTimer();
    }

    $('#erd-start-button').on('click', function () {
        startTimer();
    });

    updateTimerDisplay();
});