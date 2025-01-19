jQuery(document).ready(function ($) {
    var Timer = {
        totalMatches: 2, // Assuming 2 matches for demonstration
        currentMatchIndex: 1,
        phase: 'warmup',
        timeLeft: 5 * 60, // 5 minutes warm-up
        warmupDuration: 5 * 60,
        matchDuration: 85 * 60,
        breakDuration: 5 * 60,
        interval: null,

        elements: {
            timer: $('#erd-timer-display'),
            matchNumber: $('#erd-current-match-index'),
            startButton: $('#erd-start-button'),
            matchDetails: $('#erd-match-details')
        },

        init: function () {
            this.bindEvents();
            this.updateDisplay();
        },

        bindEvents: function () {
            var self = this;
            this.elements.startButton.on('click', function () {
                self.start();
            });
        },

        start: function () {
            this.elements.startButton.prop('disabled', true).hide();
            this.startTimer();
        },

        startTimer: function () {
            var self = this;
            this.interval = setInterval(function () {
                self.tick();
            }, 1000);
        },

        tick: function () {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.handlePhaseEnd();
            }
        },

        handlePhaseEnd: function () {
            if (this.phase === 'warmup') {
                this.phase = 'match';
                this.timeLeft = this.matchDuration;
            } else if (this.phase === 'match') {
                this.currentMatchIndex++;
                if (this.currentMatchIndex <= this.totalMatches) {
                    this.phase = 'break';
                    this.timeLeft = this.breakDuration;
                } else {
                    this.endAllMatches();
                }
            } else if (this.phase === 'break') {
                this.phase = 'warmup';
                this.timeLeft = this.warmupDuration;
            }
        },

        endAllMatches: function () {
            clearInterval(this.interval);
            this.elements.timer.text('00:00');
            this.elements.matchDetails.text('All matches are complete.');
        },

        updateDisplay: function () {
            var minutes = Math.floor(this.timeLeft / 60);
            var seconds = this.timeLeft % 60;
            this.elements.timer.text((minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds);
            this.elements.matchNumber.text('Match ' + this.currentMatchIndex);
        }
    };

    Timer.init();
});