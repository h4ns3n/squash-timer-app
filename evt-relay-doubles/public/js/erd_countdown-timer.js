jQuery(document).ready(function ($) {
    // Initialize timer settings
    var warmupTime = erdTimerSettings.warmupTime * 60; // Convert to seconds
    var matchTime = erdTimerSettings.matchTime * 60; // Convert to seconds
    var breakTime = erdTimerSettings.breakTime * 60; // Convert to seconds

    var startTimeMinutes = erdTimerSettings.startTimeMinutes || 0;
    var startTimeSeconds = erdTimerSettings.startTimeSeconds || 0;
    var startTime = (startTimeMinutes * 60) + startTimeSeconds;

    var currentPhase = startTime > 0 ? 'match' : 'warmup';
    var timeLeft = startTime > 0 ? startTime : warmupTime;

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