# AI-First CRM HCP Module

An intelligent CRM platform for life science field representatives to log, search, edit, and track interactions with Healthcare Professionals (HCPs) using a dual-mode React UI and a LangGraph orchestration engine.

## Tech Stack
- **Frontend:** React, Redux Toolkit, Axios, Google Inter Font
- **Backend:** Python, FastAPI, SQLAlchemy, PyMySQL
- **AI Agent Framework:** LangGraph, LangChain Core
- **LLM Engine:** Groq (Llama-3.3-70b-versatile)
- **Database:** MySQL

## How to Run
1. **Database Setup:** Create a MySQL schema named `crm_db`.
2. **Backend Setup:**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   export GROQ_API_KEY="your_api_key"
   python main.py
   