# 🧭 Visual System Map Tool

A developer-oriented visual tool for documenting and exploring all events, processes, and functionalities across a system, built with **Vue.js** (frontend) and **Laravel** (backend).

## ✨ Features

- **Interactive Canvas**: Drag-and-drop visual editor using Drawflow.js
- **Node Management**: Create various node types (Events, Processes, APIs, Databases, etc.)
- **Visual Connections**: Connect nodes with directional links
- **Metadata Storage**: Rich node metadata including descriptions, tags, owners, and documentation
- **Search & Filter**: Find nodes by keywords, tags, or types with highlighting
- **Diagram Management**: Save, load, duplicate, and version control diagrams
- **Responsive Design**: Works on desktop and tablet devices
- **Real-time Updates**: Live canvas interactions with pan, zoom, and grid features

## 🚀 Getting Started

### Prerequisites

- PHP 8.1+ with Composer
- Node.js 18+ with npm
- MySQL or PostgreSQL database

### Backend Setup (Laravel)

```bash
cd backend

# Install dependencies
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Configure database in .env file
# DB_CONNECTION=mysql
# DB_DATABASE=visual-systems
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# Run migrations
php artisan migrate

# Start development server
php artisan serve
```

The backend will be available at `http://localhost:8000`

### Frontend Setup (Vue.js)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 🛠 Tech Stack

### Backend
- **Laravel 11** - PHP framework
- **MySQL/PostgreSQL** - Database
- **Laravel Sanctum** - Authentication
- **Custom Services** - LogService, ResponseService

### Frontend
- **Vue.js 3** - Progressive framework with Composition API
- **Vite** - Build tool and dev server
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Drawflow.js** - Interactive canvas engine
- **TailwindCSS** - Utility-first CSS framework
- **Lucide Vue** - Beautiful icons
- **Axios** - HTTP client

## 📊 Database Schema

### `diagrams` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint (PK) | Unique identifier |
| `title` | string | Diagram name |
| `description` | text | Short overview |
| `data` | json | All nodes, connections, and metadata |
| `tags` | json | Searchable tags |
| `created_by` | bigint | User ID (FK to users) |
| `version` | integer | Version tracking |
| `is_active` | boolean | Soft delete flag |
| `created_at` | timestamp | Creation time |
| `updated_at` | timestamp | Last modification time |

## 🎯 Node Types

- **⚡ Event** - User interactions, triggers, webhooks
- **⚙️ Process** - Business logic, functions, procedures  
- **🔗 API** - REST endpoints, GraphQL queries
- **🗄️ Database** - Tables, collections, storage
- **❓ Decision** - Conditional logic, branching
- **🌐 External** - Third-party services, integrations

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET /api/diagrams` | List all diagrams with pagination |
| `GET /api/diagrams/{id}` | Fetch a single diagram |
| `POST /api/diagrams` | Create new diagram |
| `PUT /api/diagrams/{id}` | Update diagram |
| `DELETE /api/diagrams/{id}` | Soft delete diagram |
| `POST /api/diagrams/{id}/duplicate` | Duplicate diagram |

### Example Node Data Structure

```json
{
  "nodes": [
    {
      "id": "event_user_login",
      "type": "Event",
      "label": "User Login",
      "position": { "x": 120, "y": 180 },
      "details": {
        "description": "Triggered when a user logs in",
        "api": "/api/login",
        "owner": "Backend Team",
        "tags": ["authentication", "security"],
        "notes": "Implements rate limiting"
      }
    }
  ],
  "connections": [
    { "from": "event_user_login", "to": "process_auth" }
  ]
}
```

## 🎨 Canvas Features

- **Node Creation**: Click toolbar buttons to add nodes
- **Connections**: Drag from output to input points
- **Pan & Zoom**: Mouse wheel and drag to navigate
- **Grid**: Toggle background grid for alignment
- **Mini-map**: Overview navigation in top-right corner
- **Search**: Filter and highlight nodes in real-time
- **Selection**: Click nodes to open metadata editor

## 🔍 Search & Filter

- **Text Search**: Find nodes by title or description
- **Tag Filtering**: Filter by multiple tags
- **Type Filtering**: Show specific node types
- **Highlighting**: Visual indication of filtered results

## 🚧 Future Enhancements

- [ ] **Real-time Collaboration** - Multi-user editing with WebSockets
- [ ] **Export Options** - PDF, PNG, JSON export
- [ ] **Code Scanner** - Auto-generate maps from codebase
- [ ] **AI Integration** - Smart suggestions and flow analysis
- [ ] **Access Control** - Team permissions and sharing
- [ ] **Comment System** - Collaborative annotations
- [ ] **Analytics Dashboard** - Usage insights and metrics
- [ ] **Templates** - Pre-built diagram templates
- [ ] **Version History** - Visual diff and rollback
- [ ] **API Integration** - Import from OpenAPI specs

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Drawflow.js](https://github.com/jerosoler/Drawflow) for the canvas engine
- [Laravel](https://laravel.com/) for the robust backend framework
- [Vue.js](https://vuejs.org/) for the reactive frontend framework
- [TailwindCSS](https://tailwindcss.com/) for the utility-first styling

---

**🎯 Vision**: A living, interactive map that becomes the "brain" of your codebase — where developers can explore, understand, and document everything visually.# visual-system-map-tool
# visual-system-map-tool
