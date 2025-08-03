# AI Conversation Assistant

A real-time voice conversation application built with Next.js, OpenAI's Realtime API, and modern web technologies.

## Features

- **Real-time Voice Conversations**: Speak naturally with AI using OpenAI's Realtime API
- **Live Transcription**: See your speech transcribed in real-time
- **Streaming Responses**: Get AI responses as they're generated
- **Modern UI**: Beautiful interface built with Shadcn/ui and Framer Motion
- **Event Logging**: Debug and monitor all real-time events
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **UI**: Shadcn/ui, Tailwind CSS, Framer Motion
- **Real-time**: OpenAI Realtime API, WebRTC
- **Audio**: Web Audio API, Voice Activity Detection (VAD)
- **Package Manager**: Bun

## Prerequisites

- Node.js 18+ or Bun
- OpenAI API key with Realtime API access
- Modern browser with WebRTC support

## Setup

1. **Clone and install dependencies**:
   ```bash
   cd app
   bun install
   ```

2. **Set up environment variables**:
   ```bash
   cp env.sample .env.local
   ```
   
   Edit `.env.local` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start the development server**:
   ```bash
   bun dev
   ```

4. **Open your browser** and navigate to `http://localhost:3000`

## Usage

1. **Connect**: Click the "Connect" button to establish a session with OpenAI's Realtime API
2. **Start Listening**: Click the "Listen" button to begin voice input
3. **Speak**: Talk naturally - the AI will transcribe your speech and respond
4. **Stop**: Click "Stop" to end the current listening session
5. **Disconnect**: Click "Disconnect" to close the session

## Features

### Real-time Voice Processing
- Automatic speech-to-text transcription
- Voice activity detection
- Real-time AI responses
- Audio streaming via WebRTC

### Conversation Management
- Live transcript display
- Message history
- Clear conversation option
- Session management

### Debugging & Monitoring
- Real-time event logging
- Connection status indicators
- Error handling and display
- Event viewer for debugging

## Architecture

The application uses a modern React architecture with:

- **Context Providers**: For state management (Transcript, Events)
- **Custom Hooks**: For real-time session management
- **WebRTC**: For low-latency audio streaming
- **OpenAI Realtime API**: For AI conversation capabilities

## API Endpoints

- `POST /api/session`: Creates a new Realtime API session
- Returns session ID and client secret for WebRTC connection

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Ensure your OpenAI API key has Realtime API access
2. **Audio Issues**: Check browser permissions for microphone access
3. **WebRTC Errors**: Try refreshing the page or checking network connectivity

### Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Limited support (may need to enable experimental features)

## Development

### Project Structure

```
src/app/
├── components/          # UI components
├── contexts/           # React contexts
├── hooks/              # Custom hooks
├── lib/                # Utilities
├── agentConfigs/       # AI agent configurations
├── api/                # API routes
└── types.ts           # TypeScript definitions
```

### Key Files

- `App.tsx`: Main application component
- `useRealtimeSession.ts`: Core real-time session management
- `api/session/route.ts`: Session creation endpoint
- `components/Transcript.tsx`: Conversation display
- `components/Events.tsx`: Event logging display

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review the event logs in the UI
- Ensure your OpenAI API key has the necessary permissions
