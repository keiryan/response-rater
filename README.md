# LLM Vetting Sampler

A modern web application for generating and comparing responses from multiple LLM providers in parallel. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Multi-Provider Support**: OpenAI, Anthropic, and DeepSeek
- **Parallel Processing**: Generate multiple responses simultaneously with configurable concurrency
- **Live Streaming**: Real-time response streaming with typing effects
- **Similarity Detection**: Automatic detection of near-duplicate responses using TF-IDF
- **Export Options**: CSV and JSON export with full metadata
- **CORS Handling**: Built-in relay system for handling CORS issues
- **Modern UI**: Clean, responsive design with light/dark themes
- **Local Storage**: All settings and API keys stored locally in the browser

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd llm-vetting-sampler
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Configure API Keys

1. Navigate to **Settings** in the top navigation
2. Add your API keys for the providers you want to use:
   - **OpenAI**: Get your key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - **Anthropic**: Get your key from [Anthropic Console](https://console.anthropic.com/)
   - **DeepSeek**: Get your key from [DeepSeek Platform](https://platform.deepseek.com/)

### 2. Enable Models

1. In Settings, go to the **Models** section
2. Enable the models you want to test
3. Optionally add custom models with specific parameters

### 3. Run a Test

1. On the main page, enter your vetting question
2. Optionally add a system prompt to standardize formatting
3. Select the models you want to test
4. Adjust concurrency settings (default: 3)
5. Click **Run** to start generating responses

### 4. Analyze Results

- View live streaming responses with real-time stats
- See similarity badges for near-duplicate responses
- Export results as CSV or JSON
- Compare responses side-by-side

## Architecture

### Core Components

- **Run Engine**: Manages concurrent requests and job queuing
- **Provider Adapters**: Handle API communication for each provider
- **Similarity Detection**: TF-IDF based similarity analysis
- **State Management**: Zustand stores with localStorage persistence

### File Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/relay/         # CORS relay endpoints
│   ├── settings/          # Settings page
│   └── page.tsx           # Main run interface
├── components/            # React components
│   ├── common/           # Shared components
│   ├── run/              # Run-specific components
│   ├── settings/         # Settings components
│   └── ui/               # shadcn/ui components
├── lib/                  # Core utilities
│   ├── adapters/         # Provider API adapters
│   ├── runEngine/        # Concurrency management
│   ├── similarity/       # Text similarity detection
│   ├── csv/              # Export utilities
│   └── sse/              # Server-Sent Events parsing
└── store/                # Zustand state stores
```

## Configuration

### Advanced Settings

- **Loop Cap**: Maximum responses per model (default: 5)
- **Similarity Threshold**: Detection sensitivity (default: 0.90)
- **Concurrency**: Parallel request limit (default: 3)

### Transport Modes

- **Direct**: Browser makes requests directly to provider APIs
- **Relay**: Requests go through Vercel edge functions (for CORS issues)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Deploy with default settings

No environment variables are required - all configuration is stored in browser localStorage.

### Other Platforms

The app can be deployed to any platform that supports Next.js:

```bash
npm run build
npm start
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Providers

1. Create a new adapter in `src/lib/adapters/`
2. Add the provider to the types in `src/lib/types.ts`
3. Update the adapter index in `src/lib/adapters/index.ts`
4. Add relay endpoint in `src/app/api/relay/`

## Security

- API keys are stored only in browser localStorage
- Keys are never logged or stored on the server
- Relay endpoints forward keys but don't persist them
- All API communication uses HTTPS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:

- Check the [Issues](https://github.com/your-repo/issues) page
- Create a new issue with detailed information
- Include browser console logs for debugging

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS.
# response-rater
