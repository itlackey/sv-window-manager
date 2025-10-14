<script>
  let { sessionId, data } = $props();
</script>

<div class="fileeditor-session">
  <h3>📝 File Editor Session: {sessionId}</h3>
  <p><strong>Editing:</strong> {data.filename || 'Untitled'}</p>
  <textarea readonly rows="5" cols="40">
{data.content || 'File content...'}
  </textarea>
</div>
