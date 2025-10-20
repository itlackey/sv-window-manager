<script>
  // Define props using $props (Svelte 5 runes):contentReference[oaicite:6]{index=6}
  let { sessionId, data } = $props();
</script>

<div class="chat-session">
  <h3>🔹 Chat Session: {sessionId}</h3>
  <p>{#if data.welcome}{data.welcome}{:else}No messages yet...{/if}</p>
</div>
