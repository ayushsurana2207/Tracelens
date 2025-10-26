# AI Observability Platform — Full-Stack MVP

A comprehensive AI observability platform for tracking **LLM metrics** and **Agent workflows** with real-time monitoring, alerting, and root cause analysis capabilities.

## 🚀 Features

### Phase 1A: LLM Tracking
- **Latency & Throughput Metrics**: Real-time response time monitoring with P95/P99 percentiles
- **Token Usage & Cost Tracking**: Detailed token consumption analysis with cost attribution
- **Model Performance**: Comparative analysis across different models and providers
- **Time Series Analytics**: Historical trend analysis with interactive charts
- **Error Monitoring**: Comprehensive error tracking and failure analysis

### Phase 1B: Agent Workflow Tracking
- **End-to-End Execution Traces**: Complete session tracking from start to finish
- **Hierarchical View**: Multi-level span visualization with expandable tree structure
- **Reasoning Chain Logging**: Chain-of-thought and tool usage tracking
- **Root Cause Analysis**: Automated failure detection and bottleneck identification
- **Performance Bottlenecks**: Latency analysis and optimization recommendations

### Real-Time Monitoring
- **WebSocket Integration**: Live updates for metrics and alerts
- **Threshold Management**: Configurable alerting rules with severity levels
- **Alert Management**: Acknowledge, resolve, and track alert lifecycle
- **Dashboard**: Comprehensive overview with key performance indicators

## 🛠 Tech Stack

- **Frontend**: React 18 + TypeScript, TailwindCSS, Recharts, React Router
- **Backend**: Python FastAPI, SQLAlchemy, Pydantic
- **Database**: SQLite (default) / PostgreSQL (production)
- **Real-time**: WebSocket connections for live updates
- **Styling**: Dynatrace-inspired dark theme with modern UI components

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-observability-mvp
   ```

2. **Start the frontend** (with mock data - no backend required!)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - The application loads with **mock data by default** - no backend required!

4. **Optional: Start the backend for live data**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --port 8000
   
   # Seed demo data
   python seed_demo.py
   ```
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - Use the "Live Data" toggle in the UI to switch to real API data

## 🎯 Mock Data Mode

The application includes comprehensive mock data that allows you to explore all features without setting up a backend:

### Features Available with Mock Data:
- **Dashboard**: Complete metrics overview with KPIs and charts
- **LLM Tracking**: Detailed trace analysis with filtering and time series
- **Agent Workflow**: Hierarchical span visualization and session analysis
- **Alerts**: Alert management with thresholds and severity levels
- **Real-time UI**: All interactive components work with mock data

### Toggle Between Modes:
- **Mock Data** (default): Instant loading with realistic demo data
- **Live Data**: Connect to backend API for real-time monitoring

The mock data includes:
- 200+ LLM traces across multiple models and providers
- 15 agent sessions with hierarchical spans
- 4 alert thresholds with various severity levels
- 8 active alerts with different states
- Time series data for charts and analytics

## 🌐 Free Frontend Deployment

Deploy your frontend for **FREE** using these platforms:

### 🚀 Vercel (Recommended)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set **Root Directory** to `frontend`
5. Deploy!

**Your app will be live at**: `https://your-project-name.vercel.app`

### 📋 Other Free Options
- **Netlify**: Drag & drop `frontend/dist/` folder
- **GitHub Pages**: Use included GitHub Actions workflow
- **Surge.sh**: `cd frontend && npm run build && npx surge dist`

### ✨ What You Get
- ✅ **Instant Demo**: Mock data works immediately
- ✅ **Professional UI**: Dynatrace-inspired design
- ✅ **All Features**: Dashboard, LLM Tracking, Agent Workflow, Alerts
- ✅ **Mobile Responsive**: Works on all devices
- ✅ **Fast Loading**: Global CDN delivery
- ✅ **Free Forever**: No costs or limits

📖 **Detailed Guide**: See [DEPLOY_FREE.md](DEPLOY_FREE.md)

## 🐳 Docker Deployment

```bash
docker compose up --build
```

This will start both frontend and backend services with automatic database initialization.

## 📊 Database Configuration

### SQLite (Default)
No additional setup required. Database file: `aiobs.db`

### PostgreSQL (Production)
Set environment variable:
```bash
export DATABASE_URL="postgresql+psycopg://user:password@localhost:5432/aiobs"
```

Install PostgreSQL driver:
```bash
pip install psycopg[binary]
```

## 🔧 API Endpoints

### Metrics
- `GET /metrics/summary` - Overall system metrics
- `GET /metrics/timeseries` - Time series data
- `GET /metrics/models/summary` - Model performance comparison
- `WebSocket /metrics/ws` - Real-time metrics updates

### Traces
- `GET /traces` - LLM trace history
- `POST /traces` - Create new trace
- `GET /traces/{id}` - Specific trace details

### Agent Workflow
- `GET /agents/sessions` - Agent session list
- `GET /agents/sessions/{id}/spans` - Session spans
- `GET /agents/sessions/{id}/analysis` - Root cause analysis
- `GET /agents/sessions/{id}/spans/tree` - Hierarchical span tree

### Alerts
- `GET /alerts` - Alert list
- `POST /alerts` - Create alert
- `POST /alerts/{id}/ack` - Acknowledge alert
- `POST /alerts/{id}/resolve` - Resolve alert
- `GET /alerts/thresholds` - Alert thresholds
- `WebSocket /alerts/ws` - Real-time alert notifications

## 🎨 UI Components

### Dashboard
- Real-time KPI cards with live updates
- Interactive charts for latency, cost, and token usage
- Model performance comparison
- Recent activity feed

### LLM Tracking
- Advanced filtering by model, provider, and time range
- Detailed trace table with expandable rows
- Time series analysis with multiple chart types
- Cost and performance analytics

### Agent Workflow
- Session management with status tracking
- Hierarchical trace visualization
- Root cause analysis with failure highlighting
- Performance bottleneck identification
- Token usage and cost breakdown

### Alerts & Monitoring
- Alert threshold management
- Real-time alert notifications
- Alert lifecycle tracking (acknowledge/resolve)
- Severity-based alert categorization

## 🔍 Key Features

### Real-Time Updates
- WebSocket connections for live metrics
- Automatic UI updates without page refresh
- Connection status indicators

### Advanced Analytics
- P95/P99 latency percentiles
- Token efficiency metrics
- Cost per token analysis
- Success rate tracking
- Error pattern detection

### Root Cause Analysis
- Automated failure detection
- Performance bottleneck identification
- Hierarchical span analysis
- Error message correlation

### Modern UI/UX
- Dynatrace-inspired design
- Dark theme with gradient backgrounds
- Responsive design for all screen sizes
- Interactive charts and visualizations
- Smooth animations and transitions

## 📈 Monitoring Capabilities

### LLM Metrics
- Response time distribution
- Token consumption patterns
- Cost analysis by model/provider
- Error rate monitoring
- Throughput analysis

### Agent Workflow
- Session duration tracking
- Span execution analysis
- Tool usage patterns
- Reasoning step visualization
- Performance optimization insights

### Alerting
- Configurable thresholds
- Multi-severity alert levels
- Real-time notifications
- Alert correlation
- Historical alert analysis

## 🚀 Production Considerations

### Performance
- Database indexing for large datasets
- Connection pooling for high concurrency
- Caching for frequently accessed data
- WebSocket connection management

### Security
- API authentication and authorization
- Input validation and sanitization
- Rate limiting for API endpoints
- Secure WebSocket connections

### Scalability
- Horizontal scaling with load balancers
- Database sharding for large datasets
- Microservices architecture
- Container orchestration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions, issues, or contributions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the code comments for implementation details

---

**Built with ❤️ for AI observability and monitoring**
