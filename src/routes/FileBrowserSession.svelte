<script>
  let { sessionId, data } = $props();
</script>

<div class="filebrowser-session">
  <h3>📁 File Browser Session: {sessionId}</h3>
  <p>Root Path: {data.rootPath || '/'}</p>
  <!-- In a real file browser, you'd list files/folders here -->
</div>
