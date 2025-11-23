import { GoogleGenerativeAI } from "@google/generative-ai";
import { CONFIG } from "./config.js";
        // ========================================
        // CONFIGURATION - UPDATE THESE VALUES
        // ========================================
        // const CONFIG = {
        //     GEMINI_API_KEY: 'AIzaSyAhcvo9_g775-2zo2Z3u-CzClwQ61cSP1I',
        //     KNOWLEDGE_BASE_URL: 'university_info.txt',
        //     UNIVERSITY_SUMMARY_URL: 'univercity_summary.txt',
        //     LOGO_URL: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnixa4JCSO7Attpj8QU7VK1tdywmPn0GMuZw&s',
        //     BANNER_IMAGE_URL: 'https://pgckhategaon.co.in/assets/images/slider/2.jpg'
        // };
        // ========================================

        let genAI;
        let model;
        let knowledgeBase = '';
        let universitySummary = '';
        let conversationHistory = [];
        let isLoading = true;

        // Initialize on page load
        window.onload = async function() {
            // Initialize Gemini AI
            try {
                genAI = new GoogleGenerativeAI(CONFIG.GEMINI_API_KEY);
                model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash",
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 800,
                        topK: 40,
                        topP: 0.95,
                    }
                });
            } catch (error) {
                console.error('Error initializing Gemini:', error);
                document.getElementById('loadingStatus').innerHTML = '❌ Error initializing AI. Check API key.';
                return;
            }

            // Set logo
            if (CONFIG.LOGO_URL) {
                document.getElementById('logoImg').src = CONFIG.LOGO_URL;
                document.getElementById('logoImg').style.display = 'block';
                document.getElementById('logoPlaceholder').style.display = 'none';
            }

            // Set banner image
            if (CONFIG.BANNER_IMAGE_URL) {
                document.querySelector('.banner').style.backgroundImage = `url('${CONFIG.BANNER_IMAGE_URL}')`;
            }

            // Load knowledge base and summary
            try {
                await loadFiles();
                isLoading = false;
                document.getElementById('loadingStatus').innerHTML = "Curious about our college? I'm here for you!";
                document.querySelector('.welcome-message').innerHTML = '<h2> Ready to Chat!</h2><p>Let’s make your college search easier. What can I help you with?</p>';
            } catch (error) {
                isLoading = false;
                document.getElementById('loadingStatus').innerHTML = '❌ Error loading data. Please refresh the page.';
                console.error('Error loading files:', error);
            }

            // Setup event listeners
            document.getElementById('sendBtn').addEventListener('click', sendMessage);
            document.getElementById('userInput').addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    sendMessage();
                }
            });
        };

        async function loadFiles() {
            try {
                // Load knowledge base
                const kbResponse = await fetch(CONFIG.KNOWLEDGE_BASE_URL);
                if (!kbResponse.ok) throw new Error('Failed to load knowledge base');
                knowledgeBase = await kbResponse.text();

                // Load university summary
                const summaryResponse = await fetch(CONFIG.UNIVERSITY_SUMMARY_URL);
                if (!summaryResponse.ok) throw new Error('Failed to load university summary');
                universitySummary = await summaryResponse.text();
            } catch (error) {
                throw new Error('Failed to load configuration files: ' + error.message);
            }
        }

        // function addMessage(text, type) {
        //     const chatContainer = document.getElementById('chatContainer');
        //     const welcome = document.querySelector('.welcome-message');
        //     if (welcome) welcome.remove();

        //     const messageDiv = document.createElement('div');
        //     messageDiv.className = `message ${type}`;
            
        //     const contentDiv = document.createElement('div');
        //     contentDiv.className = 'message-content';
        //     contentDiv.textContent = text;
            
        //     messageDiv.appendChild(contentDiv);
        //     chatContainer.appendChild(messageDiv);
        //     chatContainer.scrollTop = chatContainer.scrollHeight;
        // }

        // ADD THIS NEW FUNCTION ANYWHERE IN YOUR JAVASCRIPT
function parseMarkdown(text) {
    // Escape HTML to prevent XSS
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Code blocks (```)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

    // Inline code (`)
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold (**text** or __text__)
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic (*text* or _text_)
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Headers (# ## ###)
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // Blockquotes (>)
    html = html.replace(/^&gt; (.*$)/gm, '<blockquote>$1</blockquote>');

    // Horizontal rule (---)
    html = html.replace(/^---$/gm, '<hr>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

    // Unordered lists (- or *)
    html = html.replace(/^\s*[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  

    // Ordered lists (1. 2. 3.)
    html = html.replace(/^\s*\d+\.\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, function(match) {
        if (!match.includes('<ul>')) {
            return '<ol>' + match + '</ol>';
        }
        return match;
    });

    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>(<h[1-3]>)/g, '$1');
    html = html.replace(/(<\/h[1-3]>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ul>)/g, '$1');
    html = html.replace(/(<\/ul>)<\/p>/g, '$1');
    html = html.replace(/<p>(<ol>)/g, '$1');
    html = html.replace(/(<\/ol>)<\/p>/g, '$1');
    html = html.replace(/<p>(<pre>)/g, '$1');
    html = html.replace(/(<\/pre>)<\/p>/g, '$1');
    html = html.replace(/<p>(<blockquote>)/g, '$1');
    html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
    html = html.replace(/<p>(<hr>)<\/p>/g, '$1');

    return html;
}

        // REPLACE YOUR EXISTING addMessage FUNCTION WITH THIS:
function addMessage(text, type) {
    const chatContainer = document.getElementById('chatContainer');
    const welcome = document.querySelector('.welcome-message');
    if (welcome) welcome.remove();

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // For bot messages, parse markdown
    if (type === 'bot') {
        contentDiv.innerHTML = parseMarkdown(text);
    } else {
        contentDiv.textContent = text;
    }
    
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

        function showTypingIndicator() {
            const chatContainer = document.getElementById('chatContainer');
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message bot';
            typingDiv.id = 'typingIndicator';
            typingDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
            chatContainer.appendChild(typingDiv);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        function removeTypingIndicator() {
            const typing = document.getElementById('typingIndicator');
            if (typing) typing.remove();
        }

        async function sendMessage() {
            const input = document.getElementById('userInput');
            const message = input.value.trim();

            if (!message) return;

            if (isLoading) {
                addMessage('Please wait while the system is loading...', 'system');
                return;
            }

            if (!model) {
                addMessage('AI model is not initialized. Please check the API key.', 'system');
                return;
            }

            if (!knowledgeBase || !universitySummary) {
                addMessage('Knowledge base files are not loaded. Please check the file URLs in CONFIG.', 'system');
                return;
            }

            input.value = '';
            document.getElementById('sendBtn').disabled = true;

            addMessage(message, 'user');
            showTypingIndicator();

            try {
                const response = await queryGemini(message);
                removeTypingIndicator();
                addMessage(response, 'bot');
            } catch (error) {
                removeTypingIndicator();
                addMessage('Sorry, I encountered an error. Please try again.', 'system');
                console.error('Error:', error);
            }

            document.getElementById('sendBtn').disabled = false;
            input.focus();
        }

        async function queryGemini(userQuery) {
            const systemPrompt = `You are a helpful university assistant chatbot. Your role is to answer questions about the university using the provided knowledge base.

UNIVERSITY CONTEXT:
${universitySummary}

KNOWLEDGE BASE:
${knowledgeBase}

INSTRUCTIONS:
0. (Important) a) give response in structured markdown text, b) give proper indentaction and newline character c) and also add bullet points when needed
1. First, check if the answer is available in the KNOWLEDGE BASE above
2. If the information is in the knowledge base, use it to answer the question accurately
3. If the information is NOT in the knowledge base, use the UNIVERSITY CONTEXT to provide a relevant answer
4. Always maintain the context that you're answering about this specific university
5. Be friendly, professional, and concise
6. If you truly don't know something even with the context, politely say so and offer to help with something else
7. Try to give answers in bullet point or lists when needed, example: if user ask list of courses then answre in bullet points.
8. (priority) Try to answere in bullet points 
User Question: ${userQuery}

Please provide a helpful answer:`;

            try {
                const result = await model.generateContent(systemPrompt);
                const response = await result.response;
                const text = response.text();
                return text;
            } catch (error) {
                console.error('Gemini API Error:', error);
                throw new Error('Failed to get response from AI: ' + error.message);
            }
        }
