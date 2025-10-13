<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { WindowManagerShell } from '../lib/index.js';

  const { Story } = defineMeta({
    title: 'Window Manager/Shell',
    component: WindowManagerShell,
    tags: ['a11y'],
    argTypes: {
      title: { control: 'text' },
      config: { control: 'object' }
    },
    args: {
      title: 'Demo Workspace',
      config: {
        appearance: { zoom: 1.0, opacity: 1.0, transparent: false, blur: 0 },
        panel: { visible: true, widthPx: 360 }
      }
    }
  });
</script>

<Story name="Default" />
