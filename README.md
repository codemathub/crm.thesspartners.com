# EstateFlow CRM - Web Admin Dashboard

Production React 18 + TypeScript + Vite web dashboard for EstateFlow CRM administrators and management.

## Features
- **Live Inventory Management**: Detailed property cards, owner contacts, status manager, Excel bulk import.
- **Customer 360° Directory**: Full historical dossiers, timeline of interactions, and lead requirement matching.
- **Daily Schedule & Follow-ups**: Site showings, client callbacks, and open claim pools.
- **Operational Directives & SLAs**: Role-based task assignments, announcement broadcasting, and audit logging.

## Setup & Running
1. Install dependencies:
   ```bash
   npm install
   ```
2. Development server:
   ```bash
   npm run dev
   ```
3. Production build:
   ```bash
   npm run build
   # Outputs optimized static files to /dist ready for Nginx
   ```

## Production Configuration
- Production domain: `https://crm.thesspartners.com`
- Configure `VITE_API_BASE_URL` in `.env.production`
