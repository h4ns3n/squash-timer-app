# Relay Doubles Countdown Timer

A WordPress plugin for managing and displaying countdown timers for relay doubles squash matches at Evertsdal.

## Description

The Relay Doubles Countdown Timer plugin provides a comprehensive solution for managing and displaying countdown timers for squash matches. It includes features for managing match schedules, customizing timers, and controlling audio notifications.

## Features

### Timer Management
- Configurable warmup and match durations for singles and doubles matches
- Automatic transition from warmup to match phase
- Visual countdown display
- Audio notifications for phase transitions

### Match Schedule Management
- Import match schedules via CSV
- Manual match entry and editing
- Support for up to 4 courts per match
- Player and team information display

### Customization Options
- Configurable fonts and colors
- Custom logo upload
- Customizable audio alerts
- Volume control for sound effects

### Administrative Features
- Secure file uploads with validation
- CSV import functionality
- Match schedule clearing
- Individual match editing

## Installation

1. Upload the `evt-relay-doubles` folder to the `/wp-content/plugins/` directory
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Configure the plugin settings via the 'Relay Doubles Countdown Timer' menu item in Settings

## Usage

### Basic Setup
1. Navigate to Settings > Relay Doubles Countdown Timer
2. Configure basic timer settings for singles and doubles matches
3. Upload custom sounds and logo if desired
4. Customize appearance settings

### Managing Match Schedule
- **CSV Import**: Use the CSV upload feature to bulk import match schedules
- **Manual Entry**: Add matches individually using the match schedule form
- **Editing**: Use the edit controls to modify existing matches
- **Clearing**: Use the clear schedule feature to remove all matches

### Displaying the Timer
Use the shortcode `[relay_doubles_league_timer]` to display the timer on any page or post.

## Technical Documentation

### File Structure