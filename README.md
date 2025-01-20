# Relay Doubles Countdown Timer

A WordPress plugin for managing and displaying countdown timers for relay doubles squash matches at Evertsdal.

## Description

The Relay Doubles Countdown Timer plugin provides a comprehensive solution for managing and displaying countdown timers for squash matches. It includes features for managing match schedules, customizing timers, and controlling audio notifications.

## Features

### Timer Management
- Configurable warmup, match, and break durations
- Automatic transition between phases (warmup → match → break)
- Visual countdown display with customizable fonts and colors
- Emergency timer restart functionality
- Start time override for manual time adjustments

### Audio Notifications
- Configurable start and end sound effects
- Audio plays automatically at specified intervals:
  - Start sound plays X seconds before warmup ends (where X is the duration of the audio file)
  - End sound plays Y seconds before match ends (where Y is the duration of the audio file)
- MP3 file support with preview functionality
- Audio duration is automatically detected and stored
- Media library integration for audio file management

### Display Customization
- Configurable timer font size
- Customizable message font size
- Adjustable colors for timer and messages
- Configurable gap between label and timer
- Responsive design for various screen sizes

### Administrative Features
- Secure file uploads with validation
- WordPress media library integration
- Settings persistence across sessions
- User-friendly admin interface

## Installation

1. Upload the `evt-relay-doubles` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Configure the plugin settings via the 'Relay Doubles Countdown Timer' menu item in Settings

## Usage

### Basic Setup
1. Navigate to Settings > Relay Doubles Countdown Timer
2. Configure timer durations:
   - Warmup time (default: 5 minutes)
   - Match time (default: 85 minutes)
   - Break time (default: 5 minutes)
3. Upload audio files for start and end notifications
4. Customize appearance settings

### Audio Configuration
1. Upload MP3 files for start and end sounds
2. Preview sounds directly in the admin interface
3. Audio duration is automatically detected
4. Remove or replace sounds as needed

### Emergency Timer Restart
- Set specific start time in minutes and seconds
- Use for emergency situations or manual time adjustments
- Warning banner indicates when start time is set

### Displaying the Timer
Use the shortcode `[relay_doubles_league_timer]` to display the timer on any page or post.

## Version History

### 1.1.0
- Added audio notification support
- Implemented automatic audio duration detection
- Added emergency timer restart functionality
- Improved timer phase transitions
- Enhanced settings page organization

## Technical Documentation

### File Structure
