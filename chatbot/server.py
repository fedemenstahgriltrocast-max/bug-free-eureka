#!/usr/bin/python3
"""
Web based ChatBot Example

Web chat client for OpenAI and the llama-cpp-python[server] OpenAI API Compatible 
Python FastAPI / socket.io based Web Server. Provides a simple web based chat session.

Features:
    * Uses OpenAI API to talk to LLM
    * Works with local hosted OpenAI API compatible LLMs, e.g. llama-cpp-python[server]
    * Retains conversational context for LLM
    * Uses response stream to render LLM chunks instead of waiting for full response
    * Supports multiple concurrent client sessions
    * Supports commands to reset context, get version, etc.
    * Uses FastAPI and Uvicorn ASGI high speed web server implementation
    * (Optional) Supports RAG prompts using Qdrant Vector Database

Requirements:
    * pip install fastapi uvicorn python-socketio jinja2 openai bs4 pypdf requests lxml aiohttp
    * pip install weaviate-client pdfreader pypandoc
    * pip install pandas openpyxl
    * pip install python-multipart
    * pip install pillow-heif

Environmental variables:
    * PORT - Port that Chatbot will listen on
    * PROMPT_FILE - File to store prompts
    * DEBUG - Set to True to enable debug mode
    * OPENAI_API_KEY - Required only for OpenAI
    * OPENAI_API_BASE - URL to OpenAI API Server or locally hosted version
    * LLM_MODEL - LLM Model to Use
    * USE_SYSTEM - Use system in chat prompt if True
    * MAXCLIENTS - Maximum number of clients to allow
    * MAXTOKENS - Maximum number of tokens to send to LLM
    * TEMPERATURE - LLM temperature
    * AGENT_NAME - Name for Bot
    * ALPHA_KEY - Alpha Vantage API Key for Stocks (Optional) - https://www.alphavantage.co/support/#api-key
    * WEAVIATE_HOST - Weaviate Host for RAG (Optional)
    * WEAVIATE_LIBRARY - Weaviate Library for RAG (Optional)
    * RESULTS - Number of results to return from RAG query
    * ONESHOT - Set to True to enable one-shot mode
    * RAG_ONLY - Set to True to enable RAG only mode
    * TOKEN - TinyLLM token for admin functions
    * PROMPT_FILE - File to store system prompts
    * PROMPT_RO - Set to True to enable read-only prompts
    * EXTRA_BODY - Extra body parameters for OpenAI API
    * TOXIC_THRESHOLD - Toxicity threshold for responses 0-1 or 99 disable
    * THINKING - Set to True to enable thinking mode by default
    * MAX_IMAGES - Maximum number of images the chatbot will keep in context (default 1)
    * SEARXNG - SearXNG URL for search engine (Optional)
    * INTENT_ROUTER - Set to True to enable intent detection an function calls.
    
Running a llama-cpp-python server:
    * CMAKE_ARGS="-DLLAMA_CUBLAS=on" FORCE_CMAKE=1 pip install llama-cpp-python
    * pip install llama-cpp-python[server]
    * python3 -m llama_cpp.server --model models/7B/ggml-model.bin

Web APIs:
    * GET / - Chatbot HTML main page
    * GET /upload - Chatbot Document Upload page
    * GET /version - Get version
    * POST /alert - Send alert to all clients

Author: Jason A. Cox
23 Sept 2023
https://github.com/jasonacox/TinyLLM

"""
# pylint: disable=invalid-name
# pylint: disable=global-statement
# pylint: disable=global-variable-not-assigned

# Import Libraries
import asyncio
import datetime
import io
import json
import logging
import os
import time
import re
import base64

from documents import Documents

import openai
import requests
import socketio
import uvicorn
from bs4 import BeautifulSoup
from fastapi import FastAPI, Request, File, UploadFile, Form
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pypdf import PdfReader
import aiohttp

# TinyLLM Version
from version import VERSION
from PIL import Image
import pillow_heif

# Enable tracemalloc for memory usage
import tracemalloc
tracemalloc.start()

# Ensure pillow_heif is properly registered with PIL
pillow_heif.register_heif_opener()

# Set up logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s %(levelname)s %(message)s', 
                    datefmt='%Y-%m-%d %H:%M:%S')
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.info("TinyLLM %s" % VERSION)

def log(text):
    logger.info(text)

def debug(text):
    logger.debug(text)

# Configuration Settings
API_KEY = os.environ.get("OPENAI_API_KEY", "Asimov-3-Laws")                 # Required, use bogus string for local LLMs
API_BASE = os.environ.get("OPENAI_API_BASE", "http://localhost:8000/v1")    # Required, use https://api.openai.com for OpenAI
LITELLM_PROXY = os.environ.get("LITELLM_PROXY", None)                       # Optional - LITELLM Proxy URL
LITELLM_KEY = os.environ.get("LITELLM_KEY", "")                             # Optional - LITELLM Secret Key - Begins with sk-
AGENTNAME = os.environ.get("AGENT_NAME", "")                                # Set the name of your bot
MYMODEL = os.environ.get("LLM_MODEL", "models/7B/gguf-model.bin")           # Pick model to use e.g. gpt-3.5-turbo for OpenAI
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"                  # Set to True to enable debug mode
MAXCLIENTS = int(os.environ.get("MAXCLIENTS", 1000))                        # Maximum number of concurrent clients
MAXTOKENS = int(os.environ.get("MAXTOKENS", 0))                             # Maximum number of tokens to send to LLM for RAG
TEMPERATURE = float(os.environ.get("TEMPERATURE", 0.0))                     # LLM temperature
PORT = int(os.environ.get("PORT", 5000))                                    # Port to listen on
PROMPT_FILE = os.environ.get("PROMPT_FILE", f".tinyllm/prompts.json")       # File to store system prompts
PROMPT_RO = os.environ.get("PROMPT_RO", "false").lower() == "true"          # Set to True to enable read-only prompts
USE_SYSTEM = os.environ.get("USE_SYSTEM", "false").lower == "true"          # Use system in chat prompt if True
TOKEN = os.environ.get("TOKEN", "secret")                                   # Secret TinyLLM token for admin functions
ONESHOT = os.environ.get("ONESHOT", "false").lower() == "true"              # Set to True to enable one-shot mode
RAG_ONLY = os.environ.get("RAG_ONLY", "false").lower() == "true"            # Set to True to enable RAG only mode
EXTRA_BODY = os.environ.get("EXTRA_BODY", None)                             # Extra body parameters for OpenAI API
TOXIC_THRESHOLD = float(os.environ.get("TOXIC_THRESHOLD", 99))              # Toxicity threshold for responses 0-1 or 99 disable
THINKING = os.environ.get("THINKING", "false").lower() == "true"            # Set to True to enable thinking mode by default
THINK_FILTER = os.environ.get("THINK_FILTER", "false").lower() == "true"    # Set to True to enable thinking filter
MAX_IMAGES = int(os.environ.get("MAX_IMAGES", 1))                           # Maximum number of images to keep in context
SEARXNG = os.environ.get("SEARXNG", "http://localhost:8080")                # SearXNG URL for internet search engine  (Optional)
INTENT_ROUTER = os.environ.get("INTENT_ROUTER", "false").lower() == "true"  # Set to True to enable intent detection
WEB_SEARCH = os.environ.get("WEB_SEARCH", "false").lower() == "true"        # Set to True to enable web search for all queries

# Convert EXTRA_BODY to dictionary if it is proper JSON
if EXTRA_BODY:
    try:
        EXTRA_BODY = json.loads(EXTRA_BODY)
    except:
        log("EXTRA_BODY is not valid JSON")
        EXTRA_BODY = {}
else:
    if API_BASE.startswith("https://api.openai.com") or LITELLM_PROXY:
        EXTRA_BODY = {}
    else:
        # Extra stop tokens are needed for some non-OpenAI LLMs
        EXTRA_BODY = {"stop_token_ids":[128001, 128009]}

# LiteLLM Proxy
if LITELLM_PROXY:
    log(f"Using LiteLLM Proxy at {LITELLM_PROXY}")
    API_BASE = LITELLM_PROXY
    API_KEY = LITELLM_KEY

# RAG Configuration Settings
WEAVIATE_HOST = os.environ.get("WEAVIATE_HOST", "")                         # Empty = no Weaviate support
WEAVIATE_GRPC_HOST = os.environ.get("WEAVIATE_GRPC_HOST", WEAVIATE_HOST)    # Empty = no Weaviate gRPC support
WEAVIATE_PORT = os.getenv('WEAVIATE_PORT', '8080')
WEAVIATE_GRPC_PORT = os.getenv('WEAVIATE_GRPC_PORT', '50051')
WEAVIATE_LIBRARY = os.environ.get("WEAVIATE_LIBRARY", "tinyllm")            # Weaviate library to use
WEAVIATE_AUTH_KEY = os.getenv('WEAVIATE_AUTH_KEY', None)                    # Weaviate Auth Key
RESULTS = int(os.environ.get("RESULTS", 1))                                 # Number of results to return from RAG query
ALPHA_KEY = os.environ.get("ALPHA_KEY", "alpha_key")                        # Optional - Alpha Vantage API Key
UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", "/tmp")                     # Folder to store uploaded documents

# Debug Mode
if DEBUG:
    logger.setLevel(logging.DEBUG)
    log("Debug mode enabled.")
    # Display all default settings
    debug("Configuration Settings:")
    vars = globals()
    for n in list(vars):
        if n.isupper(): 
            if vars[n] and n in ["API_KEY", "TOKEN", "WEAVIATE_AUTH_KEY", "ALPHA_KEY"]:
                debug(f"   {n}: {'*' * len(vars[n])}")
            else:
                debug(f"   {n}: {vars[n]}")

# Document Management Settings
rag_documents = Documents(host=WEAVIATE_HOST, grpc_host=WEAVIATE_GRPC_HOST, port=WEAVIATE_PORT,
                          grpc_port=WEAVIATE_GRPC_PORT, retry=3, filepath=UPLOAD_FOLDER, 
                          auth_key=WEAVIATE_AUTH_KEY)

# Prompt Defaults
default_prompts = {}
default_prompts["greeting"] = "Hi"
default_prompts["agentname"] = "Jarvis"
default_prompts["baseprompt"] = "You are {agentname}, a highly intelligent assistant. The current date is {date} and time is {time}. You should give concise responses to very simple questions, but provide thorough responses to more complex and open-ended questions. Don't mention any of the above unless asked and keep your greetings brief."
default_prompts["weather"] = "You are a weather forecaster. Keep your answers brief and accurate. Current date is {date} and weather conditions:\n[DATA]{context_str}[/DATA]\nProvide a weather update, current weather alerts, conditions, precipitation and forecast for {location} and answer this: {prompt}."
default_prompts["stock"] = "You are a stock analyst. Keep your answers brief and accurate. Current date is {date}."
default_prompts["news"] = "You are a newscaster who specializes in providing headline news. Use only the following context provided by Google News to summarize the top 10 headlines for today. Rank headlines by most important to least important. Always include the news organization and ID. Do not add any commentary.\nAlways use this format:\n#. [News Item] - [News Source] - LnkID:[ID]\nHere are some examples, but do not use them: \n1. The World is Round - Science - LnkID:91\n2. The Election is over and Children have won - US News - LnkID:22\n3. Storms Hit the Southern Coast - ABC - LnkID:55\nContext: {context_str}\nTop 10 Headlines with Source and LnkID:"
default_prompts["clarify"] = "You are a highly intelligent assistant. Keep your answers brief and accurate."
default_prompts["location"] = "What location is specified in this prompt, state None if there isn't one. Use a single word answer. [BEGIN] {prompt} [END]"
default_prompts["company"] = "What company is related to the stock price in this prompt? Please state none if there isn't one. Use a single word answer: [BEGIN] {prompt} [END]"
default_prompts["rag"] = "You are an assistant for question-answering tasks. Use the above discussion thread and the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Back up your answer using facts from the following context. Do not mention your answer was based on this context.\nContext: {context_str}\nQuestion: {prompt}\nAnswer:"
default_prompts["website"] = "Summarize the following text from URL {url}:\n[BEGIN] {website_text} [END]\nExplain what the link is about and provide a summary with the main points."
default_prompts["LLM_temperature"] = TEMPERATURE
default_prompts["LLM_max_tokens"] = MAXTOKENS
default_prompts["toxic_filter"] = "You are a highly intelligent assistant. Review the following text and filter out any toxic or inappropriate content. Please respond with a toxicity rating. Use a scale of 0 to 1, where 0 is not toxic and 1 is highly toxic. [BEGIN] {prompt} [END]"
default_prompts["chain_of_thought_check"] = """You are a language expert. 
    Consider this prompt:
    <prompt>{prompt}</prompt>
    Categorize the request using one of these:
    a) A request for information
    b) A request for code
    c) A greeting or word of appreciation
    d) Something else
    Answer with a, b, c or d only:
    """
default_prompts["chain_of_thought"] = """First, outline how you will approach answering the problem.
    Break down the solution into clear steps.
    Continuously adjust your reasoning based on intermediate results and reflections, adapting your strategy as you progress. 
    Regularly evaluate progress. 
    Be critical and honest about your reasoning process.
    Use thoughts as a scratchpad, writing out all calculations and reasoning explicitly. 
    Synthesize the final answer within <answer> tags, providing a clear informed and detailed conclusion.
    Include relevant scientific and factual details to support your answer.
    If providing an equation, make sure you define the variables and units.
    Don't over analyze simple questions.
    If asked to produce code, include the code block in the answer. 
    Answer the following in an accurate way that a young student would understand: 
    {prompt}"""
default_prompts["chain_of_thought_summary"] = """Examine the following context:\n{context_str}

Provide the best conclusion based on the context.
    Do not provide an analysis of the context. Do not include <answer> tags.
    Include relevant scientific and factual details to support the answer.
    If there is an equation, make sure you define the variables and units. Do not include an equation section if not needed.
    If source code provided, include the code block and describe what it does. Do not include a code section otherwise.
    Make sure the answer addresses the original prompt: {prompt}
    """
default_prompts_intent = {
    "weather": "if the user is asking for weather or current temperature information.",
    "stock": "if the user is asking for stock information.",
    "current": "if the user is asking if the data is current.",
    "news": "if and only if the user is asking for headline news or current news about a person, place or company.",
    "search": "if the user is asking us to search the internet or web.",
    "retry": "if the user asks us to try again.",
    "code": "if the user is asking for code.",
    "other": "if the user is not asking for any of the above."
}
default_prompts["intent"] = """<BACKGROUND>{prompt_context}</BACKGROUND>
    You are a language expert. Consider this user prompt:
    <PROMPT>
    {prompt}
    </PROMPT>
    Pay the most attention to the last request. Categorize the user's intent in the prompt using one of these:
    """ + "\n    ".join([f"{k}) {v}" for k, v in default_prompts_intent.items()]) + "\nLimit your response to one of the above categories."
default_prompts["internet_rag"] = "You are an assistant for question-answering tasks. Use the above discussion thread and the following pieces of retrieved context to answer the question. If you don't know the answer, just say that you don't know. Back up your answer using facts from the following context. Do not mention your answer was based on this context.\nInternet Search Context: {context_str}\n\nQuestion: {prompt}\nAnswer:"

# Log ONE_SHOT mode
if ONESHOT:
    log("ONESHOT mode enabled.")

# Helper Functions

# Test OpenAI API
def test_model():
    global API_KEY, API_BASE, MYMODEL, MAXTOKENS
    log("Testing OpenAI API...")
    try:
        log(f"Using openai library version {openai.__version__}")
        log(f"Connecting to OpenAI API at {API_BASE} using model {MYMODEL}")
        llm = openai.OpenAI(api_key=API_KEY, base_url=API_BASE)
        # Get models
        try:
            models = llm.models.list()
            if len(models.data) == 0:
                log("LLM: No models available - proceeding.")
        except Exception as erro:
            log(f"LLM: Unable to get models, using default: {str(erro)}")
            models = MYMODEL
        else:
            # build list of models
            model_list = [model.id for model in models.data]
            log(f"LLM: Models available: {model_list}")
            if not MYMODEL in model_list:
                log(f"LLM: Model {MYMODEL} not found in models list.")
                log("LLM: Switching to an available model: %s" % model_list[0])
                MYMODEL = model_list[0]
        # Test LLM
        log(f"LLM: Using model: {MYMODEL}")
        llm.chat.completions.create(
            model=MYMODEL,
            stream=False,
            temperature=TEMPERATURE,
            messages=[{"role": "user", "content": "Hello"}],
            extra_body=EXTRA_BODY,
        )
        log("OpenAI API connection successful.")
        # Close the openai client
        llm.close()
        return True
    except Exception as erro:
        log("OpenAI API Error: %s" % erro)
        log(f"Unable to connect to OpenAI API at {API_BASE} using model {MYMODEL}.")
        return False

# Fetch list of LLM models
def get_models():
    global API_KEY, API_BASE
    try:
        llm = openai.OpenAI(api_key=API_KEY, base_url=API_BASE)
        models = llm.models.list()
        model_list = [model.id for model in models.data]
        llm.close()
        return model_list
    except Exception as erro:
        log(f"Unable to get models: {str(erro)}")
        return []
    
while True:
    if test_model():
        break
    else:
        log("Sleeping 5 seconds...")
        time.sleep(5)

# Test Weaviate Connection
if WEAVIATE_HOST != "":
    try:
        rag_documents.connect()
        log(f"RAG: Connected to Weaviate at {WEAVIATE_HOST}")
    except Exception as err:
        log(f"RAG: Unable to connect to Weaviate at {WEAVIATE_HOST} - {str(err)}")
        WEAVIATE_HOST = ""
        log("RAG support disabled.")

# Test SearXNG Connection
if SEARXNG != "":
    try:
        response = requests.get(f"{SEARXNG}/search")
        if response.status_code == 200:
            log(f"SEARXNG: Connected to {SEARXNG}")
        else:
            log(f"SEARXNG Disabled: No search server available at {SEARXNG}")
            SEARXNG = ""
    except Exception as err:
        log(f"SEARXNG: Unable to connect to {SEARXNG} - {str(err)}")
        SEARXNG = ""
        log("SEARXNG support disabled.")

# Find document closely related to query
def query_index(query, library, num_results=RESULTS):
    references = "References:"
    content = ""
    try:
        results = rag_documents.get_documents(library, query=query, num_results=num_results)
    except Exception as erro:
        log(f"Error querying Weaviate: {str(erro)}")
        return None, None
    previous_title = ""
    previous_file = ""
    previous_content = ""
    for ans in results:
        # Skip duplicate titles and files
        if ans['title'] == previous_title and ans['file'] == previous_file:
            continue
        references = references + f"\n - {ans['title']} - {ans['file']}"
        # Skip duplicates of content
        if ans['content'] == previous_content:
            continue
        new_content = ans['content']
        if MAXTOKENS and len(new_content) > MAXTOKENS:
            debug("RAG: Content size exceeded maximum size using chunk.")
            # Cut the middle and insert the chunk in the middle
            new_content = ans['content'][:MAXTOKENS//4] + "..." + (ans.get('chunk') or " ") + "..." + ans['content'][-MAXTOKENS//4:]
        content = content + f"Document: {ans['title']}\nDocument Source: {ans['file']}\nContent: {new_content}\n---\n"
        if (len(content)/4) > MAXTOKENS/2:
            debug("RAG: Content size reached maximum.")
            break
        previous_title = ans['title']
        previous_file = ans['file']
        previous_content = ans['content']
    debug(f"RAG: Retrieved ({len(content)} bytes)")
    return content, references

# Globals
client = {}
prompts = {}
stats = {
    "start_time": time.time(),
    "errors": 0,
    "ask": 0,
    "ask_llm": 0,
    "ask_context": 0,
}
llm_stream = None

#
# Configure FastAPI App and SocketIO
#
sio = socketio.AsyncServer(async_mode="asgi")
socket_app = socketio.ASGIApp(sio)
app = FastAPI()

@asynccontextmanager
async def lifespan(app: FastAPI):
    log("Starting chatbot...")
    yield
    log("Shutting down chatbot...")
    rag_documents.close()

app.router.lifespan_context = lifespan

# Load system prompts from PROMPT_FILE
def load_prompts():
    global prompts
    newprompts = False
    try:
        with open(PROMPT_FILE, "r") as f:
            prompts = json.load(f)
            log(f"Loaded {len(prompts)} prompts.")
        # Ensure prompts always include all keys from default_prompts
        for k in default_prompts:
            if k not in prompts:
                newprompts = True
                prompts[k] = default_prompts[k]
    except:
        log(f"Unable to load system prompts file {PROMPT_FILE}, creating with defaults.")
        reset_prompts()
        save_prompts()
    if newprompts:
        log("Updating system prompts with new elements.")
        save_prompts()

# Save prompts to PROMPT_FILE
def save_prompts():
    global prompts
    try:
        os.makedirs(os.path.dirname(PROMPT_FILE), exist_ok=True)  # Create path if it doesn't exist
        with open(PROMPT_FILE, "w") as f:
            json.dump(prompts, f)
            log(f"Saved {len(prompts)} prompts.")
    except:
        log("Unable to save prompts.")

# Expand variables in prompt to values
def expand_prompt(prompt, values):
    # Always use current {date} and {time}
    current_date = datetime.datetime.now()
    values["date"] = current_date.strftime("%B %-d, %Y")
    values["time"] = current_date.strftime("%-I:%M %p")
    for k in values:
        prompt = prompt.replace(f"{{{k}}}", values[k])
    return prompt

# Reset prompts
def reset_prompts():
    global prompts
    prompts = {}
    for k in default_prompts:
        prompts[k] = default_prompts[k]

# Load prompts
load_prompts()

# Function to return base conversation prompt
def base_prompt(content=None):
    global baseprompt, AGENTNAME, USE_SYSTEM, prompts
    if AGENTNAME == "":
        AGENTNAME = prompts["agentname"]
    current_date = datetime.datetime.now()
    formatted_date = current_date.strftime("%B %-d, %Y")
    values = {"agentname": AGENTNAME, "date": formatted_date}
    baseprompt = expand_prompt(prompts["baseprompt"], values)
    if not content:
        content = baseprompt
    if USE_SYSTEM:
        return [{"role": "system", "content": content}] 
    else:
        return [{"role": "user", "content": content}, {"role": "assistant", "content": "Okay, let's get started."}]

# Function - Send user prompt to LLM for streaming response
async def ask(prompt, sid=None):
    global client, stats, llm_stream
    stats["ask"] += 1
    response = False
    debug(f"Context size = {len(client[sid]['context'])}")
    while not response:
        try:
            # Remember context
            if ONESHOT:
                client[sid]["context"] = base_prompt()
            # Process image upload if present
            if client[sid]["image_data"]:
                # go through context and count images, remove if too many
                image_count = 0
                for turn in reversed(client[sid]["context"]):
                    if "content" in turn and isinstance(turn["content"], list):
                        for item in turn["content"]:
                            if "image_url" in item:
                                image_count += 1
                                if image_count >= MAX_IMAGES:
                                    # remove image from context
                                    debug("Too many images - Found image in context, removing 1...")
                                    turn["content"] = ' '.join([x.get("text", "") for x in turn["content"]])
                message = {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{client[sid]['image_data']}"}}
                    ]
                }
                client[sid]["context"].append(message)
            else:
                client[sid]["context"].append({"role": "user", "content": prompt})
            debug(f"context -> LLM [{sid}] = {client[sid]['context']} - model = {MYMODEL}")
            if not llm_stream:
                llm_stream = openai.OpenAI(api_key=API_KEY, base_url=API_BASE)
            response = llm_stream.chat.completions.create(
                model=client[sid]["model"],
                stream=True, # Send response chunks as LLM computes next tokens
                temperature=TEMPERATURE,
                messages=client[sid]["context"],
                extra_body=EXTRA_BODY,
            )
            client[sid]["image_data"] = ""
        except openai.OpenAIError as erro:
            # If we get an error, try to recover
            client[sid]["context"].pop()
            if "does not exist" in str(erro):
                await sio.emit('update', {'update': '[Model Unavailable... Retrying]', 'voice': 'user'},room=sid)
                log("Model does not exist - retrying")
                test_model()
                # set client model to default
                client[sid]["model"] = MYMODEL
                # update footer
                await sio.emit('update', {'update': f"TinyLLM Chatbot {VERSION} - {client[sid]['model']} ",
                                          'voice': 'footer', 'model': client[sid]['model']},room=sid)
            elif "maximum context length" in str(erro):
                if len(prompt) > 1000:
                    # assume we have very large prompt - cut out the middle
                    prompt = prompt[:len(prompt)//4] + " ... " + prompt[-len(prompt)//4:]
                    log(f"Session {sid} - Reduce prompt size - Now: ~{len(prompt)/4} tokens") # tokens are ~4 bytes
                elif len(client[sid]["context"]) > 4:
                    # our context has grown too large, truncate the top
                    client[sid]["context"] = client[sid]["context"][:1] + client[sid]["context"][3:]
                    log(f"Session {sid} - Truncate context array: Now: {len(client[sid]['context'])} blocks")
                else:
                    # our context has grown too large, reset
                    client[sid]["context"] = base_prompt()
                    log(f"Session {sid} - Reset context to base prompt - Now: ~{len(client[sid]['context'])/4} tokens")
            elif "At most" in str(erro) and "image" in str(erro):
                # Remove oldest image from context
                for turn in reversed(client[sid]["context"]):
                    # if turn["content"] is a list, remove image_url
                    if "content" in turn and isinstance(turn["content"], list):
                        debug("Too many images - Found last image in context, removing...")
                        turn["content"] = ' '.join([x.get("text", "") for x in turn["content"]])
                        break
                continue
            elif "Internal Server Error" in str(erro):
                # Check to see if our context has images - if so, remove them
                debug("Internal Server Error - Checking for images in context...")
                removed_image_data = False
                for turn in client[sid]["context"]:
                    # if turn["content"] is a list, remove image_url
                    if "content" in turn and isinstance(turn["content"], list):
                        log("Found image in context, removing...")
                        removed_image_data = True
                        turn["content"] = ' '.join([x.get("text", "") for x in turn["content"]])
                if removed_image_data:
                    # remove last turn in context and retry
                    await sio.emit('update', {'update': '[Images do not seem to be supported by model... Removing]', 'voice': 'user'},room=sid)
                    client[sid]["context"].pop()
                    continue
                log(f"ERROR: {str(erro)}")
                stats["errors"] += 1
                await sio.emit('update', {'update': str(erro), 'voice': 'user'},room=sid)
                break
            else:
                # If all else fails, log the error and break
                log(f"ERROR: {str(erro)}")
                stats["errors"] += 1
                await sio.emit('update', {'update': str(erro), 'voice': 'user'},room=sid)
                break
    if not client[sid]["remember"]:
        client[sid]["remember"] =True
        client[sid]["context"].pop()
        client[sid]["context"].append({"role": "user", "content": "Help me remember."})
    return response

async def ask_llm(query,  model=MYMODEL):
    # Ask LLM a question
    global stats
    stats["ask_llm"] += 1
    content = base_prompt(expand_prompt(prompts["clarify"], values={})) + [{"role": "user",
                "content": query}]
    debug(f"ask_llm: {content}")
    llm = openai.AsyncOpenAI(api_key=API_KEY, base_url=API_BASE)
    response = await llm.chat.completions.create(
        model=model,
        stream=False,
        temperature=TEMPERATURE,
        messages=content,
        extra_body=EXTRA_BODY,
    )
    # close the openai client
    await llm.close()
    debug(f"ask_llm -> {response.choices[0].message.content.strip()}")
    return response.choices[0].message.content.strip()

async def ask_context(messages, model=MYMODEL):
    # Ask LLM a simple question
    global stats
    stats["ask_context"] += 1
    debug(f"ask_context: {messages}")
    llm = openai.AsyncOpenAI(api_key=API_KEY, base_url=API_BASE)
    response = await llm.chat.completions.create(
        model=model,
        stream=False,
        temperature=TEMPERATURE,
        messages=messages,
        extra_body=EXTRA_BODY,
    )
    # close the openai client
    await llm.close()
    debug(f"ask_context -> {response.choices[0].message.content.strip()}")
    return response.choices[0].message.content.strip()

# Function - Get weather for location
async def get_weather(location):
    # Look up weather for location
    if location == "":
        location = "Los Angeles"
    location = location.replace(" ", "+")
    url = "https://wttr.in/%s?format=j2" % location
    debug(f"Fetching weather for {location} from {url}")
    response = requests.get(url)
    if response.status_code == 200:
        return response.text
    else:
        return "Unable to fetch weather for %s" % location

# Function - Get stock price for company
async def get_stock(company, model=MYMODEL):
    if ALPHA_KEY == "alpha_key":
        return "Unable to fetch stock price for %s - No Alpha Vantage API Key" % company
    # First try to get the ticker symbol
    symbol = await ask_llm(f"What is the stock symbol for {company}? Respond with symbol.", model=model)
    if "none" in symbol.lower():
        return "Unable to fetch stock price for %s - No matching symbol" % company
    # Check to see if response has multiple lines and if so, pick the first one
    symbol = symbol.split("\n")[0].strip()
    # Check to see if there are multiple words and if so, pick the last one
    if len(symbol.split()) > 1:
        symbol = symbol.split()[-1]
    # Strip off any spaces or non-alpha characters
    symbol = ''.join(e for e in symbol if e.isalnum())
    # Now get the stock price
    url = "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=%s&apikey=%s" % (symbol.upper(), ALPHA_KEY)
    debug(f"Fetching stock price for {company} from {url}")
    response = requests.get(url)
    if response.status_code == 200:
        try:
            price = response.json()["Global Quote"]["05. price"]
            return f"The price of {company} (symbol {symbol}) is ${price}."
        except:
            return "Unable to fetch stock price for %s - No data available." % company

# Function - Get news for topic
async def get_top_articles(url, max=10):
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            soup = BeautifulSoup(await response.text(), 'xml')
            items = soup.findAll('item')
            articles = ""
            links = {}
            count = 1
            for item in items:
                title = item.find('title').string.strip()
                #pubdate = item.find('pubDate').string.strip()
                #description = item.find('description').string.strip()
                link = item.find('link').string.strip()
                links[f"LnkID:{count+100}"] = link
                articles += f"Headline: {title} - LnkID:{count+100}\n"
                count += 1
                if count > max:
                    break
            return articles, links

# Function - Fetch news for topic
async def get_news(topic, max=10):
    if "none" in topic.lower() or "current" in topic.lower():
        url = "https://news.google.com/rss/"
    else:
        topic = topic.replace(" ", "+")
        url = "https://news.google.com/rss/search?q=%s" % topic
    debug(f"Fetching news for {topic} from {url}")
    async with aiohttp.ClientSession() as session:
        response, links = await get_top_articles(url, max)
        return response, links

# Function - Extract text from URL
async def extract_text_from_url(url):
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, allow_redirects=True) as response:
                if response.status == 200:
                    # Route extraction based on content type
                    if ";" in response.headers["Content-Type"]:
                        content_type = response.headers["Content-Type"].split(";")[0]
                    else:
                        content_type = response.headers["Content-Type"]
                    content_handlers = {
                        "application/pdf": extract_text_from_pdf,
                        "text/plain": extract_text_from_text,
                        "text/csv": extract_text_from_text,
                        "text/xml": extract_text_from_text,
                        "application/json": extract_text_from_text,
                        "text/html": extract_text_from_html,
                        "application/xml": extract_text_from_text,
                    }
                    if content_type in content_handlers:
                        return await content_handlers[content_type](response)
                    else:
                        return "Unsupported content type"
                else:
                    m = f"Failed to fetch the webpage. Status code: {response.status}"
                    debug(m)
                    return m
    except Exception as erro:
        log(f"An error occurred: {str(erro)}")

# Function - Extract text from PDF
async def extract_text_from_pdf(response):
    # Convert PDF to text
    pdf_content = await response.read()
    pdf2text = ""
    f = io.BytesIO(pdf_content)
    reader = PdfReader(f)
    for page in reader.pages:
        pdf2text = pdf2text + page.extract_text() + "\n"
    return pdf2text

# Function - Extract text from text
async def extract_text_from_text(response):
    return await response.text()

# Function - Extract text from HTML
async def extract_text_from_html(response):
    html_content = await response.text()
    # get title of page from html
    source = "Document Source: " + str(response.url)
    soup = BeautifulSoup(html_content, 'html.parser')
    title = ("Document Title: " + soup.title.string + "\n") if soup.title else ""
    paragraphs = soup.find_all(['p', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'ol'])
    website_text = f"{title}{source}\nDocument Content:\n" + '\n\n'.join([p.get_text() for p in paragraphs])
    return website_text

#
# FastAPI Routes
#

templates = Jinja2Templates(directory="templates")

# Display the main chatbot page
@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse(request, "index.html")

# Serve static socket.io.js
@app.get("/socket.io.js")
def serve_socket_io_js():
    return FileResponse("templates/socket.io.js", media_type="application/javascript")

# Display settings and stats
@app.get("/stats")
async def home(format: str = None):
    global client, stats
    # Create a simple status page
    data = {
        "TinyLLM Chatbot Version": VERSION,
        "Start Time": datetime.datetime.fromtimestamp(stats["start_time"]).strftime("%Y-%m-%d %H:%M:%S"),
        "Uptime": str(datetime.timedelta(seconds=int(time.time() - stats["start_time"]))),
        "Errors": stats["errors"],
        "LLM Main User Queries": stats["ask"],
        "LLM Helper Queries": stats["ask_llm"],
        "LLM CoT Context Queries": stats["ask_context"],
        "OpenAI API URL (OPENAI_API_URL)": API_BASE if not LITELLM_PROXY else "Disabled",
        "OpenAI API Key (OPENAI_API_KEY)": "************" if API_KEY != "" else "Not Set",
        "LiteLLM Proxy (LITELLM_PROXY)": LITELLM_PROXY or "Disabled",
        "LiteLLM Secret Key (LITELLM_KEY)": "************" if LITELLM_KEY != "" else "Not Set",
        "Agent Name (AGENT_NAME)": AGENTNAME,
        "LLM Model (LLM_MODEL)": MYMODEL,
        "Debug Mode (DEBUG)": DEBUG,
        "Current Clients (MAXCLIENTS)": f"{len(client)} of {MAXCLIENTS}",
        "LLM Max Tokens to Send (MAXTOKENS)": MAXTOKENS,
        "LLM Temperature (TEMPERATURE)": TEMPERATURE,
        "Server Port (PORT)": PORT,
        "Saved Prompts (PROMPT_FILE)": PROMPT_FILE,
        "Read-Only Prompts (PROMPT_RO)": PROMPT_RO,
        "LLM System Tags in Prompts (USE_SYSTEM)": USE_SYSTEM,
        "Run without conversation context (ONESHOT).": ONESHOT,
        "RAG: Run in RAG Only Mode (RAG_ONLY)": RAG_ONLY,
        "RAG: Weaviate (WEAVIATE_HOST)": WEAVIATE_HOST,
        "RAG: Weaviate gRPC (WEAVIATE_GRPC_HOST)": WEAVIATE_GRPC_HOST,
        "RAG: Weaviate Port (WEAVIATE_PORT)": WEAVIATE_PORT,
        "RAG: Weaviate gRPC Port (WEAVIATE_GRPC_PORT)": WEAVIATE_GRPC_PORT,
        "RAG: default Library (WEAVIATE_LIBRARY)": WEAVIATE_LIBRARY,
        "RAG: Default Results Retrieved (RESULTS)": RESULTS,
        "Alpha Vantage API Key (ALPHA_KEY)": "************" if ALPHA_KEY != "" else "Not Set",
        "Toxicity Threshold (TOXIC_THRESHOLD)": TOXIC_THRESHOLD,
        "Extra Body Parameters (EXTRA_BODY)": EXTRA_BODY,
        "Thinking Mode (THINKING)": THINKING,
        "Think Tag Filter (THINK_FILTER)": THINK_FILTER,
    }
    if format == "json":
        return data
    # Build a simple HTML page based on data facets
    html = "<html><head><title>TinyLLM Chatbot Status</title>"
    html += "<style>body { font-family: Helvetica, Arial, sans-serif; }</style>"
    html += "</head><body>"
    html += "<h1>TinyLLM Chatbot Status</h1>"
    # Provide link to project
    html += "<p>Settings and Current Status for <a href='https://github.com/jasonacox/TinyLLM/tree/main/chatbot'>TinyLLM Chatbot</a></p>"
    html += "<table>"
    for key in data:
        html += f"<tr><td>{key}</td><td>{data[key]}</td></tr>"
    html += "</table>"
    # Add JS to refresh page every 5 seconds
    html += "<script>setTimeout(function(){location.reload()},5000);</script>"
    html += "</body></html>"
    return HTMLResponse(content=html, status_code=200)

# Return the current prompts
@app.get('/prompts')
async def get_prompts():
    global prompts
    # Update TEMPERATURE and MAXTOKENS
    prompts["LLM_temperature"] = TEMPERATURE
    prompts["LLM_max_tokens"] = MAXTOKENS
    if PROMPT_RO:
        prompts["READONLY"] = True
    return prompts

# POST requests to update prompts
@app.post('/saveprompts')
async def update_prompts(data: dict):
    global prompts, baseprompt, sio, TEMPERATURE, MAXTOKENS, AGENTNAME
    if PROMPT_RO:
        return ({"Result": "Prompts are read-only"})
    oldbaseprompt = prompts["baseprompt"]
    oldagentname = prompts["agentname"]
    debug(f"Received prompts: {data}")
    # Update prompts
    for key in data:
        prompts[key] = data[key]
    save_prompts()
    if oldbaseprompt != prompts["baseprompt"] or oldagentname != prompts["agentname"]:
        # Update baseprompt
        AGENTNAME = prompts["agentname"]
        current_date = datetime.datetime.now()
        formatted_date = current_date.strftime("%B %-d, %Y")
        values = {"agentname": AGENTNAME, "date": formatted_date}
        baseprompt = expand_prompt(prompts["baseprompt"], values)
    # Update TEMPERATURE and MAXTOKENS
    if "LLM_temperature" in data:
        TEMPERATURE = float(data["LLM_temperature"])
    if "LLM_max_tokens" in data:
        MAXTOKENS = int(data["LLM_max_tokens"])
    # Notify all clients of update
    debug("Base prompt updated - notifying users")
    await sio.emit('update', {'update': '[Prompts Updated - Refresh to reload]', 'voice': 'user'})
    return ({"Result": "Prompts updated"})

# Reset prompts to default
@app.get('/resetprompts')
async def reset_prompts_route():
    # Send the user the default prompts
    global default_prompts
    return (default_prompts)

# Return the current version and LLM model
@app.get('/version')
async def show_version_api():
    global VERSION, DEBUG
    debug(f"Version requested - DEBUG={DEBUG}")
    if DEBUG:
        return {'version': "%s DEBUG MODE" % VERSION}
    return {'version': VERSION, 'model': MYMODEL}

# Send an alert to all clients
@app.post('/alert')
async def alert(data: dict):
    # Send an alert to all clients
    # Make sure TOKEN is set and matches
    if "token" in data and "message" in data and data["token"] == TOKEN:
        debug(f"Received alert: {data}")
        await sio.emit('update', {'update': data["message"], 'voice': 'user'})
        return ({'status': 'Alert sent'})
    else:
        log(f"Alert: Invalid token or missing message: {data}")
        return ({'status': 'Invalid Token or missing message'})

# Return list of available models
@app.get('/models')
async def list_models():
    return get_models()

# Upload a file
@app.post('/upload')
async def upload_file(file: UploadFile = File(...), session_id: str = Form(...)):
    global client
    file_name = file.filename
    session_id = session_id.strip()
    content = await file.read()  # Read file content
    # Open the image, checking for HEIC format
    try:
        image = Image.open(io.BytesIO(content))
    except Exception as e:
        await sio.emit('update', {'update': f"Image error: {str(e)}", 'voice': 'user'}, room=session_id)
        return {"error": f"Unable to open image: {str(e)}"}
    # Resize image if height or width is greater than 1024
    if image.height > 1024 or image.width > 1024:
        image.thumbnail((1024, 1024))
    # Convert image to RGB if it has an alpha channel
    if image.mode == 'RGBA':
        image = image.convert('RGB')
    # Save image to memory as JPEG
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='JPEG')
    content = img_byte_arr.getvalue()
    # Convert image to base64
    image_data = base64.b64encode(content).decode('utf-8')
    # Validate session
    if session_id not in client:
        log(f"Invalid session {session_id}")
        return {"result": "Bad Session ID", "filename": file.filename, "size": len(content)}
    debug(f"Received image upload from {session_id} - {file_name} [{len(image_data)} bytes]")
    # Add to client session
    client[session_id]["image_data"] = image_data
    # Determine file size in a human-readable format
    file_size = len(content)
    if file_size < 1024:
        file_size = f"{file_size} bytes"
    elif file_size < 1024 * 1024:
        file_size = f"{file_size / 1024:.1f} KB"
    else:
        file_size = f"{file_size / 1024 / 1024:.1f} MB"
    update = f"Uploaded image: {file_name} [{file_size}]"
    await sio.emit('update', {'update': update, 'voice': 'user'}, room=session_id)
    return {"result": "Success", "filename": file.filename, "size": len(content), "image_data": image_data}

#
# SocketIO Events
#

app.mount("/", socket_app)  # Here we mount socket app to main fastapi app

# Helper function to check for repeating text from LLM
async def is_repeating_exact(text: str, window: int = 100, repeats: int = 5) -> bool:
    if len(text) < window * (repeats + 1):
        return False
    tail = text[-window:]
    return text[:-window].count(tail) >= repeats

# Client connected - start thread to send updates
@sio.on('connect')
async def handle_connect(session_id, env):
    debug(f"Client connected: {session_id}")

    # Convert each character to its hex representation
    def string_to_hex(input_string):
        hex_values = [hex(ord(char)) for char in input_string]
        return hex_values

    # Continuous thread to send updates to connected clients
    async def send_update(session_id):
        global client
        debug(f"Starting send_update thread for {session_id}")

        # Verify session is valid
        if session_id not in client:
            debug(f"Invalid session {session_id}")
            return
        try:
            while not client[session_id]["stop_thread_flag"]:
                if client[session_id]["prompt"] == "":
                    await sio.sleep(0.1)
                else:
                    # Check to see of CoT is enabled but not while processing a file/image
                    client_cot = client[session_id]["cot"]
                    client_image_data = client[session_id]["image_data"]
                    client_visible = client[session_id]["visible"]
                    if client_cot and not client_image_data and client_visible:
                        try:
                            # Remember original prompt
                            client[session_id]["cot_prompt"] = client[session_id]["prompt"]
                            # Check to see if the prompt needs COT processing
                            cot_check = expand_prompt(prompts["chain_of_thought_check"], {"prompt": client[session_id]["prompt"]})
                            debug("Running CoT check")
                            # Ask LLM for answers
                            response = await ask_llm(cot_check, model=client[session_id]["model"])
                            if "a" in response.lower() or "d" in response.lower() or client[session_id]["cot_always"]:
                                debug("Running deep thinking CoT to answer")
                                # Build prompt for Chain of Thought and create copy of context
                                cot_prompt = expand_prompt(prompts["chain_of_thought"], {"prompt": client[session_id]["prompt"]})
                                temp_context = client[session_id]["context"].copy()
                                temp_context.append({"role": "user", "content": cot_prompt})
                                # Send thinking status to client and ask LLM for answer
                                await sio.emit('update', {'update': 'Thinking... ', 'voice': 'ai'},room=session_id)
                                answer = await ask_context(temp_context, model=client[session_id]["model"])
                                await sio.emit('update', {'update': '\n\n', 'voice': 'ai'},room=session_id)
                                # Load request for CoT conclusion into conversational thread
                                cot_prompt = expand_prompt(prompts["chain_of_thought_summary"], {"context_str": answer,
                                                                                                "prompt": client[session_id]["cot_prompt"]})
                                client[session_id]["prompt"] = cot_prompt
                        except Exception as erro:
                            log(f"CoT error - continuing with original prompt: {erro}")
                            await sio.emit('update', {'update': '\n\n', 'voice': 'ai'},room=session_id)
                    else:
                        client_cot = False
                    try:
                        # Ask LLM for answers
                        response= await ask(client[session_id]["prompt"],session_id)
                        completion_text = ''
                        tokens = 0
                        in_thinking = client[session_id]["think"]
                        # Iterate through the stream of tokens and send to client
                        stime = time.time()
                        for event in response:
                            event_text = event.choices[0].delta.content
                            # check for no tokens or a string just full of nany number of newlines only
                            if tokens == 0 and event_text and event_text.strip() == "":
                                continue
                            if event_text:
                                chunk = event_text
                                completion_text += chunk
                                tokens += 1
                                # Check for repeating text
                                if await is_repeating_exact(completion_text):
                                    debug(f"Repeating text detected - ending - {completion_text}")
                                    await sio.emit('update', {'update': '[Repeating Text Detected - Ending]', 'voice': 'user'},room=session_id)
                                    break
                                # Check for thinking tags
                                if client[session_id]["think"]:
                                    if "<think>" in event_text:
                                        in_thinking = True
                                        await sio.emit('update', {'update': '', 'voice': 'ai'},room=session_id)
                                        continue
                                    elif "</think>" in event_text:
                                        in_thinking = False
                                        token = 0
                                        continue
                                    if in_thinking:
                                        continue
                                await sio.emit('update', {'update': chunk, 'voice': 'ai'}, room=session_id)
                        # Check to see if thinking filter blocked all tokens
                        if in_thinking:
                            # Disable thinking filter and reprocess
                            client[session_id]["think"] = False
                            await sio.emit('update', {'update': '', 'voice': 'ai'},room=session_id)
                            await sio.emit('update', {'update': '[No thinking tags found - disabling filter]', 'voice': 'user'},room=session_id)
                            # Send entire completion_text to client
                            await sio.emit('update', {'update': completion_text, 'voice': 'ai'},room=session_id)
                            tokens = len(completion_text)/4
                        # Update footer with stats
                        await sio.emit('update', {'update': 
                                                  f"TinyLLM Chatbot {VERSION} - {client[session_id]['model']} - Tokens: {tokens} - TPS: {tokens/(time.time()-stime):.1f}",
                                                  'voice': 'footer', 'model': client[session_id]['model']},room=session_id)
                        # Check for link injection
                        if client[session_id]["links"]:
                            await sio.emit('update', {'update': json.dumps(client[session_id]["links"]), 'voice': 'links'},room=session_id)
                            client[session_id]["links"] = ""
                        # Check for references
                        if client[session_id]["references"]:
                            # remove any leading or trailing newlines
                            client[session_id]["references"] = client[session_id]["references"].strip()
                            await sio.emit('update', {'update': client[session_id]["references"], 'voice': 'ref'},room=session_id)
                            client[session_id]["references"] = ""
                        if not ONESHOT:
                            # If COT mode replace CoT context in conversation thread with user prompt
                            if client_cot:
                                client[session_id]["context"].pop()
                                client[session_id]["context"].append({"role": "user", "content": client[session_id]["cot_prompt"]} )
                            # Remember answer
                            client[session_id]["context"].append({"role": "assistant", "content" : completion_text})
                    except Exception as erro:
                        # Unable to process prompt, give error
                        log(f"ERROR {erro}")
                        await sio.emit('update', {'update': 'An error occurred - unable to complete.', 'voice': 'ai'},room=session_id)
                        # Reset context
                        client[session_id]["context"] = base_prompt()
                    # Signal response is done
                    await sio.emit('update', {'update': '', 'voice': 'done'},room=session_id)
                    client[session_id]["prompt"] = ''
                    debug(f"LLM -> client [{session_id}]: {completion_text}")
        except KeyError:
            debug(f"Thread ended: {session_id}")
        except Exception as erro:
            log(f"Thread error: {erro}")

    if session_id in client:
        # Client reconnected - restart thread
        #client[session_id]["thread"].join()
        debug(f"Client reconnected: {session_id}")
    else:
        # New client connected
        debug(f"New client connected: {session_id}")
        # Limit number of clients
        if len(client) > MAXCLIENTS:
            log(f"Too many clients connected: {len(client)}")
            await sio.emit('update', {'update': 'Too many clients connected. Try again later.', 'voice': 'user'},room=session_id)
            return
        # Create client session
        client[session_id]={}
        # Initialize context for this client
        client[session_id]["context"] = base_prompt()
        client[session_id]["remember"] = True
        client[session_id]["visible"] = True
        client[session_id]["prompt"] = ""
        client[session_id]["stop_thread_flag"] = False
        client[session_id]["references"] = ""
        client[session_id]["links"] = {}
        client[session_id]["toxicity"] = 0.0
        client[session_id]["rag_only"] = False
        client[session_id]["cot"] = THINKING
        client[session_id]["cot_always"] = False
        client[session_id]["library"] = WEAVIATE_LIBRARY
        client[session_id]["results"] = RESULTS
        client[session_id]["image_data"] = ""
        client[session_id]["model"] = MYMODEL
        client[session_id]["think"] = THINK_FILTER
        client[session_id]["internet"] = WEB_SEARCH
        client[session_id]["intent"] = INTENT_ROUTER
        # Start continuous task to send updates
        asyncio.create_task(send_update(session_id))

# Client disconnected
@sio.on('disconnect')
async def handle_disconnect(session_id):
    debug(f"Client disconnected: {session_id}")
    # Remove client
    if session_id in client:
        # shutdown thread
        client[session_id]["stop_thread_flag"] = True
        client.pop(session_id)

# Change the LLM model
@sio.on('model')
async def change_model(session_id, model):
    global client
    # Remember the current model
    current_model = client[session_id]["model"]
    if session_id in client:
        if model != current_model:
            # If empty model selected, use default
            if model == "":
                model = MYMODEL
            # Verify model is valid
            list_of_models = get_models()
            if model not in list_of_models:
                log(f"Requested invalid model {model}")
                if len(client[session_id]["context"]) > 2:
                    await sio.emit('update', {'update': f"Model not found: {model}", 'voice': 'user'}, room=session_id)
                return
            debug(f"Changing model for {session_id} to {model}")
            client[session_id]["model"] = model
        # Update footer
        await sio.emit('update', {'update': f"TinyLLM Chatbot {VERSION} - {model}", 'voice': 'footer',
                                  'model': model}, room=session_id)
        # Check to see if this is a new session
        log(f"context length: {len(client[session_id]['context'])}")
        if len(client[session_id]["context"]) > 2 and current_model != model:
            await sio.emit('update', {'update': f'[Model changed to {model}]', 'voice': 'user'}, room=session_id)
    else:
        log(f"Invalid session {session_id}")
        await handle_invalid_session(session_id)
    return {'status': 'Model changed'}

# Client sent a message - handle it
@sio.on('message')
async def handle_message(session_id, data):
    global client
    # Handle incoming user prompts and store them
    debug(f'Received message from {session_id}: {data}')
    if session_id not in client:
        log(f"Invalid session {session_id}")
        await handle_invalid_session(session_id)
        return
    p = data["prompt"]
    client[session_id]["visible"] = data["show"]
    # Did we get a start command? Use greeting prompt.
    if p == "{start}":
        p = prompts["greeting"]
    # Did we get asked to fetch a URL?
    if p.startswith("http"):
        await handle_url_prompt(session_id, p)
    elif p.startswith("/"):
        await handle_command(session_id, p)
    else:
        await handle_normal_prompt(session_id, p)
    return {'status': 'Message received'}

# Upload an image to context via socket - NOT USED
@sio.on('image_upload')
async def handle_image_upload(session_id, data):
    global client
    await sio.emit('update', {'update': 'Image uploaded', 'voice': 'user'}, room=session_id)
    file_name = data['fileName']
    image_data = data['data'].split(",")[1]  # Extract base64 part of the image
    debug(f"Received image upload from {session_id} - {file_name} [{len(image_data)} bytes]")
    # Verify that this is a valid image
    if not image_data.startswith("iVBORw0KGgoAAAANSUhE"):
        log(f"Invalid image data: {image_data[:20]}")
        await sio.emit('update', {'update': 'Invalid image data', 'voice': 'user'}, room=session_id)
        return
    # Add to client session
    client[session_id]["image_data"] = image_data
    # Send image back to client to display
    #await sio.emit('update', {'filename': file_name,
    #                            'image_data': image_data,
    #                            'voice': 'image'}, room=session_id)

# Client sent a request for conversation thread
@sio.on('request_conversation')
async def handle_request_conversation(session_id):
    global client
    # Send conversation context to client
    if session_id in client:
        debug(f"Sending full conversation context to {session_id}")
        await sio.emit('update', {'update': client[session_id]["context"], 'voice': 'conversation'},room=session_id)
    else:
        log(f"Invalid session {session_id}")
        await handle_invalid_session(session_id)

async def handle_invalid_session(session_id):
    await sio.emit('update', {'update': '[Session Unrecognized - Try Refresh]', 'voice': 'user'}, room=session_id)

async def handle_url_prompt(session_id, p):
    url = p.strip()
    client[session_id]["visible"] = False
    client[session_id]["remember"] = True
    await sio.emit('update', {'update': '%s [Reading...]' % url, 'voice': 'user'}, room=session_id)
    website_text = await extract_text_from_url(url)
    if website_text:
        debug(f"* Reading {len(website_text)} bytes {url}")
        url_encoded = requests.utils.quote(url)
        client[session_id]["prompt"] = expand_prompt(prompts["website"], {"url": url_encoded, "website_text": website_text})
    else:
        await sio.emit('update', {'update': '[ERROR: Unable to read URL]', 'voice': 'user'}, room=session_id)
        client[session_id]["prompt"] = ''

async def handle_command(session_id, p):
    command = p[1:].split(" ")[0].lower()
    if command == "":
        await sio.emit('update', {'update': '[Commands: /intent /model /news /rag /reset /search /sessions /stock /think /version /weather]', 'voice': 'user'}, room=session_id)
        client[session_id]["prompt"] = ''
    elif command == "reset":
        await reset_context(session_id)
    elif command == "version":
        await show_version(session_id)
    elif command == "sessions":
        await show_sessions(session_id)
    elif command == "news":
        await fetch_news(session_id, p)
    elif command == "rag":
        await handle_rag_command(session_id, p)
    elif command == "weather":
        await handle_weather_command(session_id, p)
    elif command == "stock":
        await handle_stock_command(session_id, p)
    elif command == "think":
        await handle_think_command(session_id, p)
    elif command == "model" or command == "models":
        await handle_model_command(session_id, p)
    elif command == "search":
        await handle_search_command(session_id, p)
    elif command == "intent":
        await handle_intent_command(session_id, p)
    else:
        await sio.emit('update', {'update': '[Invalid command]', 'voice': 'user'}, room=session_id)
        client[session_id]["prompt"] = ''

async def reset_context(session_id):
    client[session_id]["context"] = base_prompt()
    await sio.emit('update', {'update': '[Memory Reset]', 'voice': 'user'}, room=session_id)
    client[session_id]["prompt"] = prompts["greeting"]
    client[session_id]["visible"] = False

async def show_version(session_id):
    await sio.emit('update', {'update': '[TinyLLM Version: %s - Session: %s]' % (VERSION, session_id), 'voice': 'user'}, room=session_id)
    client[session_id]["prompt"] = ''

async def show_sessions(session_id):
    result = ""
    x = 1
    for s in client:
        result += f"* {x}: {s}\n"
        x += 1
    await sio.emit('update', {'update': '[Sessions: %s]\n%s' % (len(client), result), 'voice': 'user'}, room=session_id)
    client[session_id]["prompt"] = ''

async def fetch_news(session_id, p):
    debug("News requested")
    topic = p[5:].strip() or "none"
    await sio.emit('update', {'update': '%s [Fetching News]' % p, 'voice': 'user'}, room=session_id)
    context_str, links = await get_news(topic, 25)
    debug(f"News Raw Context = {context_str}")
    client[session_id]["visible"] = False
    client[session_id]["remember"] = True
    client[session_id]["links"] = links
    client[session_id]["prompt"] = expand_prompt(prompts["news"], {"context_str": context_str})

async def handle_rag_command(session_id, p):
    """
    Options:
    /rag {library} {opt:number} {prompt}
    /rag on {library} {opt:number}
    /rag off
    /rag list
    """
    # If WEAVIATE_HOST is not set, return
    if not WEAVIATE_HOST:
        await sio.emit('update', {'update': '[RAG Support Disabled - Check Config]', 'voice': 'user'}, room=session_id)
        return
    prompt = ""
    rag = p[4:].strip()
    parts = rag.split()
    library = ""
    # Do we have /rag on? - Get library and number - client session only not global
    if parts and parts[0] == "on":
        library = WEAVIATE_LIBRARY
        number = RESULTS
        if len(parts) >= 2:
            library = parts[1]
        if len(parts) >= 3 and parts[2].isdigit():
            number = int(parts[2])
        # Set mode in client session
        client[session_id]["rag_only"] = True
        client[session_id]["library"] = library
        client[session_id]["results"] = number
        await sio.emit('update', {'update': '[Auto-RAG On]', 'voice': 'user'}, room=session_id)
        return
    elif parts and parts[0] == "off":
        # Turn off RAG mode
        client[session_id]["rag_only"] = False
        await sio.emit('update', {'update': '[Auto-RAG Off]', 'voice': 'user'}, room=session_id)
        return
    elif parts and parts[0] == "list":
        # List available libraries
        array_of_libraries = rag_documents.all_collections()
        # convert array into string
        mes = f'[Available Libraries: {", ".join(array_of_libraries)}]'
        await sio.emit('update', {'update': mes, 'voice': 'user'}, room=session_id)
        return
    if len(parts) >= 2:
        library = parts[0]
        if parts[1].isdigit():
            number = int(parts[1])
            prompt = ' '.join(parts[2:])
        else:
            number = RESULTS
            prompt = ' '.join(parts[1:])
    if not library or not prompt:
        if RAG_ONLY:
            mes = f'Auto-RAG On: All prompts are processed by RAG using library {WEAVIATE_LIBRARY}\n.'
        else:
            library = WEAVIATE_LIBRARY if RAG_ONLY else client[session_id]["library"]
            number = RESULTS if RAG_ONLY else client[session_id]["results"]
            rag_state = f"[Auto-RAG is {'On' if client[session_id]['rag_only'] or RAG_ONLY else 'Off'} - Library: {library} - Results: {number}]\n\n"
            mes = rag_state + 'RAG Commands:\n * /rag {library} {opt:number} {prompt}\n * /rag on {library} {opt:number}\n * /rag off\n * /rag list\n'
        await sio.emit('update', {'update': mes, 'voice': 'user'}, room=session_id)
    else:
        if WEAVIATE_HOST:
            debug(f"Pulling {number} entries from {library} with prompt {prompt}")
            if not ONESHOT:
                await sio.emit('update', {'update': '%s [RAG Command Running...]' % p, 'voice': 'user'}, room=session_id)
            results, references = query_index(prompt, library, number)
            if results:
                context_str = ""
                client[session_id]["visible"] = False
                client[session_id]["remember"] = True
                context_str = results
                debug(f" = {references}")
                client[session_id]["references"] = references
                client[session_id]["prompt"] = expand_prompt(prompts["rag"], {"context_str": context_str, "prompt": prompt})
            else:
                await sio.emit('update', {'update': '[Unable to access Vector Database for %s]' % library, 'voice': 'user'}, room=session_id)
        else:
            await sio.emit('update', {'update': '[RAG Support Disabled - Check Config]', 'voice': 'user'}, room=session_id)

async def handle_think_command(session_id, p):
    """
    Options:
    /think on
    /think off
    /think always
    /think filter
    """
    think = p[6:].strip()
    parts = think.split()
    if parts and parts[0] == "on":
        client[session_id]["cot"] = True
        client[session_id]["cot_always"] = False
        await sio.emit('update', {'update': '[Chain of Thought Mode On]', 'voice': 'user'}, room=session_id)
        return
    elif parts and parts[0] == "off":
        client[session_id]["cot"] = False
        await sio.emit('update', {'update': '[Chain of Thought Mode Off]', 'voice': 'user'}, room=session_id)
        return
    elif parts and parts[0] == "always":
        client[session_id]["cot"] = True
        client[session_id]["cot_always"] = True
        await sio.emit('update', {'update': '[Chain of Thought Mode Always On]', 'voice': 'user'}, room=session_id)
        return
    elif parts and parts[0] == "filter":
        state = ""
        if len(parts) >= 2:
            if parts[1] == "on":
                client[session_id]["think"] = True
                state = "ON"
            else:
                client[session_id]["think"] = False
                state = "OFF"
        else:
            client[session_id]["think"] = not client[session_id]["think"]
            state = "ON" if client[session_id]["think"] else "OFF"
        await sio.emit('update', {'update': f'[Think Filter is {state}]', 'voice': 'user'}, room=session_id)
        return
    else:
        state = "ON" if client[session_id]["cot"] else "OFF"
        state = "ALWAYS" if client[session_id]["cot_always"] else state
        await sio.emit('update', {'update': f'Chain of Thought is {state}\n - Chain of Thought: /think {{on|off|always}}\n - Filter Think Tags: /think filter {{on|off}}', 'voice': 'user'}, room=session_id)

async def handle_model_command(session_id, p):
    # Remember current model
    current_model = client[session_id]["model"]
    # List or set LLM Models
    words = p.split()
    args = words[1] if len(words) > 1 else ""
    if not args:
         # Open Model Dialog
        await sio.emit('model_dialog', {}, room=session_id)
        return
    model_list = get_models()
    if not args in model_list:
        args = args.lower()
    if args in model_list and args != current_model:
        debug(f"Changing model to {args}")
        client[session_id]["model"] = args
        await sio.emit('update', {'update': f'[Model changed to {args}]', 'voice': 'user'}, room=session_id)
        await sio.emit('update', {'update': f"TinyLLM Chatbot {VERSION} - {args}", 'voice': 'footer',
                                  'model': args}, room=session_id)
    elif args in ["list", "help"]:
        msg = f'Current LLM Model: {client[session_id]["model"]}\n'
        msg += f'- Available Models: {", ".join(model_list)}\n'
        msg += '- Usage: /model {model_name}'
        await sio.emit('update', {'update': msg, 'voice': 'user'}, room=session_id)
    else:
        await sio.emit('update', {'update': f'[Model {args} not found]', 'voice': 'user'}, room=session_id)

async def handle_weather_command(session_id, p):
    debug("Weather prompt")
    await sio.emit('update', {'update': '%s [Weather Command Running...]' % p, 'voice': 'user'}, room=session_id)
    location = await ask_llm(expand_prompt(prompts["location"], {"prompt": p}), model=client[session_id]["model"])
    location = ''.join(e for e in location if e.isalnum() or e.isspace())
    if "none" in location.lower():
        context_str = await get_weather("")
    else:
        context_str = await get_weather(location)
    client[session_id]["visible"] = False
    client[session_id]["remember"] = True
    client[session_id]["prompt"] = expand_prompt(prompts["weather"], {"prompt": p, "context_str": context_str, "location": location})

async def handle_stock_command(session_id, p):
    debug("Stock prompt")
    prompt = p[6:].strip()
    if not prompt:
        await sio.emit('update', {'update': '[Usage: /stock {company}] - Fetch stock price for company.', 'voice': 'user'}, room=session_id)
        return
    await sio.emit('update', {'update': '%s [Fetching Stock Price...]' % p, 'voice': 'user'}, room=session_id)
    debug(f"Stock Prompt: {prompt}")
    company = await ask_llm(expand_prompt(prompts["company"], {"prompt": prompt}), model=client[session_id]["model"])
    company = ''.join(e for e in company if e.isalnum() or e.isspace())
    if "none" in company.lower():
        context_str = "Unable to fetch stock price - Unknown company specified."
    else:
        context_str = await get_stock(company, model=client[session_id]["model"])
    debug(f"Company = {company} - Context = {context_str}")
    await sio.emit('update', {'update': context_str, 'voice': 'ai'}, room=session_id)
    client[session_id]["context"].append({"role": "user", "content" : "What is the stock price for %s?" % company})
    client[session_id]["context"].append({"role": "assistant", "content" : context_str})
    client[session_id]["prompt"] = ''

# Intent Engine Helpers

async def prompt_similarity(session_id, prompt1, prompt2):
    # Check for similarity between two prompts
    query = f"""You help compare two sentences to see if they are semantically similar. Please rate the similarity between 0 and 10 with 0 being not similar at all, 10 being equivalent:

    Sentence 1: {prompt1}

    Sentence 2: {prompt2}
    
    Provide the answer in JSON format with keys: score and justification."""
    answer = await ask_llm(query, model=client[session_id]["model"])
    # replace any markdown formatting for json code
    answer = answer.replace('```json', '')
    answer = answer.replace('```', '')
    # process JSON response looking for score and justification
    try:
        answer = json.loads(answer)
        score = int(answer.get("score", 0))
        justification = answer.get("justification", "None")
        debug(f"Similarity Score: {score} - Justification: {justification}")
        return score, justification
    except:
        debug(f"Unable to process response: {response}")
        return 10, "Unable to process response"

intent_questions = {
    "weather": "Is this request asking about current weather conditions or forecast?",
    "news": "s this request asking about news?",
    "search": "Is this request asking to search the internet or web?",
    "stock": "Does this prompt contain a company name?",
    "dynamic": "Is is possible that the answer to this question changed over last 4 years, dependent on current events or news, or subject to change due to external factors?",
    "followup": "Does this seems like a follow-up question or statment?"
}

async def handle_normal_prompt(session_id, p):
    if client[session_id]["visible"]:
        await sio.emit('update', {'update': p, 'voice': 'user'}, room=session_id)
    if WEAVIATE_HOST and RAG_ONLY and p is not prompts["greeting"]:
        # Activate RAG every time
        await handle_rag_command(session_id, f"/rag {WEAVIATE_LIBRARY} {RESULTS} {p}")
        return
    if client[session_id]["rag_only"]:
        # Use RAG
        await handle_rag_command(session_id, f"/rag {client[session_id]['library']} {client[session_id]['results']} {p}")
        return
    if TOXIC_THRESHOLD != 99:
        # Test toxicity of prompt
        toxicity_check = await ask_llm(expand_prompt(prompts["toxic_filter"], {"prompt": p}), model=client[session_id]["model"])
        # extract floating point number from response
        toxicity = re.findall(r"[-+]?\d*\.\d+|\d+", toxicity_check)
        # convert float string to float
        try:
            toxicity = float(toxicity[0])
        except:
            toxicity = 0
        client[session_id]["toxicity"] = toxicity
        if toxicity > TOXIC_THRESHOLD:
            # Prompt is toxic - remove newlines from toxicity_check
            reason = toxicity_check.replace('\n', ' ')
            await sio.emit('update', {'update': f'[Filter Activated ({toxicity}) {reason}]\nPlease try a different topic.', 'voice': 'ai'}, room=session_id)
            client[session_id]["prompt"] = ""
            client[session_id]["toxicity"] = 0.0
            log(f"Toxic Prompt Detected [{toxicity}] - {p}")
            return
    if client[session_id]["intent"] and len(p) < 200 and not client[session_id]["image_data"]:
        # Intent Engine is enabled -  Give LLM context on previous prompt
        prompt_context = client[session_id]["context"][-2]["content"] if isinstance(client[session_id]["context"][-2]["content"], str) else ""
        prompt_context += client[session_id]["context"][-1]["content"] if isinstance(client[session_id]["context"][-1]["content"], str) else ""
        # remove "stock" and "news" from context
        prompt_context = prompt_context.replace("stock", "")
        prompt_context = prompt_context.replace("news", "")
        prompt_context += "\nNew Request: " + p
        # If it is just a greeting or plesantry, skip intent detection
        answer = await ask_llm(f"PROMPT: {p}\nIs the user greeting or thanking us? (yes or no):", model=client[session_id]["model"])
        if "yes" in answer.lower():
            client[session_id]["prompt"] = p
            return
        intent = await ask_llm(expand_prompt(prompts["intent"], {"prompt": prompt_context}), model=client[session_id]["model"])
        if intent:
            intent = intent.lower().split()[-1]
            debug(f"Intent detected: {intent}")
            if "weather" in intent:
                # Get the weather
                if await double_check(session_id, p, intent_questions["weather"]):
                    await handle_weather_command(session_id, p)
                    return
            if "news" in intent:
                # Get news
                type_of_news = await ask_llm(f"What subject, company, person, place or type of news are they looking for in this request: <REQUEST>\n{prompt_context}\n</REQUEST>\nList a single word or state 'general news' if general news is requested. Otherwise list the company, placer, person or subject if given:", model=client[session_id]["model"])
                log(f"Type of news: {type_of_news}")
                score, _ = await prompt_similarity(session_id, p, "What is the current news?")
                if score > 1:
                    if "general news" in type_of_news.lower():
                        type_of_news = ""
                    await fetch_news(session_id, f"/news {type_of_news}")
                    return
            if "code" in intent:
                # Code requested
                client[session_id]["prompt"] = p
                return
            if "retry" in intent and SEARXNG:
                # Assume last answer was bad, find the previous prompt and ask again
                if len(client[session_id]["context"]) > 2:
                    # Grab prompt from context
                    last_prompt = client[session_id]["context"][-2]["content"]
                    if len(last_prompt) < 200:
                        await sio.emit('update', {'update': 'Let me search the internet...', 'voice': 'ai'}, room=session_id)
                        debug(f"Complaint detected - retrying: {last_prompt}")
                        if await process_search(session_id, last_prompt, prompt_context):
                            return
                    else:
                        client[session_id]["prompt"] = p
                return
            if await double_check(session_id, p, intent_questions["followup"]):
                # Follow-up question
                client[session_id]["prompt"] = p
                return
            if await double_check(session_id, p, intent_questions["dynamic"]):
                intent = "search"
            if SEARXNG and ("search" in intent or "stock" in intent):
                debug(f"Search the web: {p}")
                if "stock" in intent:
                    # Add instructions to also list company stock ticker
                    p = f"{p} - Please also list the stock ticker symbol if relevant."
                await process_search(session_id, p, prompt_context)
                return
    # Default: Process the prompt
    client[session_id]["prompt"] = p


async def double_check(session_id, prompt, question):
    # Ask LLM to double check the prompt
    check = await ask_llm(f"<PROMPT>\n{prompt}\n</PROMPT>\n{question} - Answer yes or no:", model=client[session_id]["model"])
    if check:
        check = check.lower()
        if "yes" in check:
            return True
    return False


async def process_search(session_id, prompt, context):
    # Ask LLM to determin topic to search
    search_topic = await ask_llm(f"Context: {context}\n\nCreate a single internet search phrase to best answer the fllowing prompt. Don't add commentary.\nPROMPT: {prompt}", model=client[session_id]["model"])
    if search_topic:
        search_topic = search_topic.strip()
        search_topic = search_topic.replace('"', '')
        # limit to first line only if newlines found
        if "\n" in search_topic:
            search_topic = search_topic.split("\n")[0]
        if search_topic:
            await handle_search_command(session_id, f"/search {search_topic}", original_prompt=prompt)
            return True
        else:
            return False


async def handle_intent_command(session_id, p):
    # Allow user to toggle intent engine
    if p == "/intent on":
        client[session_id]["intent"] = True
        await sio.emit('update', {'update': '[Intent Engine Enabled]', 'voice': 'user'}, room=session_id)
    elif p == "/intent off":
        client[session_id]["intent"] = False
        await sio.emit('update', {'update': '[Intent Engine Disabled]', 'voice': 'user'}, room=session_id)
    else:
        current_state = "ON" if client[session_id]["intent"] else "OFF"
        await sio.emit('update', {'update': '[Usage: /intent on|off] - Enable or disable the intent engine. Currently: ' + current_state, 'voice': 'user'}, room=session_id)


async def handle_search_command(session_id, p, original_prompt=""):
    # Check to see if SEARXNG is enabled
    if not SEARXNG:
        await sio.emit('update', {'update': '[Search Engine Disabled - Check Config]', 'voice': 'user'}, room=session_id)
        return
    # format /search {opt:max} {prompt} or /search on|off
    parts = p.split()
    max_results = 5
    prompt = ""
    # check if turn on/off
    if len(parts) >= 2 and parts[0] == "search" and parts[1] in ["on", "off"]:
        client[session_id]["internet"] = parts[1] == "on"
        await sio.emit('update', {'update': f'[Web Search is {"On" if client[session_id]["internet"] else "Off"}]', 'voice': 'user'}, room=session_id)
        return
    # check to see if optional max results is provided
    if len(parts) >= 2 and parts[1].isdigit():
        max_results = int(parts[1])
        prompt = ' '.join(parts[2:])
    else:
        prompt = ' '.join(parts[1:])
    if not prompt:
        current_state = "ON" if client[session_id]["internet"] else "OFF"
        await sio.emit('update', {'update': '[Usage: /search {opt:number} {query} or /search on|off] - Search the internet. State: ' + current_state, 'voice': 'user'}, room=session_id)
        return
    await sio.emit('update', {'update': '%s [Searching...]' % p, 'voice': 'user'}, room=session_id)
    if original_prompt:
        prompt = original_prompt
    context_str = await search_web(session_id, prompt, max_results) or "[Error searching the web]"
    client[session_id]["visible"] = False
    client[session_id]["remember"] = True
    client[session_id]["prompt"] = expand_prompt(prompts["internet_rag"], {"context_str": context_str, "prompt": prompt})

async def search_web(session_id, prompt, results=5):
    # Search the web using SEARXNG
    context_str = ""
    references = ""
    try:
        # Search the SEARXNG service with URI: /search?q={prompt}&format=json
        # use GET request to get the search results (max results)
        search_results = requests.get(f"{SEARXNG}/search?q={prompt}&format=json").json()
        count = 0
        for result in search_results.get('results', []):
            if count >= results:
                break
            count += 1
            context_str += f"* {result['title']}\n{result['url']}\n{result['content']}\n\n"
            # Build references
            if "url" in result:
                references = references + f"\n - {result['title']} - <a href='{result['url']}' target='_blank'>[Link]</a>"
        if not context_str:
            context_str = "[No search results found]"
        if references:
            client[session_id]["references"] = references
    except Exception as e:
        log(f"Error searching web: {e}")
        context_str = "[Error searching the web]"
    return context_str


#
# Start dev server and listen for connections
#

if __name__ == '__main__':
    log(f"DEV MODE - Starting server on port {PORT}. Use uvicorn server:app for PROD mode.")
    kwargs = {"host": "0.0.0.0", "port": PORT}
    uvicorn.run("server:app", **kwargs)
