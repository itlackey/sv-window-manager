
import ChatSession from './ChatSession.svelte';
import TerminalSession from './TerminalSession.svelte';
import FileBrowserSession from './FileBrowserSession.svelte';
import FileEditorSession from './FileEditorSession.svelte';
import { mount } from 'svelte';

// Mock API data for sessions (sessionId -> {type, data})
const sessionData = {
	abc123: { type: 'chat', data: { welcome: 'Hello Chat!' } },
	term42: { type: 'terminal', data: { initCommand: "echo 'Hello'" } },
	files99: { type: 'filebrowser', data: { rootPath: '/home/user' } },
	edit77: { type: 'fileeditor', data: { filename: 'notes.txt', content: 'Sample text' } }
};

async function fetchSessionInfo(id) {
	// Simulate an API call with a delay
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(sessionData[id] || { type: 'chat', data: {} });
		}, 500);
	});
}
export async function getSessionComponent(sessionId: String) {
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
async function openSession() {
	if (!sessionId) return;

	const contentElem = await getSessionComponent(sessionId);

	// Add the new element as a pane in the BWIN window manager
	if (manager && manager.rootSash) {
		// Find the rightmost leaf pane
		let node = manager.rootSash;
		while (node.rightChild) {
			node = node.rightChild;
		}
		// Add to the right of the rightmost leaf
		manager.addPane(node.id, {
			position: 'right',
			content: contentElem
			// Optionally, add id/size/title here
		});
	}
}