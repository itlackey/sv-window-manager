<script>
  let { sessionId, data } = $props();
</script>

<div class="terminal-session">
  <h3>💻 Terminal Session: {sessionId}</h3>
  <pre>$ {data.initCommand || 'echo \"...\"'}</pre>
</div>
