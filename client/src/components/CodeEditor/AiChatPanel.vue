<script lang="ts" setup>
import { ref, reactive, computed } from "vue";
import { FileSystem } from "@/lib/fileSystem/FileSystem";
import { serverMethods } from "@/lib/serverMethods";
import { processMessage, systemMessage } from "../aiEditor";

const props = defineProps({
  openFilePath: String,
  updateFileInEditor: Function,
  d : Object
});

const d = reactive({
  newChatMessageText: "",
  chatWidth: 300,
  dragging: false,
  openAIApiKey: localStorage.getItem("openAIApiKey") || "",
  messages: [],
  loadingMessage: false,
  streamingResponse: "",
  chatEditingFilePath: "",
  aiModel: "o3-mini",
  awaitingResponse: false,
});

function submitOpenAIApiKey() {
  let result = prompt("Enter your OpenAI API Key", d.openAIApiKey);
  if (result) {
    d.openAIApiKey = result;
    localStorage.setItem("openAIApiKey", result);
  }
}

function submitFalApiKey() {
  let result = prompt("Enter your FAL API Key", d.falApiKey);
  if (result) {
    props.d.falApiKey = result
    localStorage.setItem("falApiKey", result);
  }
}

async function submitChatMessage() {
  console.log("submitting chat message", d.newChatMessageText);

  // Ensure system instruction exists
  if (!d.messages.some((msg) => msg.role === "system")) {
    d.messages.unshift({
      role: "system",
      content: systemMessage
    });
  }

  // Retrieve current file content
  const currentFileResult = await FileSystem.getFile(props.openFilePath);
  const fileContent = new TextDecoder().decode(currentFileResult.content);
  let fileSubmit =
`<turbobuilt_file path="${props.openFilePath}">
${fileContent.split("\n").map((line, index) => {
  return `${index + 1}${line}`;
}).join("\n")}
</turbobuilt_file>`;


  // Prepare the chat message with the current file attached
  d.chatEditingFilePath = props.openFilePath;
  if (!d.messages.some((msg) => msg.file)) {
    d.messages.push({
      role: "user",
      content: fileSubmit,
      file: true
    })
  } else {
    d.messages.find((msg) => msg.content.includes("<turbobuilt_file path=")).content = fileSubmit;
  }

  const userMessage = reactive({
    role: "user",
    content: d.newChatMessageText,
  });
  d.messages.push(userMessage);
  console.log("messages", d.messages);

  d.newChatMessageText = "";
  d.streamingResponse = "";
  d.loadingMessage = true;

  try {
    d.awaitingResponse = true;
    let result = await serverMethods.aiChat.submitChat(
      d.openAIApiKey, "openai", d.aiModel, d.messages
    );
    const responseMessage = reactive({ role: "assistant", content: "" });
    d.messages.push(responseMessage);
    const reader = result.data.body.getReader();
    const decoder = new TextDecoder();

    // Buffer for incoming chunks used for stream processing
    let messageBuffer = "";

    let fullMessage = "";
    let lastUpdate = Date.now();

    function processBuffer() {
      let match;
      while ((match = /^M (\d+) /.exec(messageBuffer)) !== null) {
        const messageLength = parseInt(match[1]);
        const headerLength = match[0].length;
        const frame = messageBuffer.slice(headerLength, headerLength + messageLength);
        if (frame.length !== messageLength) {
          // Incomplete message, wait for more data
          return;
        }
        messageBuffer = messageBuffer.slice(headerLength + messageLength);
        fullMessage += frame;
        if (Date.now() - lastUpdate > 500) {
          lastUpdate = Date.now();
          processMessage(fullMessage, false, responseMessage, fileContent, props.updateFileInEditor, d);
        }
      }
    }

    // Chunks may be broken; header format: "M {charLength} " followed by content
    while (true) {
      const { done, value } = await reader.read();
      d.awaitingResponse = false;
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      // Append to buffers
      messageBuffer += chunk;
      processBuffer();
    }
    await setTimeout(() => { }, 500);
    // Final call with complete flag true.
    await processMessage(fullMessage, true, responseMessage, fileContent, props.updateFileInEditor, d);
  } catch (err) {
    console.error(err);
  } finally {
    d.awaitingResponse = false;
    d.loadingMessage = false;
  }
}

function resetChat() {
  d.messages = [];
  d.awaitingResponse = false;
  d.newChatMessageText = "";
  d.chatEditingFilePath = "";
}

const messagesFiltered = computed(() => {
  return d.messages.filter((msg) => msg.role !== "system" && !msg.file);
});

// Drag handlers for resizing
let startX = 0;
let startWidth = 0;

function handleDragStart(e) {
  d.dragging = true;
  startX = e.clientX;
  startWidth = d.chatWidth;
}

function handleDrag(e) {
  if (!e.clientX) return;
  d.chatWidth = startWidth - (e.clientX - startX);
}

function handleDragEnd() {
  d.dragging = false;
}
</script>

<template>
  <div class="ai-chat" :style="{ width: d.chatWidth + 'px' }">
    <div class="chat-header">
      <h3>AI Assistant</h3>
      <button v-if="d.messages.length > 0" class="reset-button" @click="resetChat()">
        Reset
      </button>
    </div>
    
    <div class="chats" id="chat-window">
      <div v-if="!d.openAIApiKey" class="api-key-container">
        <p>Please provide your OpenAI API key to use the AI assistant</p>
        <button class="api-key-button" @click="submitOpenAIApiKey">Set API Key</button>
      </div>
      <div v-if="!props.d.falApiKey" class="api-key-container">
        <p>Please provide your fal.ai API key to make images</p>
        <button class="api-key-button" @click="submitFalApiKey">Set API Key</button>
      </div>
      
      
      <!-- Model Selector Dropdown -->
      <div class="model-selector">
        <label>Chat Model:</label>
        <select v-model="d.aiModel" class="ai-model-selector">
          <option value="gpt-4o-mini">gpt-4o-mini</option>
          <option value="gpt-4o">gpt-4o</option>
          <option value="o3-mini">o3-mini</option>
          <option value="o1-mini">o1-mini</option>
        </select>
      </div>
      
      <!-- Chat log with bubbles -->
      <div class="chat-log">
        <div v-for="(message, index) in messagesFiltered" :key="index"
            :class="['chat-bubble', message.role === 'user' ? 'user' : 'ai']">
          {{ message.content }}
        </div>
        <div v-if="d.awaitingResponse" class="chat-bubble ai loading">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
    <div class="chat-input">
      <textarea
          :disabled="!d.openAIApiKey || d.loadingMessage"
          v-model="d.newChatMessageText" 
          placeholder="Type a message..."
          @keydown.tab="submitChatMessage"
          rows="3"
      ></textarea>
      <button 
          :disabled="!d.openAIApiKey || d.loadingMessage || !d.newChatMessageText.trim()" 
          @click="submitChatMessage"
          class="send-button">
        Send
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.ai-chat {
  display: flex;
  flex-direction: column;
  border-left: 1px solid #eaeaea;
  overflow: hidden;
  height: 100%;
  background-color: #f9f9f9;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f1f1f1;
  border-bottom: 1px solid #e0e0e0;
  
  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
  }
  
  .reset-button {
    background-color: transparent;
    border: 1px solid #d1d1d1;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
    
    &:hover {
      background-color: #e9e9e9;
    }
  }
}

.api-key-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  margin: 20px 0;
  background-color: #f0f0f0;
  border-radius: 8px;
  
  p {
    margin-bottom: 15px;
    text-align: center;
    color: #555;
  }
}

.api-key-button {
  background-color: #4285f4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  
  &:hover {
    background-color: #3367d6;
  }
}

.chats {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
}

.model-selector {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
  
  label {
    margin-right: 10px;
    font-size: 14px;
    color: #555;
  }
  
  .ai-model-selector {
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid #ccc;
    background-color: white;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #4285f4;
    }
  }
}

.chat-log {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-bubble {
  padding: 12px;
  border-radius: 12px;
  max-width: 85%;
  white-space: pre-wrap;
  line-height: 1.4;
  
  &.user {
    background-color: #E3F2FD;
    color: #333;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }
  
  &.ai {
    background-color: #f1f1f1;
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }
  
  &.loading {
    padding: 8px 16px;
  }
}

.typing-indicator {
  display: flex;
  align-items: center;
  
  span {
    height: 8px;
    width: 8px;
    border-radius: 50%;
    background-color: #888;
    margin: 0 2px;
    animation: bounce 1.5s infinite ease-in-out;
    
    &:nth-child(1) {
      animation-delay: 0s;
    }
    
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    &:nth-child(3) {
      animation-delay: 0.4s;
    }
  }
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-6px);
  }
}

.chat-input {
  padding: 12px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  
  textarea {
    resize: none;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 10px;
    font-size: 14px;
    margin-bottom: 8px;
    
    &:focus {
      outline: none;
      border-color: #4285f4;
    }
    
    &:disabled {
      background-color: #f5f5f5;
      color: #888;
    }
  }
  
  .send-button {
    align-self: flex-end;
    background-color: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    
    &:hover:not(:disabled) {
      background-color: #3367d6;
    }
    
    &:disabled {
      background-color: #a8c7fa;
      cursor: not-allowed;
    }
  }
}
</style>
