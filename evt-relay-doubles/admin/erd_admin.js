// admin/erd_admin.js
jQuery(document).ready(function ($) {
    // Debug
    console.log('Admin JS loaded');

    // Initialize color pickers
    $('.erd-color-picker').wpColorPicker();

    // Initialize volume slider display
    $('.erd-volume-slider').on('input', function () {
        $(this).next('.erd-volume-value').text($(this).val() + '%');
    });

    // Audio file preview handling
    $('.erd-audio-upload').on('change', function () {
        var file = this.files[0];
        if (file) {
            var preview = $(this).siblings('.erd-audio-preview');
            if (!preview.length) {
                preview = $('<div class="erd-audio-preview"><audio controls></audio></div>').insertAfter(this);
            }
            var audio = preview.find('audio')[0];
            audio.src = URL.createObjectURL(file);
        }
    });

    // Match schedule handling
    $(document).on('click', '#erd-add-match', function (e) {
        e.preventDefault();
        console.log('Add match clicked');

        var matchNumber = $('#erd-new-match-number').val();
        var matchDesc = $('#erd-new-match-description').val();
        var courts = {};

        // Collect court data
        for (var i = 1; i <= 4; i++) {
            courts[i] = {
                team_name: $(`#erd-new-court-${i}-team`).val() || '',
                player_desc: $(`#erd-new-court-${i}-desc`).val() || '',
                player_name: $(`#erd-new-court-${i}-name`).val() || ''
            };
        }

        if (!matchNumber || !matchDesc) {
            alert('Please fill in all required fields');
            return;
        }

        var $button = $(this);
        $button.prop('disabled', true).text('Saving...');

        $.ajax({
            url: erdAdmin.ajaxUrl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'erd_save_match',
                nonce: erdAdmin.nonce,
                match_number: matchNumber,
                match_data: {
                    description: matchDesc,
                    courts: courts
                }
            },
            success: function (response) {
                console.log('Save response:', response);
                if (response.success) {
                    location.reload();
                } else {
                    alert(response.data || 'Error saving match');
                }
            },
            error: function (xhr, status, error) {
                console.error('Ajax error:', error);
                console.error('Response:', xhr.responseText);
                alert('Error saving match. Please check the console for details.');
            },
            complete: function () {
                $button.prop('disabled', false).text('Add Match');
            }
        });
    });

    // Edit match functionality
    $(document).on('click', '.erd-edit-match', function () {
        var $row = $(this).closest('.erd-match-row');
        $row.find('.erd-match-display').hide();
        $row.find('.erd-match-edit').show();
    });

    // Save edited match
    $(document).on('click', '.erd-save-match', function () {
        var $row = $(this).closest('.erd-match-row');
        var matchNumber = $row.data('match-number');
        var description = $row.find('.erd-match-description').val();
        var courts = {};

        $row.find('.erd-court-data').each(function () {
            var courtNumber = $(this).data('court-number');
            courts[courtNumber] = {
                team_name: $(this).find('.erd-team-name').val(),
                player_desc: $(this).find('.erd-player-desc').val(),
                player_name: $(this).find('.erd-player-name').val()
            };
        });

        $.ajax({
            url: erdAdmin.ajaxUrl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'erd_save_match',
                nonce: erdAdmin.nonce,
                match_number: matchNumber,
                match_data: {
                    description: description,
                    courts: courts
                }
            },
            success: function (response) {
                if (response.success) {
                    location.reload();
                } else {
                    alert(response.data || 'Error saving match');
                }
            },
            error: function (xhr, status, error) {
                console.error('Ajax error:', error);
                alert('Error saving match: ' + error);
            }
        });
    });

    // Cancel edit
    $(document).on('click', '.erd-cancel-edit', function () {
        var $row = $(this).closest('.erd-match-row');
        $row.find('.erd-match-edit').hide();
        $row.find('.erd-match-display').show();
    });

    // Delete match functionality
    $(document).on('click', '.erd-delete-match', function () {
        if (!confirm('Are you sure you want to delete this match?')) {
            return;
        }

        var $row = $(this).closest('.erd-match-row');
        var matchNumber = $row.data('match-number');

        $.ajax({
            url: erdAdmin.ajaxUrl,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'erd_delete_match',
                nonce: erdAdmin.nonce,
                match_number: matchNumber
            },
            success: function (response) {
                if (response.success) {
                    location.reload();
                } else {
                    alert(response.data || 'Error deleting match');
                }
            },
            error: function (xhr, status, error) {
                console.error('Ajax error:', error);
                alert('Error deleting match: ' + error);
            }
        });
    });
});