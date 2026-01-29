# Web-Based Central Controller - Feature Summary

**Created:** 2026-01-29  
**Status:** Design Complete, Ready for Implementation  
**Estimated Effort:** 6-8 weeks full implementation, 2-3 weeks for MVP

---

## What This Feature Does

This feature adds a **web-based central controller** that allows you to:

1. **Discover** all Android TVs running the Squash Timer app on your local network
2. **Choose** between two control modes:
   - **Independent Mode**: Control each TV separately
   - **Centralized Mode**: Control all TVs simultaneously from one interface
3. **Control** timers from any device with a browser (phone, tablet, laptop)
4. **Monitor** real-time status of all TVs

---

## Key Benefits

### For Tournament Organizers
- Control multiple court timers from a single device
- Synchronize breaks across all courts
- Monitor all matches from one location
- Quick emergency time adjustments

### For Multi-Display Setups
- Show same timer on multiple TVs
- Perfect synchronization across displays
- Single point of control

### For Flexibility
- Switch between centralized and independent modes
- Add new TVs dynamically
- No complex setup required

---

## How It Works

### Architecture

```
Android TV Apps (Courts 1, 2, 3...)
    ↕ WebSocket Connection
Web Controller (Browser)
    - Discovers TVs via mDNS
    - Sends control commands
    - Receives timer state updates
```

### Discovery Process

1. Each Android TV broadcasts its presence on the network using mDNS
2. Web controller scans for these broadcasts
3. Discovered TVs appear in the web interface
4. User connects to desired TVs

### Control Flow

**Independent Mode:**
- Each TV has its own control panel in web app
- Commands sent to individual TVs
- TVs can still be controlled via their own remotes

**Centralized Mode:**
- Single control panel controls all TVs
- Commands broadcast to all connected TVs
- All TVs stay synchronized
- Optional: disable local remote control

---

## Technical Overview

### Android TV Modifications

**New Components:**
- WebSocket server (Ktor framework)
- mDNS service broadcaster (JmDNS library)
- Network manager for coordination
- Remote command handler

**Modified Components:**
- `TimerViewModel`: Add network state broadcasting
- `MainActivity`: Initialize network services
- `AndroidManifest.xml`: Add network permissions

**Dependencies Added:**
```kotlin
implementation("io.ktor:ktor-server-core:2.3.7")
implementation("io.ktor:ktor-server-netty:2.3.7")
implementation("io.ktor:ktor-server-websockets:2.3.7")
implementation("javax.jmdns:jmdns:3.5.8")
```

### Web Application

**Technology Stack:**
- React 18 + TypeScript
- Zustand for state management
- Native WebSocket API
- Tailwind CSS for styling
- Vite for build tooling

**Core Features:**
- Device discovery and connection
- Real-time timer state display
- Timer control interface
- Settings management
- Sync mode selection

**Project Structure:**
```
web-controller/
├── src/
│   ├── components/      # UI components
│   ├── services/        # WebSocket, discovery, sync
│   ├── store/          # State management
│   ├── types/          # TypeScript types
│   └── hooks/          # React hooks
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Basic connectivity working

**Android TV:**
- Add WebSocket server
- Add mDNS service
- Implement basic message handling

**Web App:**
- Set up React project
- Implement WebSocket client
- Create basic UI

**Milestone:** Web app can connect to TV and see timer state

### Phase 2: Core Features (Weeks 3-4)
**Goal:** Full control functionality

**Android TV:**
- Implement all command handlers
- Add state broadcasting
- Implement sync mode logic

**Web App:**
- Build timer control UI
- Add sync mode selector
- Implement settings panel

**Milestone:** Can control timer from web app, both modes work

### Phase 3: Polish & Testing (Weeks 5-6)
**Goal:** Production ready

**Both:**
- Error handling and recovery
- UI/UX refinements
- Performance optimization
- Comprehensive testing

**Milestone:** Stable, production-ready feature

### Phase 4: Advanced Features (Optional, Weeks 7-8)
**Goal:** Enhanced functionality

**Features:**
- Device authentication/pairing
- QR code connection
- Match scheduling
- Analytics dashboard

---

## MVP Approach (2-3 Weeks)

For a quick working prototype:

**Simplifications:**
- Manual IP entry instead of mDNS discovery
- Centralized mode only (skip independent mode)
- Basic UI without animations
- No authentication
- Timer control only (no settings sync)

**What You Get:**
- Web app that connects to TVs
- Start/pause/restart functionality
- Multiple TV support
- Real-time state updates

---

## Message Protocol

### Command Messages (Web → TV)

```json
{
  "type": "START_TIMER",
  "timestamp": 1706558400000,
  "commandId": "cmd-001",
  "payload": {}
}
```

**Supported Commands:**
- `START_TIMER` - Begin countdown
- `PAUSE_TIMER` - Pause countdown
- `RESUME_TIMER` - Resume from pause
- `RESTART_TIMER` - Reset to warmup
- `UPDATE_SETTINGS` - Modify timer settings
- `SET_EMERGENCY_TIME` - Override current time
- `SET_SYNC_MODE` - Change sync mode

### State Messages (TV → Web)

```json
{
  "type": "STATE_UPDATE",
  "timestamp": 1706558400000,
  "deviceId": "tv-device-001",
  "payload": {
    "phase": "MATCH",
    "timeLeftSeconds": 4500,
    "isRunning": true,
    "isPaused": false
  }
}
```

---

## Network Requirements

**Minimum:**
- WiFi network (2.4GHz or 5GHz)
- All devices on same subnet
- Multicast enabled for mDNS

**Recommended:**
- 5GHz WiFi for lower latency
- Dedicated network for timer devices
- QoS enabled for WebSocket traffic

**Bandwidth:**
- Per device: < 1 KB/s
- 10 devices: < 10 KB/s
- Negligible network impact

---

## Security Considerations

### Current Design (Phase 1-3)
- Local network only
- No authentication required
- Trust-based security model
- Suitable for controlled environments

### Future Enhancements (Phase 4)
- PIN code pairing
- Token-based authentication
- Device allowlist
- Message signing (HMAC)

**Recommendation:** Start without authentication for simplicity, add later if needed.

---

## Testing Strategy

### Unit Tests
- WebSocket server connection handling
- Command processing logic
- mDNS service registration
- State management stores

### Integration Tests
- WebSocket + ViewModel integration
- Device discovery + connection
- Command execution + state updates

### End-to-End Tests
1. Single device control
2. Multi-device synchronization
3. Mode switching
4. Connection recovery
5. Emergency override

### Manual Testing
- Test on real Android TV devices
- Test on various browsers
- Test on mobile devices
- Test network interruptions

---

## Documentation

### Created Documents

1. **`WEB_CONTROLLER_FEATURE_DESIGN.md`** (Comprehensive)
   - Complete technical specifications
   - Detailed architecture
   - Full API documentation
   - Implementation details
   - ~1000 lines

2. **`WEB_CONTROLLER_QUICKSTART.md`** (Practical)
   - Step-by-step implementation guide
   - Code examples
   - Testing checklist
   - Troubleshooting tips
   - ~600 lines

3. **`WEB_CONTROLLER_SUMMARY.md`** (This Document)
   - High-level overview
   - Quick reference
   - Key decisions
   - ~300 lines

### Existing Documents (Reference)
- `PRD.md` - Product requirements for current app
- `ARCHITECTURE_AND_UI_REVIEW.md` - Architecture analysis
- `CODEBASE_REVIEW.md` - Code quality review
- `ANDROID_TV_README.md` - Android TV setup guide

---

## Key Decisions

### Technology Choices

**WebSocket over HTTP polling:**
- Real-time bidirectional communication
- Lower latency
- More efficient

**mDNS for discovery:**
- Zero-configuration networking
- Standard protocol
- Works without server

**Ktor for WebSocket server:**
- Kotlin-native
- Lightweight
- Well-documented

**React for web app:**
- Modern, popular framework
- Great ecosystem
- TypeScript support

### Design Decisions

**Two sync modes:**
- Flexibility for different use cases
- Can switch dynamically
- No lock-in

**Browser-based controller:**
- No app installation required
- Works on any device
- Easy updates

**Local network only:**
- No cloud dependency
- Better security
- Lower latency
- Privacy-friendly

---

## Success Metrics

### Functional Requirements
✅ Web app discovers TVs automatically (or manual entry works)  
✅ Web app can start/pause/restart timers  
✅ Multiple TVs can be controlled simultaneously  
✅ Centralized mode keeps all TVs in sync  
✅ Independent mode allows individual control  
✅ UI is responsive on mobile/tablet/desktop  

### Performance Requirements
✅ Discovery time < 5 seconds  
✅ Command latency < 100ms  
✅ State updates at 1 Hz  
✅ No crashes during normal use  

### Quality Requirements
✅ Documentation complete  
✅ Unit tests written  
✅ Integration tests passing  
✅ Manual testing completed  

---

## Risks & Mitigations

### Risk: mDNS Not Working
**Impact:** Can't discover devices automatically  
**Mitigation:** Manual IP entry fallback, QR code option

### Risk: WebSocket Connection Issues
**Impact:** Can't control TVs  
**Mitigation:** Automatic reconnection, connection status indicator

### Risk: Network Latency
**Impact:** Delayed command execution  
**Mitigation:** Local network only, show loading states

### Risk: State Desynchronization
**Impact:** TVs out of sync in centralized mode  
**Mitigation:** Periodic state sync, timestamp-based validation

---

## Future Enhancements

### Short-Term (3-6 months)
- Native mobile apps (iOS/Android)
- Advanced scheduling
- Audio file upload via web
- Match history

### Medium-Term (6-12 months)
- Cloud sync (optional)
- Analytics dashboard
- Tournament mode
- Score tracking

### Long-Term (12+ months)
- Multi-sport support
- Live streaming integration
- Hardware control panel
- LED display integration

---

## Getting Started

### For Implementers

1. **Read the Quick Start Guide** (`WEB_CONTROLLER_QUICKSTART.md`)
2. **Start with Phase 1** - Get basic connectivity working
3. **Test frequently** - Don't wait until the end
4. **Use the MVP approach** if time-constrained
5. **Refer to Design Doc** for detailed specifications

### For Reviewers

1. **Read this summary** for high-level understanding
2. **Review Design Doc** for technical details
3. **Check Quick Start** for implementation approach
4. **Provide feedback** on architecture and approach

### For Users

1. **Wait for implementation** - Feature not yet built
2. **Expected timeline** - 6-8 weeks for full version, 2-3 weeks for MVP
3. **Requirements** - WiFi network, Android TV devices
4. **No special setup** - Should work out of the box

---

## Questions & Answers

### Q: Will this work with my existing Android TV app?
**A:** Yes, but you'll need to update the app to include the WebSocket server and mDNS service.

### Q: Do I need internet access?
**A:** No, everything works on local network only.

### Q: Can I control TVs from outside my network?
**A:** Not in the initial version. Could be added later with VPN or cloud relay.

### Q: What if I only have one TV?
**A:** The web controller still works and provides a convenient remote control interface.

### Q: Will this slow down my network?
**A:** No, bandwidth usage is negligible (< 1 KB/s per device).

### Q: Can I use this with non-Android TV devices?
**A:** Not directly, but the protocol could be implemented on other platforms.

### Q: Is this secure?
**A:** For local network use, yes. For internet exposure, additional security needed.

### Q: Can I customize the web interface?
**A:** Yes, it's open source and built with standard web technologies.

---

## Contact & Support

**Project Repository:** [Your GitHub URL]  
**Documentation:** `/docs/` directory  
**Issues:** [GitHub Issues URL]  
**Email:** [Your contact email]

---

## Conclusion

This feature transforms the Squash Timer app from a standalone Android TV application into a **networked system** that can be controlled centrally. The design is:

- **Practical**: Solves real problems for tournament organizers
- **Flexible**: Works for single or multiple TVs
- **Modern**: Uses current best practices and technologies
- **Maintainable**: Well-documented and tested
- **Extensible**: Easy to add features later

**Ready to implement?** Start with the Quick Start Guide!

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-29  
**Status:** Design Complete ✅
