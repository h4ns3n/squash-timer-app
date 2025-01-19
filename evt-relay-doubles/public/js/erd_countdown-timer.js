jQuery(document).ready(function ($) {
    // Initialize timer settings
    var warmupTime = erdTimerSettings.warmupTime * 60; // Convert to seconds
    var matchTime = erdTimerSettings.matchTime * 60; // Convert to seconds
    var breakTime = erdTimerSettings.breakTime * 60; // Convert to seconds

    var currentPhase = 'warmup'; // Possible values: 'warmup', 'match', 'break'
    var timeLeft = warmupTime;

    function updateTimerDisplay() {
        var minutes = Math.floor(timeLeft / 60);
        var seconds = timeLeft % 60;
        $('#erd-timer-display').text(minutes + ':' + (seconds < 10 ? '0' : '') + seconds);
    }

    function startTimer() {
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
        startTimer();
    }

    $('#erd-start-button').on('click', function () {
        startTimer();
    });

    updateTimerDisplay();
});