import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async action to send messages to your running FastAPI backend
export const sendMessageToAgent = createAsyncThunk(
  'crm/sendMessageToAgent',
  async (messageText, { rejectWithValue }) => {
    try {
      const response = await axios.post('http://localhost:8080/api/chat', {
        message: messageText
      });
      return response.data.response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || "Failed to reach AI Agent.");
    }
  }
);

const crmSlice = createSlice({
  name: 'crm',
  initialState: {
    isChatView: true, // Toggle between Form view and Chat view
    chatHistory: [
      { sender: 'agent', text: 'Hello! I am your AI HCP companion. Tell me about your doctor visit, or ask me to find history, update entries, or recommend follow-ups.' }
    ],
    formFields: {
      hcpName: '',
      interactionDate: '',
      discussionTopics: '',
      nextSteps: '',
      summary: ''
    },
    loading: false,
    error: null
  },
  reducers: {
    toggleView: (state) => {
      state.isChatView = !state.isChatView;
    },
    updateFormField: (state, action) => {
      const { field, value } = action.payload;
      state.formFields[field] = value;
    },
    clearForm: (state) => {
      state.formFields = { hcpName: '', interactionDate: '', discussionTopics: '', nextSteps: '', summary: '' };
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessageToAgent.pending, (state, action) => {
        state.loading = true;
        state.chatHistory.push({ sender: 'user', text: action.meta.arg });
      })
      .addCase(sendMessageToAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.chatHistory.push({ sender: 'agent', text: action.payload });
      })
      .addCase(sendMessageToAgent.rejected, (state, action) => {
        state.loading = false;
        state.chatHistory.push({ sender: 'agent', text: `⚠️ Error: ${action.payload}` });
      });
  }
});

export const { toggleView, updateFormField, clearForm } = crmSlice.actions;
export default crmSlice.reducer;
