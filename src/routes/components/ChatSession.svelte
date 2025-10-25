<script lang="ts">
	let { sessionId, data } = $props();

	// Mock chat messages for demo
	const messages = [
		{ id: 1, type: 'received', text: data.welcome || 'Welcome to Chat Session!', time: '10:30 AM' },
		{
			id: 2,
			type: 'sent',
			text: 'Thanks! This window manager looks great.',
			time: '10:31 AM'
		},
		{
			id: 3,
			type: 'received',
			text: 'It supports drag & drop, resizing, and multiple panes!',
			time: '10:31 AM'
		},
		{ id: 4, type: 'sent', text: 'Perfect for building dynamic layouts.', time: '10:32 AM' }
	];
</script>

<div class="chat-session">
	<div class="chat-header">
		<div class="avatar">💬</div>
		<div class="header-info">
			<h4>Chat Session</h4>
			<span class="session-id">{sessionId}</span>
		</div>
		<div class="status">
			<span class="status-dot"></span>
			Online
		</div>
	</div>

	<div class="chat-messages">
		{#each messages as message (message.id)}
			<div class="message {message.type}">
				<div class="message-bubble">
					<p>{message.text}</p>
					<span class="message-time">{message.time}</span>
				</div>
			</div>
		{/each}
	</div>

	<div class="chat-input">
		<input type="text" placeholder="Type a message..." />
		<button class="send-btn">Send</button>
	</div>
</div>

<style>
	.chat-session {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.chat-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-bottom: 1px solid rgba(0, 0, 0, 0.1);
	}

	.avatar {
		width: 40px;
		height: 40px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
	}

	.header-info {
		flex: 1;
	}

	.header-info h4 {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
	}

	.session-id {
		font-size: 12px;
		opacity: 0.8;
	}

	.status {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		opacity: 0.9;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		background: #4ade80;
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.chat-messages {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		background: #f8f9fa;
	}

	.message {
		display: flex;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.message.received {
		justify-content: flex-start;
	}

	.message.sent {
		justify-content: flex-end;
	}

	.message-bubble {
		max-width: 70%;
		padding: 10px 14px;
		border-radius: 16px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.message.received .message-bubble {
		background: #ffffff;
		border-bottom-left-radius: 4px;
	}

	.message.sent .message-bubble {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-bottom-right-radius: 4px;
	}

	.message-bubble p {
		margin: 0 0 4px 0;
		font-size: 14px;
		line-height: 1.4;
	}

	.message-time {
		font-size: 11px;
		opacity: 0.7;
	}

	.chat-input {
		display: flex;
		gap: 8px;
		padding: 12px 16px;
		background: #ffffff;
		border-top: 1px solid #e5e7eb;
	}

	.chat-input input {
		flex: 1;
		padding: 10px 14px;
		border: 1px solid #d1d5db;
		border-radius: 20px;
		font-size: 14px;
		outline: none;
		transition: border-color 0.2s;
	}

	.chat-input input:focus {
		border-color: #667eea;
	}

	.send-btn {
		padding: 10px 20px;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 20px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition:
			transform 0.2s,
			box-shadow 0.2s;
	}

	.send-btn:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
	}

	.send-btn:active {
		transform: translateY(0);
	}
</style>
