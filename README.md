# AI Workflow GUI

A web-based graphical user interface for the AI Development Workflow CLI tools.

## Features

- **CLI Status Monitoring**: Real-time status checking for AI Integration, Persona Manager, and Workflow Tracker tools
- **Quick Actions**: Execute common CLI commands through an intuitive interface
- **Responsive Design**: Works on desktop and mobile devices
- **Secure Command Execution**: Only allows whitelisted CLI commands for security

## Prerequisites

- Node.js 18+ 
- AI Development Workflow CLI tools installed and accessible in PATH:
  - `aiw` (AI Integration)
  - `pc` (Persona Manager) 
  - `wt` (Workflow Tracker)

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Deployment

This application can be deployed to:

- **Vercel**: Connect your GitHub repository to Vercel for automatic deployments
- **Netlify**: Deploy using the Netlify CLI or GitHub integration
- **Docker**: Build and run in a containerized environment

### Environment Variables

No environment variables are required for basic functionality. The application communicates with CLI tools installed on the system.

## API Endpoints

- `GET /api/cli/status` - Check availability of CLI tools
- `POST /api/cli/execute` - Execute allowed CLI commands

## Security

- Only whitelisted CLI commands (`aiw`, `pc`, `wt`) are allowed
- Command execution has timeout and buffer limits
- No direct shell access or arbitrary command execution

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the AI Development Workflow toolkit.
