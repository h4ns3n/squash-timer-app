<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Renders the audio settings section of the admin page.
 *
 * @param array $settings The current plugin settings.
 */
function erd_render_audio_settings($settings) {
    // Ensure WordPress media scripts are loaded
    wp_enqueue_media();
    ?>
    <h2><?php esc_html_e('Audio Settings', 'erdct-textdomain'); ?></h2>
    <table class="form-table">
        <!-- Start Sound -->
        <tr valign="top">
            <th scope="row"><?php esc_html_e('Start Sound (MP3)', 'erdct-textdomain'); ?></th>
            <td>
                <div class="erd-audio-upload-container">
                    <input type="hidden"
                           name="erd_settings[start_sound_id]"
                           id="erd-start-sound-id"
                           value="<?php echo esc_attr($settings['start_sound_id'] ?? ''); ?>" />

                    <input type="hidden"
                           name="erd_settings[start_sound_duration]"
                           id="erd-start-sound-duration"
                           value="<?php echo esc_attr($settings['start_sound_duration'] ?? '0'); ?>" />

                    <button type="button"
                            class="button"
                            id="erd-upload-start-sound">
                        <?php esc_html_e('Choose Start Sound', 'erdct-textdomain'); ?>
                    </button>

                    <div id="erd-start-sound-preview" style="margin-top: 10px;">
                        <?php if (!empty($settings['start_sound_id'])):
                            $audio_url = wp_get_attachment_url($settings['start_sound_id']);
                            if ($audio_url): ?>
                                <div class="audio-preview">
                                    <audio controls>
                                        <source src="<?php echo esc_url($audio_url); ?>" type="audio/mpeg">
                                    </audio>
                                    <br>
                                    <span class="duration-info">Duration: <?php echo esc_attr($settings['start_sound_duration'] ?? '0'); ?> seconds</span><br>
                                    <button type="button"
                                            class="button erd-remove-sound"
                                            data-target="start">
                                        <?php esc_html_e('Remove Sound', 'erdct-textdomain'); ?>
                                    </button>
                                </div>
                            <?php endif;
                        endif; ?>
                    </div>
                </div>
            </td>
        </tr>

        <!-- End Sound -->
        <tr valign="top">
            <th scope="row"><?php esc_html_e('End Sound (MP3)', 'erdct-textdomain'); ?></th>
            <td>
                <div class="erd-audio-upload-container">
                    <input type="hidden"
                           name="erd_settings[end_sound_id]"
                           id="erd-end-sound-id"
                           value="<?php echo esc_attr($settings['end_sound_id'] ?? ''); ?>" />

                    <input type="hidden"
                           name="erd_settings[end_sound_duration]"
                           id="erd-end-sound-duration"
                           value="<?php echo esc_attr($settings['end_sound_duration'] ?? '0'); ?>" />

                    <button type="button"
                            class="button"
                            id="erd-upload-end-sound">
                        <?php esc_html_e('Choose End Sound', 'erdct-textdomain'); ?>
                    </button>

                    <div id="erd-end-sound-preview" style="margin-top: 10px;">
                        <?php if (!empty($settings['end_sound_id'])):
                            $audio_url = wp_get_attachment_url($settings['end_sound_id']);
                            if ($audio_url): ?>
                                <div class="audio-preview">
                                    <audio controls>
                                        <source src="<?php echo esc_url($audio_url); ?>" type="audio/mpeg">
                                    </audio>
                                    <br>
                                    <span class="duration-info">Duration: <?php echo esc_attr($settings['end_sound_duration'] ?? '0'); ?> seconds</span><br>
                                    <button type="button"
                                            class="button erd-remove-sound"
                                            data-target="end">
                                        <?php esc_html_e('Remove Sound', 'erdct-textdomain'); ?>
                                    </button>
                                </div>
                            <?php endif;
                        endif; ?>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <script type="text/javascript">
    jQuery(document).ready(function($) {
        function createMediaUploader(title, buttonText) {
            return wp.media({
                title: title,
                button: {
                    text: buttonText
                },
                multiple: false,
                library: {
                    type: 'audio'
                }
            });
        }

        function handleAudioSelect(type) {
            var mediaUploader = createMediaUploader(
                '<?php esc_html_e('Choose Audio File', 'erdct-textdomain'); ?>',
                '<?php esc_html_e('Select', 'erdct-textdomain'); ?>'
            );

            mediaUploader.on('select', function() {
                var attachment = mediaUploader.state().get('selection').first().toJSON();

                // Create a temporary audio element to get duration
                var audio = new Audio(attachment.url);
                audio.addEventListener('loadedmetadata', function() {
                    // Update hidden inputs
                    $('#erd-' + type + '-sound-id').val(attachment.id);
                    $('#erd-' + type + '-sound-duration').val(Math.ceil(audio.duration));

                    // Update preview
                    var audioPreview = '<div class="audio-preview">' +
                        '<audio controls>' +
                        '<source src="' + attachment.url + '" type="audio/mpeg">' +
                        '</audio><br>' +
                        '<span class="duration-info">Duration: ' + Math.ceil(audio.duration) + ' seconds</span><br>' +
                        '<button type="button" class="button erd-remove-sound" data-target="' + type + '">' +
                        '<?php esc_html_e('Remove Sound', 'erdct-textdomain'); ?>' +
                        '</button></div>';

                    $('#erd-' + type + '-sound-preview').html(audioPreview);
                });
            });

            return mediaUploader;
        }

        // Start Sound Upload
        var startSoundUploader;
        $('#erd-upload-start-sound').on('click', function(e) {
            e.preventDefault();
            if (!startSoundUploader) {
                startSoundUploader = handleAudioSelect('start');
            }
            startSoundUploader.open();
        });

        // End Sound Upload
        var endSoundUploader;
        $('#erd-upload-end-sound').on('click', function(e) {
            e.preventDefault();
            if (!endSoundUploader) {
                endSoundUploader = handleAudioSelect('end');
            }
            endSoundUploader.open();
        });

        // Handle remove button clicks
        $(document).on('click', '.erd-remove-sound', function() {
            var target = $(this).data('target');
            if (confirm('<?php esc_html_e('Are you sure you want to remove this sound?', 'erdct-textdomain'); ?>')) {
                $('#erd-' + target + '-sound-id').val('');
                $('#erd-' + target + '-sound-preview').empty();
            }
        });
    });
    </script>
    <?php
}