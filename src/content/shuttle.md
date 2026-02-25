# Synergy Interview

**Real-time AI system design interview simulator**

Synergy Interview is an AI-powered mock interview platform designed to closely replicate real system design interviews. Instead of typing responses into a chat interface, users explain their solutions out loud while constructing a live architecture diagram on a shared canvas — mirroring how real interviews actually work.

The system conducts full-length (≈30 minute) interviews, dynamically asking follow-up questions, probing tradeoffs, and reacting to the candidate’s explanation in real time via streamed audio. The AI adapts its behavior based on both the spoken explanation and the evolving diagram state.

The project is fully built and deployed, with active user testing and ongoing iteration driven by feedback.

---

## Why I Built It

Most interview prep tools reduce system design interviews to text-based Q&A. In practice, real interviews are conversational, visual, and iterative. Synergy Interview was built to replicate that experience as closely as possible — including pacing, interruptions, and adaptive questioning — while remaining affordable to run and practical to deploy.

---

## How It Works

Synergy Interview is implemented as a low-latency, multimodal, real-time AI pipeline:

* **Audio Input**: User speech is streamed from the browser to the backend over WebSockets and transcribed using a real-time adaptation of Whisper for speech-to-text.
* **Diagram Context**: The current state of the system design diagram (components, connections, layout) is serialized and streamed alongside the audio transcript.
* **LLM Inference**: Transcribed speech and structured diagram context are fed into a low-latency LLM inference pipeline (Groq) to generate interviewer questions and follow-ups.
* **Audio Output**: LLM responses are converted to streamed text-to-speech (Inworld) and played back to the user in near real time.
* **Session Management**: The system maintains conversational and diagram context across long-running sessions (~30 minutes).

End-to-end response latency typically ranges from **~1s on the low end to ~2.5s on the high end**, enabling a conversational experience that feels natural rather than chat-based.

---

## Engineering Focus Areas

### Real-Time AI Systems

* Designed and implemented a streaming **ASR → LLM → TTS** pipeline optimized for conversational latency
* Coordinated multiple real-time streams (audio input, transcription, diagram state, inference, audio output)

### Multimodal Context Handling

* Combined unstructured speech with structured UI state to influence model behavior
* Ensured the LLM had access to the *current* system design without overloading context windows

### Long-Running Session Management

* Implemented context-management strategies to support 30-minute interviews without degrading model performance
* Preserved full conversation history for future post-interview analysis while optimizing call-time context

### Resource-Constrained Deployment

* Deployed the entire system on a **single DigitalOcean droplet**, balancing cost constraints with real-time performance
* Used Python + FastAPI with WebSockets to keep the backend architecture simple and efficient

---

## Context Management Strategy

Managing long conversations with evolving visual state was a core challenge.

Key techniques:

* **Diagram State Compression**: The LLM only requires the most recent diagram state. Previous diagram states are replaced with lightweight placeholders, while the current full state is passed at inference time.
* **Conversation Truncation**: When sessions exceed context limits, the system retains the conversation opening and the most recent *k* turns, dropping the middle section — a strategy inspired by published research showing minimal degradation in model performance.
* **Separation of Concerns**: Full transcripts and diagram histories are persisted separately for a planned post-interview feedback feature, while inference-time context remains optimized for responsiveness.

---

## Tradeoffs and Design Decisions

### Text-Based LLM vs Native Speech-to-Speech Models

A deliberate decision was made **not** to use an end-to-end speech-to-speech model:

* Native speech-to-speech models were prohibitively expensive for long-running sessions
* Audio-to-audio training data is significantly more limited than text-based corpora, resulting in weaker reasoning performance
* There was no clear mechanism to provide structured visual context (diagram state) to speech-only models

Using text as the reasoning backbone enabled stronger system design reasoning while still delivering a real-time audio experience.

### Voice Activity Detection Limitations

The system uses standard VAD-based ASR, which can occasionally result in interruptions or imperfect turn-taking. While unified speech models may improve this in the future, current cost and capability tradeoffs made a text-centric approach more viable.

---

## User Feedback and Iteration

Early user testing validated the core interaction model:

* The conversational interview format felt realistic and engaging
* Users valued explaining designs verbally while building diagrams

Feedback has primarily focused on:

* Deeper technical dives during follow-up questioning
* Less upfront guidance on solution approaches
* A structured post-interview breakdown comparing the candidate’s design to a reference solution

These insights are guiding the next iteration of the product.
