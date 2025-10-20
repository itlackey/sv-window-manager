
import ChatSession from './ChatSession.svelte';
import TerminalSession from './TerminalSession.svelte';
import FileBrowserSession from './FileBrowserSession.svelte';
import FileEditorSession from './FileEditorSession.svelte';
import { mount } from 'svelte';

type SessionInfo = {
	type: string;
	data: Record<string, any>;
};

// Mock API data for sessions (sessionId -> {type, data})
const sessionData: Record<string, SessionInfo> = {
	abc123: { type: 'chat', data: { welcome: 'Hello Chat!' } },
	term42: { type: 'terminal', data: { initCommand: "echo 'Hello'" } },
	files99: { type: 'filebrowser', data: { rootPath: '/home/user' } },
	edit77: { type: 'fileeditor', data: { filename: 'notes.txt', content: 'Sample text' } }
};

async function fetchSessionInfo(id: string): Promise<SessionInfo> {
	// Simulate an API call with a delay
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(sessionData[id] || { type: 'chat', data: {} });
		}, 500);
	});
}
export async function getSessionComponent(sessionId: string) {
	const info = await fetchSessionInfo(sessionId);
	const type = info.type;
	const data = info.data;

	// Choose the appropriate Svelte component for this session type
	let Component;
	switch (type) {
		case 'chat':
			Component = ChatSession;
			break;
		case 'terminal':
			Component = TerminalSession;
			break;
		case 'filebrowser':
			Component = FileBrowserSession;
			break;
		case 'fileeditor':
			Component = FileEditorSession;
			break;
		default:
			Component = ChatSession;
	}

	// Create a DOM element and mount the chosen Svelte component into it using Svelte 5's imperative API
	const contentElem = document.createElement('div');
	mount(Component, {
		target: contentElem,
		props: { sessionId, data }
	});

	return contentElem;
}
