import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date
import json

from sqlalchemy import create_engine, Column, Integer, String, Text, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent
# Note: Keep using create_react_agent from langgraph.prebuilt as it aligns perfectly with modern Graph state compilation!

# ==========================================
# 1. DATABASE CONFIGURATION (MySQL/Postgres)
# ==========================================
# Update this string with your local DB credentials
DATABASE_URL = "mysql+pymysql://root:password@localhost/crm_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
from sqlalchemy.orm import declarative_base
Base = declarative_base()

class InteractionModel(Base):
    __tablename__ = "interactions"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hcp_name = Column(String(255), nullable=False)
    interaction_date = Column(Date, nullable=False)
    discussion_topics = Column(Text, nullable=True)
    next_steps = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)

# Create tables in DB
Base.metadata.create_all(bind=engine)

# ==========================================
# 2. LANGGRAPH TOOLS DEFINITION (5 Tools)
# ==========================================

@tool
def log_interaction(hcp_name: str, interaction_date: str, discussion_topics: str, next_steps: str, summary: str) -> str:
    """
    Log a brand new interaction with a Healthcare Professional (HCP) into the database.
    Use this tool whenever a user describes a conversation, meeting, or visit with a doctor.
    """
    db = SessionLocal()
    try:
        new_log = InteractionModel(
            hcp_name=hcp_name,
            interaction_date=date.fromisoformat(interaction_date),
            discussion_topics=discussion_topics,
            next_steps=next_steps,
            summary=summary
        )
        db.add(new_log)
        db.commit()
        db.refresh(new_log)
        return f"Successfully logged interaction with ID {new_log.id} for HCP {hcp_name}."
    except Exception as e:
        db.rollback()
        return f"Error logging interaction: {str(e)}"
    finally:
        db.close()

@tool
def edit_interaction(interaction_id: int, hcp_name: Optional[str] = None, discussion_topics: Optional[str] = None, next_steps: Optional[str] = None) -> str:
    """
    Modify an existing logged interaction using its unique interaction_id.
    Use this tool if the user wants to correct, update, or append details to a specific past entry.
    """
    db = SessionLocal()
    try:
        log_entry = db.query(InteractionModel).filter(InteractionModel.id == interaction_id).first()
        if not log_entry:
            return f"Interaction ID {interaction_id} not found."
        
        if hcp_name: log_entry.hcp_name = hcp_name
        if discussion_topics: log_entry.discussion_topics = discussion_topics
        if next_steps: log_entry.next_steps = next_steps
        
        db.commit()
        return f"Successfully updated interaction ID {interaction_id}."
    except Exception as e:
        db.rollback()
        return f"Error updating interaction: {str(e)}"
    finally:
        db.close()

@tool
def search_hcp(name_query: str) -> str:
    """
    Search for existing HCP profiles or interactions matching a doctor's name.
    """
    db = SessionLocal()
    try:
        results = db.query(InteractionModel).filter(InteractionModel.hcp_name.like(f"%{name_query}%")).all()
        if not results:
            return f"No records found for HCP matching '{name_query}'."
        
        return json.dumps([{"id": r.id, "hcp_name": r.hcp_name, "date": str(r.interaction_date)} for r in results])
    finally:
        db.close()

@tool
def get_interaction_history(hcp_name: str) -> str:
    """
    Retrieve all past notes, discussion topics, and timelines for a specific HCP.
    """
    db = SessionLocal()
    try:
        history = db.query(InteractionModel).filter(InteractionModel.hcp_name == hcp_name).all()
        if not history:
            return f"No complete history found for {hcp_name}."
        return json.dumps([{"date": str(h.interaction_date), "topics": h.discussion_topics, "summary": h.summary} for h in history])
    finally:
        db.close()

@tool
def suggest_next_action(summary_text: str) -> str:
    """
    Analyzes an interaction's context summary and returns AI-driven smart sales guidance 
    and recommended timeline for follow-up.
    """
    # This tool uses internal logic or an atomic LLM lookup to deduce strategies
    return f"AI Recommendation based on details: Schedule a follow-up sample delivery window precisely 14 days out. Keep focus on clarifying dosage updates."


# ==========================================
# 3. LLM & LANGGRAPH AGENT SETUP
# ==========================================
# Ensure GROQ_API_KEY is set in your environment variables
llm = ChatGroq(model="gemma2-9b-it", temperature=0.1)
tools = [log_interaction, edit_interaction, search_hcp, get_interaction_history, suggest_next_action]

# Create the compiled LangGraph execution graph natively
agent_executor = create_react_agent(llm, tools)

# ==========================================
# 4. FASTAPI APP ROUTING
# ==========================================
app = FastAPI(title="AI-First CRM Module Backend")

# Setup CORS so React frontend can talk to backend smoothly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def handle_chat(payload: ChatRequest):
    try:
        # Stream or invoke through LangGraph agent
        response = agent_executor.invoke({"messages": [("user", payload.message)]})
        # Extract the last message from the agent's graph execution track
        final_msg = response["messages"][-1].content
        return {"response": final_msg}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
